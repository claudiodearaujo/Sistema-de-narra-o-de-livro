import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebSocketService } from './websocket.service';

/**
 * Conversation participant info
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
export interface Message {
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
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  participant: ConversationParticipant;
}

/**
 * Send message response
 */
export interface SendMessageResponse {
  message: Message;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Mark as read response
 */
export interface MarkAsReadResponse {
  count: number;
}

/**
 * Typing event data
 */
export interface TypingEvent {
  userId: string;
  isTyping: boolean;
}

/**
 * Online status event
 */
export interface OnlineStatusEvent {
  userId: string;
}

/**
 * Service for managing direct messages
 */
@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly wsService = inject(WebSocketService);
  private readonly apiUrl = `${environment.apiUrl}/messages`;

  // Reactive state
  private readonly _unreadCount = signal(0);
  private readonly _conversations = signal<Conversation[]>([]);
  private readonly _activeConversation = signal<string | null>(null);
  private readonly _typingUsers = signal<Set<string>>(new Set());
  private readonly _onlineUsers = signal<Set<string>>(new Set());

  // Public readonly signals
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly conversations = this._conversations.asReadonly();
  readonly activeConversation = this._activeConversation.asReadonly();
  
  readonly isUserTyping = computed(() => {
    const active = this._activeConversation();
    if (!active) return false;
    return this._typingUsers().has(active);
  });

  constructor() {
    this.setupWebSocketListeners();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketListeners(): void {
    // New message received
    this.wsService.on<{ message: Message }>('message:new').subscribe(data => {
      this.handleNewMessage(data.message);
    });

    // Messages read by other user
    this.wsService.on<{ readBy: string; conversationWith: string }>('message:read').subscribe(data => {
      this.handleMessagesRead(data);
    });

    // Typing indicator
    this.wsService.on<TypingEvent>('message:typing').subscribe(data => {
      this.handleTyping(data);
    });

    // User came online
    this.wsService.on<OnlineStatusEvent>('user:online').subscribe(data => {
      this._onlineUsers.update(set => {
        const newSet = new Set(set);
        newSet.add(data.userId);
        return newSet;
      });
    });

    // User went offline
    this.wsService.on<OnlineStatusEvent>('user:offline').subscribe(data => {
      this._onlineUsers.update(set => {
        const newSet = new Set(set);
        newSet.delete(data.userId);
        return newSet;
      });
    });
  }

  /**
   * Handle new message from WebSocket
   */
  private handleNewMessage(message: Message): void {
    // Update unread count if not in active conversation
    if (this._activeConversation() !== message.senderId) {
      this._unreadCount.update(count => count + 1);
    }

    // Update conversations list
    this._conversations.update(convs => {
      const index = convs.findIndex(c => c.id === message.senderId);
      if (index >= 0) {
        const updated = [...convs];
        const conv = { ...updated[index] };
        conv.lastMessage = {
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt,
          isRead: false
        };
        if (this._activeConversation() !== message.senderId) {
          conv.unreadCount++;
        }
        // Move to top
        updated.splice(index, 1);
        return [conv, ...updated];
      }
      return convs;
    });
  }

  /**
   * Handle messages read notification
   */
  private handleMessagesRead(data: { readBy: string; conversationWith: string }): void {
    // Could update UI to show "read" status on messages
    console.log('Messages read by:', data.readBy);
  }

  /**
   * Handle typing indicator
   */
  private handleTyping(data: TypingEvent): void {
    this._typingUsers.update(set => {
      const newSet = new Set(set);
      if (data.isTyping) {
        newSet.add(data.userId);
        // Auto-remove after 3 seconds
        setTimeout(() => {
          this._typingUsers.update(s => {
            const updated = new Set(s);
            updated.delete(data.userId);
            return updated;
          });
        }, 3000);
      } else {
        newSet.delete(data.userId);
      }
      return newSet;
    });
  }

  /**
   * Check if a user is online
   */
  isOnline(userId: string): boolean {
    return this._onlineUsers().has(userId);
  }

  /**
   * Set active conversation (for tracking unread)
   */
  setActiveConversation(userId: string | null): void {
    this._activeConversation.set(userId);
    if (userId) {
      this.wsService.emit('conversation:join', userId);
    }
  }

  /**
   * Leave current conversation
   */
  leaveConversation(userId: string): void {
    this.wsService.emit('conversation:leave', userId);
    if (this._activeConversation() === userId) {
      this._activeConversation.set(null);
    }
  }

  /**
   * Request online status for users
   */
  checkPresence(userIds: string[]): void {
    this.wsService.emit('presence:check', userIds);
  }

  // ===== API Methods =====

  /**
   * Get conversations list (inbox)
   */
  getConversations(page: number = 1, limit: number = 20): Observable<PaginatedConversations> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedConversations>(`${this.apiUrl}/conversations`, { params }).pipe(
      tap(response => {
        if (page === 1) {
          this._conversations.set(response.conversations);
        } else {
          this._conversations.update(convs => [...convs, ...response.conversations]);
        }
        this._unreadCount.set(response.totalUnread);
      })
    );
  }

  /**
   * Get messages with a specific user
   */
  getMessages(userId: string, page: number = 1, limit: number = 50): Observable<PaginatedMessages> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedMessages>(`${this.apiUrl}/${userId}`, { params });
  }

  /**
   * Send a message to a user
   */
  sendMessage(userId: string, content: string): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.apiUrl}/${userId}`, { content }).pipe(
      tap(response => {
        // Update conversations list
        this._conversations.update(convs => {
          const index = convs.findIndex(c => c.id === userId);
          if (index >= 0) {
            const updated = [...convs];
            const conv = { ...updated[index] };
            conv.lastMessage = {
              content: response.message.content,
              senderId: response.message.senderId,
              createdAt: response.message.createdAt,
              isRead: true
            };
            updated.splice(index, 1);
            return [conv, ...updated];
          }
          return convs;
        });
      })
    );
  }

  /**
   * Mark messages from a user as read
   */
  markAsRead(userId: string): Observable<MarkAsReadResponse> {
    return this.http.put<MarkAsReadResponse>(`${this.apiUrl}/${userId}/read`, {}).pipe(
      tap(response => {
        if (response.count > 0) {
          this._unreadCount.update(count => Math.max(0, count - response.count));
          
          // Update conversation unread count
          this._conversations.update(convs => 
            convs.map(c => c.id === userId ? { ...c, unreadCount: 0 } : c)
          );
        }
      })
    );
  }

  /**
   * Get total unread count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => this._unreadCount.set(response.unreadCount))
    );
  }

  /**
   * Send typing indicator
   */
  sendTyping(userId: string, isTyping: boolean = true): void {
    this.wsService.emit('message:typing', { receiverId: userId, isTyping });
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/message/${messageId}`);
  }

  /**
   * Refresh unread count (useful after app resume)
   */
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}
