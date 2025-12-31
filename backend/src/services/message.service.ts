import prisma from '../lib/prisma';
import { Message, User } from '@prisma/client';

/**
 * Message validation constants
 */
const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 2000;
const MESSAGES_PER_PAGE = 50;
const CONVERSATIONS_PER_PAGE = 20;

/**
 * Participant info for conversations
 */
export interface ConversationParticipant {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  isOnline?: boolean;
}

/**
 * Last message preview
 */
export interface LastMessage {
  content: string;
  senderId: string;
  createdAt: Date;
  isRead: boolean;
}

/**
 * Conversation with participant and last message
 */
export interface Conversation {
  id: string;
  participant: ConversationParticipant;
  lastMessage: LastMessage;
  unreadCount: number;
}

/**
 * Paginated conversations response
 */
export interface PaginatedConversations {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalUnread: number;
}

/**
 * Message with sender info
 */
export interface MessageWithSender {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  sender: ConversationParticipant;
}

/**
 * Paginated messages response
 */
export interface PaginatedMessages {
  messages: MessageWithSender[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  participant: ConversationParticipant;
}

/**
 * Send message DTO
 */
export interface SendMessageDto {
  content: string;
}

/**
 * Send message response
 */
export interface SendMessageResponse {
  message: MessageWithSender;
}

// WebSocket emitter reference
let websocketEmitter: ((userId: string, event: string, data: any) => void) | null = null;

// Online users set (in production, use Redis)
const onlineUsers = new Set<string>();

/**
 * Sanitize message content
 */
function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/<[^>]*>/g, '')  // Remove HTML
    .replace(/\s+/g, ' ')      // Multiple spaces to single
    .replace(/\0/g, '');       // Remove null bytes
}

/**
 * Validate message content
 */
function validateContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length < MESSAGE_MIN_LENGTH) {
    return { valid: false, error: 'Mensagem não pode ser vazia' };
  }
  if (content.length > MESSAGE_MAX_LENGTH) {
    return { valid: false, error: `Mensagem muito longa (máximo ${MESSAGE_MAX_LENGTH} caracteres)` };
  }
  return { valid: true };
}

/**
 * Service for managing direct messages
 */
class MessageService {
  /**
   * Set WebSocket emitter for real-time messages
   */
  setWebSocketEmitter(emitter: (userId: string, event: string, data: any) => void): void {
    websocketEmitter = emitter;
  }

  /**
   * Mark user as online
   */
  setUserOnline(userId: string): void {
    onlineUsers.add(userId);
    // Broadcast online status to all connected users
    if (websocketEmitter) {
      websocketEmitter('broadcast', 'user:online', { userId });
    }
  }

  /**
   * Mark user as offline
   */
  setUserOffline(userId: string): void {
    onlineUsers.delete(userId);
    if (websocketEmitter) {
      websocketEmitter('broadcast', 'user:offline', { userId });
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return onlineUsers.has(userId);
  }

  /**
   * Get online users list
   */
  getOnlineUsers(): string[] {
    return Array.from(onlineUsers);
  }

  /**
   * Get conversations for a user (inbox)
   */
  async getConversations(
    userId: string,
    page: number = 1,
    limit: number = CONVERSATIONS_PER_PAGE
  ): Promise<PaginatedConversations> {
    const skip = (page - 1) * limit;

    // Get all messages where user is sender or receiver
    // Group by the other participant
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        receiver: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group messages by conversation (other participant)
    const conversationsMap = new Map<string, {
      participant: ConversationParticipant;
      lastMessage: LastMessage;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          participant: {
            ...otherUser,
            isOnline: this.isUserOnline(otherUserId)
          },
          lastMessage: {
            content: msg.content,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            isRead: msg.isRead
          },
          unreadCount: 0
        });
      }

