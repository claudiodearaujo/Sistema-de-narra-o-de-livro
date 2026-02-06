import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { TabsModule } from 'primeng/tabs';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  NotificationService,
  Notification,
  NotificationType,
  GroupedNotification
} from '../../../../core/services/notification.service';

interface FilterOption {
  labelKey: string;
  value: NotificationType | null;
  icon: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    AvatarModule,
    SkeletonModule,
    BadgeModule,
    TabsModule,
    SelectButtonModule,
    TooltipModule
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  notifications = signal<Notification[]>([]);
  hasMore = signal(false);
  currentPage = 1;
  readonly pageSize = 20;

  // Grouping toggle
  groupingEnabled = signal(true);

  // Filter by type
  selectedFilter = signal<NotificationType | null>(null);
  filterOptions: FilterOption[] = [
    { labelKey: 'social.notifications.filters.all', value: null, icon: 'pi pi-bell' },
    { labelKey: 'social.notifications.filters.likes', value: 'LIKE', icon: 'pi pi-heart' },
    { labelKey: 'social.notifications.filters.comments', value: 'COMMENT', icon: 'pi pi-comment' },
    { labelKey: 'social.notifications.filters.followers', value: 'FOLLOW', icon: 'pi pi-user-plus' },
    { labelKey: 'social.notifications.filters.mentions', value: 'MENTION', icon: 'pi pi-at' },
    { labelKey: 'social.notifications.filters.achievements', value: 'ACHIEVEMENT', icon: 'pi pi-trophy' }
  ];

  getFilterLabel(labelKey: string): string {
    return this.translocoService.translate(labelKey);
  }

  // Computed values
  unreadCount = computed(() => this.notificationService.unreadCount());
  
  // Grouped notifications
  groupedNotifications = computed(() => {
    if (!this.groupingEnabled()) {
      return null;
    }
    const notifs = this.filteredNotifications();
    return this.notificationService.groupNotifications(notifs);
  });
  
  // Filtered notifications
  filteredNotifications = computed(() => {
    const filter = this.selectedFilter();
    const notifs = this.notifications();
    if (!filter) return notifs;
    return notifs.filter(n => n.type === filter);
  });

  ngOnInit() {
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(loadMore = false) {
    if (!loadMore) {
      this.loading.set(true);
      this.currentPage = 1;
    }

    this.notificationService.getNotifications(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (loadMore) {
          this.notifications.update(current => [...current, ...response.notifications]);
        } else {
          this.notifications.set(response.notifications);
        }
        this.hasMore.set(this.currentPage < response.pages);
        this.loading.set(false);
      },
      error: (err: Error) => {
        console.error('[Notifications] Error loading:', err);
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    if (!this.hasMore()) return;
    this.currentPage++;
    this.loadNotifications(true);
  }

  getNotificationIcon(type: string): string {
    return 'pi ' + this.notificationService.getNotificationIcon(type as NotificationType);
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      LIKE: 'var(--color-accent-500)',
      COMMENT: 'var(--color-primary-500)',
      FOLLOW: 'var(--color-primary-600)',
      MENTION: 'var(--color-accent-600)',
      MESSAGE: 'var(--color-primary-400)',
      ACHIEVEMENT: 'var(--color-livra)',
      LIVRA_EARNED: 'var(--color-livra)',
      SYSTEM: 'var(--color-primary-500)',
      BOOK_UPDATE: 'var(--color-primary-400)'
    };
    return colors[type.toUpperCase()] || 'var(--text-secondary)';
  }

  formatTimeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return d.toLocaleDateString('pt-BR');
  }

  getNotificationLink(notification: Notification | GroupedNotification): string[] | null {
    const data = 'data' in notification ? notification.data : null;
    if (notification.targetType === 'post' && (notification.targetId || data?.postId)) {
      return ['/social/post', notification.targetId || data?.postId];
    }
    // For grouped notifications, check actors
    if ('actors' in notification && notification.actors.length > 0) {
      const actor = notification.actors[0];
      if (actor.username) {
        return ['/social/profile', actor.username];
      }
    }
    return null;
  }

  toggleGrouping(): void {
    this.groupingEnabled.update(v => !v);
  }

  setFilter(type: NotificationType | null): void {
    this.selectedFilter.set(type);
  }

  markAsRead(notification: Notification | GroupedNotification) {
    // For grouped notifications, mark all as read
    if ('notifications' in notification && notification.notifications) {
      const unreadIds = notification.notifications
        .filter(n => !n.isRead)
        .map(n => n.id);
      
      for (const id of unreadIds) {
        this.notificationService.markAsRead(id).pipe(takeUntil(this.destroy$)).subscribe();
      }
      this.notifications.update(list => 
        list.map(n => unreadIds.includes(n.id) ? { ...n, isRead: true } : n)
      );
    } else if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.notifications.update(list => 
            list.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
          );
        },
        error: (err: Error) => console.error('[Notifications] Error marking as read:', err)
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      },
      error: (err: Error) => console.error('[Notifications] Error marking all as read:', err)
    });
  }

  deleteNotification(notificationId: string, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(list => list.filter(n => n.id !== notificationId));
      },
      error: (err: Error) => console.error('[Notifications] Error deleting:', err)
    });
  }

  clearAll() {
    this.notificationService.clearAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.set([]);
      },
      error: (err: Error) => console.error('[Notifications] Error clearing all:', err)
    });
  }

  getUnreadNotifications(): Notification[] {
    return this.filteredNotifications().filter(n => !n.isRead);
  }

  getReadNotifications(): Notification[] {
    return this.filteredNotifications().filter(n => n.isRead);
  }
}
