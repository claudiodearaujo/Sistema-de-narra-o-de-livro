import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, interval, Subscription, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebSocketService } from './websocket.service';

/**
 * Notification type enum
 */
export type NotificationType = 
  | 'LIKE' 
  | 'COMMENT' 
  | 'FOLLOW' 
  | 'MENTION' 
  | 'MESSAGE' 
  | 'BOOK_UPDATE' 
  | 'ACHIEVEMENT' 
  | 'LIVRA_EARNED' 
  | 'SYSTEM';

/**
 * Notification actor
 */
export interface NotificationActor {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
  actor?: NotificationActor | null;
  targetId?: string | null;
  targetType?: 'post' | 'comment' | 'book' | 'chapter' | null;
}

/**
 * Paginated notifications response
 */
export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasMore: boolean;
  unreadCount: number;
}

/**
 * Notification counts
 */
export interface NotificationCounts {
  total: number;
  unread: number;
}

/**
 * Mark read response
 */
export interface MarkReadResponse {
  marked: number;
}

/**
 * Grouped notification (for display)
 */
export interface GroupedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  count: number;
  actors: NotificationActor[];
  targetId?: string;
  targetType?: 'post' | 'comment' | 'book' | 'chapter' | null;
  notifications: Notification[];
}

/**
 * Service for managing notifications
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly wsService = inject(WebSocketService);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  // Reactive state
  private readonly _unreadCount = signal(0);
  private readonly _notifications = signal<Notification[]>([]);
  private wsSubscription?: Subscription;
  private pollSubscription?: Subscription;

  // Public signals
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  constructor() {
    // Subscribe to WebSocket notifications
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
    this.pollSubscription?.unsubscribe();
  }

  /**
   * Setup WebSocket listeners for real-time notifications
   */
  private setupWebSocketListeners(): void {
    // Listen for new notifications
    this.wsSubscription = this.wsService.onEvent<Notification>('notification:new').subscribe(notification => {
      this._notifications.update(notifs => [notification, ...notifs]);
      this._unreadCount.update(count => count + 1);
    });

    // Listen for count updates
    this.wsService.onEvent<{ unread: number }>('notification:count').subscribe(data => {
      this._unreadCount.set(data.unread);
    });
  }

  /**
   * Start polling for notification count (fallback if WebSocket is unavailable)
   */
  startPolling(intervalMs: number = 30000): void {
    this.stopPolling();
    this.pollSubscription = interval(intervalMs).subscribe(() => {
      this.getCount().subscribe();
    });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  /**
   * Get notifications for current user
   */
  getNotifications(page: number = 1, limit: number = 20, type?: NotificationType): Observable<PaginatedNotifications> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (type) {
      params.type = type;
    }

    return this.http.get<PaginatedNotifications>(this.apiUrl, { params }).pipe(
      tap(response => {
        if (page === 1) {
          this._notifications.set(response.notifications);
        } else {
          this._notifications.update(notifs => [...notifs, ...response.notifications]);
        }
        this._unreadCount.set(response.unreadCount);
      })
    );
  }

  /**
   * Get notification counts
   */
  getCount(): Observable<NotificationCounts> {
    return this.http.get<NotificationCounts>(`${this.apiUrl}/count`).pipe(
      tap(counts => this._unreadCount.set(counts.unread))
    );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(notification => {
        this._notifications.update(notifs =>
          notifs.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        this._unreadCount.update(count => Math.max(0, count - 1));
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<MarkReadResponse> {
    return this.http.patch<MarkReadResponse>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this._notifications.update(notifs => notifs.map(n => ({ ...n, isRead: true })));
        this._unreadCount.set(0);
      })
    );
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        this._notifications.update(notifs => notifs.filter(n => n.id !== notificationId));
      })
    );
  }

  /**
   * Delete all notifications
   */
  deleteAll(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(this.apiUrl).pipe(
      tap(() => {
        this._notifications.set([]);
        this._unreadCount.set(0);
      })
    );
  }

  /**
   * Alias for deleteAll
   */
  clearAll(): Observable<{ deleted: number }> {
    return this.deleteAll();
  }

  /**
   * Get icon for notification type
   */
  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      LIKE: 'pi-heart-fill',
      COMMENT: 'pi-comment',
      FOLLOW: 'pi-user-plus',
      MENTION: 'pi-at',
      MESSAGE: 'pi-envelope',
      BOOK_UPDATE: 'pi-book',
      ACHIEVEMENT: 'pi-trophy',
      LIVRA_EARNED: 'pi-star-fill',
      SYSTEM: 'pi-info-circle'
    };
    return icons[type] || 'pi-bell';
  }

  /**
   * Get color for notification type
   */
  getNotificationColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      LIKE: 'text-accent-500',
      COMMENT: 'text-primary-500',
      FOLLOW: 'text-primary-600',
      MENTION: 'text-accent-600',
      MESSAGE: 'text-primary-700',
      BOOK_UPDATE: 'text-livra-500',
      ACHIEVEMENT: 'text-livra-400',
      LIVRA_EARNED: 'text-livra-500',
      SYSTEM: 'text-secondary'
    };
    return colors[type] || 'text-secondary';
  }

  /**
   * Group similar notifications together
   * Groups notifications of the same type for the same target within a time window
   */
  groupNotifications(notifications: Notification[], windowMinutes: number = 60): GroupedNotification[] {
    const groups: Map<string, GroupedNotification> = new Map();

    for (const notif of notifications) {
      // Create a grouping key based on type and target
      // For achievements, use achievementId or the notification id itself to prevent grouping different achievements
      const targetId = notif.data?.postId || notif.data?.bookId || notif.data?.chapterId || notif.data?.achievementId || notif.id;
      const key = `${notif.type}:${targetId}`;

      const existing = groups.get(key);
      
      if (existing) {
        // Check if within time window
        const timeDiff = Math.abs(
          new Date(existing.createdAt).getTime() - new Date(notif.createdAt).getTime()
        );
        const withinWindow = timeDiff < windowMinutes * 60 * 1000;

        if (withinWindow && notif.actor && !existing.actors.find(a => a.id === notif.actor?.id)) {
          existing.count++;
          existing.actors.push(notif.actor);
          existing.notifications.push(notif);
          existing.isRead = existing.isRead && notif.isRead;
          
          // Update message for grouped notifications
          if (existing.count === 2) {
            existing.message = this.getGroupedMessage(existing.type, existing.actors);
          } else if (existing.count > 2) {
            existing.message = this.getGroupedMessage(existing.type, existing.actors);
          }
        } else if (!withinWindow) {
          // Outside time window, create new group
          groups.set(`${key}:${notif.id}`, this.createGroupFromNotification(notif));
        }
      } else {
        groups.set(key, this.createGroupFromNotification(notif));
      }
    }

    // Sort by most recent
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private createGroupFromNotification(notif: Notification): GroupedNotification {
    return {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
      count: 1,
      actors: notif.actor ? [notif.actor] : [],
      targetId: notif.data?.postId || notif.data?.bookId,
      targetType: notif.targetType,
      notifications: [notif]
    };
  }

  private getGroupedMessage(type: NotificationType, actors: NotificationActor[]): string {
    const firstName = actors[0]?.name || 'Alguém';
    const othersCount = actors.length - 1;

    switch (type) {
      case 'LIKE':
        return othersCount === 1
          ? `${firstName} e ${actors[1]?.name} curtiram seu post`
          : `${firstName} e mais ${othersCount} pessoas curtiram seu post`;
      case 'COMMENT':
        return othersCount === 1
          ? `${firstName} e ${actors[1]?.name} comentaram no seu post`
          : `${firstName} e mais ${othersCount} pessoas comentaram no seu post`;
      case 'FOLLOW':
        return othersCount === 1
          ? `${firstName} e ${actors[1]?.name} começaram a seguir você`
          : `${firstName} e mais ${othersCount} pessoas começaram a seguir você`;
      default:
        return `${firstName} e mais ${othersCount} pessoas`;
    }
  }
}