      // Count unread messages from this participant
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationsMap.get(otherUserId)!;
        conv.unreadCount++;
      }
    }

    // Convert to array and sort by last message date
    const allConversations = Array.from(conversationsMap.entries())
      .map(([id, data]) => ({
        id,
        ...data
      }))
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());

    // Calculate total unread
    const totalUnread = allConversations.reduce((sum, c) => sum + c.unreadCount, 0);

    // Paginate
    const paginatedConversations = allConversations.slice(skip, skip + limit);

    return {
      conversations: paginatedConversations,
      total: allConversations.length,
      page,
      limit,
      hasMore: skip + paginatedConversations.length < allConversations.length,
      totalUnread
    };
  }

  /**
   * Get messages with a specific user
   */
  async getMessages(
    userId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = MESSAGES_PER_PAGE
  ): Promise<PaginatedMessages> {
    const skip = (page - 1) * limit;

    // Get the other user's info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, username: true, avatar: true }
    });

    if (!otherUser) {
      throw new Error('Usuário não encontrado');
    }

    // Get messages between the two users
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        },
        include: {
          sender: {
            select: { id: true, name: true, username: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        }
      })
    ]);

    // Mark messages as read (messages received by current user)
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    // Notify sender that messages were read
    if (websocketEmitter) {
      websocketEmitter(otherUserId, 'message:read', { 
        readBy: userId,
        conversationWith: otherUserId 
      });
    }

    const enrichedMessages: MessageWithSender[] = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      sender: msg.sender
    }));

    return {
      messages: enrichedMessages.reverse(), // Oldest first for chat display
      total,
      page,
      limit,
      hasMore: skip + messages.length < total,
      participant: {
        ...otherUser,
        isOnline: this.isUserOnline(otherUserId)
      }
    };
  }

  /**
   * Send a message to a user
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    dto: SendMessageDto
  ): Promise<SendMessageResponse> {
    // Cannot message yourself
    if (senderId === receiverId) {
      throw new Error('Você não pode enviar mensagem para si mesmo');
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true }
    });

    if (!receiver) {
      throw new Error('Usuário não encontrado');
    }

    // Validate and sanitize content
    const sanitizedContent = sanitizeContent(dto.content);
    const validation = validateContent(sanitizedContent);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: sanitizedContent
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    });

    const messageWithSender: MessageWithSender = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: message.sender
    };

    // Emit real-time message via WebSocket
    if (websocketEmitter) {
      websocketEmitter(receiverId, 'message:new', {
        message: messageWithSender
      });
    }

    // Create notification for receiver
    await this.createMessageNotification(receiverId, senderId, sanitizedContent);

    return { message: messageWithSender };
  }

  /**
   * Mark all messages from a user as read
   */
  async markAsRead(userId: string, otherUserId: string): Promise<{ count: number }> {
    const result = await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    // Notify sender that messages were read
    if (websocketEmitter) {
      websocketEmitter(otherUserId, 'message:read', {
        readBy: userId,
        conversationWith: otherUserId
      });
    }

    return { count: result.count };
  }

  /**
   * Get total unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }

  /**
   * Delete a message (soft delete or hard delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('Mensagem não encontrada');
    }

    // Only sender can delete their own message
    if (message.senderId !== userId) {
      throw new Error('Você não pode deletar esta mensagem');
    }

    await prisma.message.delete({
      where: { id: messageId }
    });
  }

  /**
   * Emit typing status
   */
  emitTyping(senderId: string, receiverId: string, isTyping: boolean): void {
    if (websocketEmitter) {
      websocketEmitter(receiverId, 'message:typing', {
        userId: senderId,
        isTyping
      });
    }
  }

  /**
   * Create notification for new message
   */
  private async createMessageNotification(
    receiverId: string,
    senderId: string,
    content: string
  ): Promise<void> {
    try {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true, username: true }
      });

      if (!sender) return;

      const preview = content.length > 50 
        ? content.substring(0, 50) + '...' 
        : content;

      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'MESSAGE',
          title: 'Nova mensagem',
          message: `${sender.name}: ${preview}`,
          data: { userId: senderId }
        }
      });
    } catch (error) {
      console.error('[MessageService] Error creating notification:', error);
    }
  }
}

export const messageService = new MessageService();
