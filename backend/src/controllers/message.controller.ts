import { Request, Response } from 'express';
import { messageService } from '../services/message.service';

/**
 * GET /api/messages/conversations - Get user's conversations
 */
export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await messageService.getConversations(userId, page, limit);
    res.json(result);
  } catch (error: any) {
    console.error('[MessageController] Error getting conversations:', error.message);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
}

/**
 * GET /api/messages/unread-count - Get total unread message count
 */
export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const count = await messageService.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error: any) {
    console.error('[MessageController] Error getting unread count:', error.message);
    res.status(500).json({ error: 'Erro ao buscar contagem de mensagens' });
  }
}

/**
 * GET /api/messages/:userId - Get messages with a specific user
 */
export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await messageService.getMessages(currentUserId, userId, page, limit);
    res.json(result);
  } catch (error: any) {
    console.error('[MessageController] Error getting messages:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
  }
}

/**
 * POST /api/messages/:userId - Send a message to a user
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const senderId = req.user?.userId;
    if (!senderId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { userId: receiverId } = req.params;
    if (!receiverId) {
      res.status(400).json({ error: 'ID do destinatário é obrigatório' });
      return;
    }

    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
      return;
    }

    const result = await messageService.sendMessage(senderId, receiverId, { content });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('[MessageController] Error sending message:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('si mesmo') || error.message.includes('vazia') || error.message.includes('longa')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  }
}

/**
 * PUT /api/messages/:userId/read - Mark all messages from a user as read
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { userId: otherUserId } = req.params;
    if (!otherUserId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const result = await messageService.markAsRead(currentUserId, otherUserId);
    res.json(result);
  } catch (error: any) {
    console.error('[MessageController] Error marking as read:', error.message);
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
}

/**
 * DELETE /api/messages/:messageId - Delete a message
 */
export async function deleteMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { messageId } = req.params;
    if (!messageId) {
      res.status(400).json({ error: 'ID da mensagem é obrigatório' });
      return;
    }

    await messageService.deleteMessage(messageId, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[MessageController] Error deleting message:', error.message);
    
    if (error.message.includes('não encontrada')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('não pode')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao deletar mensagem' });
    }
  }
}

/**
 * POST /api/messages/:userId/typing - Notify typing status
 */
export async function notifyTyping(req: Request, res: Response): Promise<void> {
  try {
    const senderId = req.user?.userId;
    if (!senderId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { userId: receiverId } = req.params;
    if (!receiverId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const { isTyping } = req.body;
    messageService.emitTyping(senderId, receiverId, isTyping ?? true);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('[MessageController] Error notifying typing:', error.message);
    res.status(500).json({ error: 'Erro ao enviar status de digitação' });
  }
}

/**
 * GET /api/messages/online - Get online users
 */
export async function getOnlineUsers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const onlineUsers = messageService.getOnlineUsers();
    res.json({ users: onlineUsers });
  } catch (error: any) {
    console.error('[MessageController] Error getting online users:', error.message);
    res.status(500).json({ error: 'Erro ao buscar usuários online' });
  }
}

export const messageController = {
  getConversations,
  getUnreadCount,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  notifyTyping,
  getOnlineUsers
};
