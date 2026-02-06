import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { MessageService, Conversation } from '../../../../core/services/message.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { SearchService, UserSearchResult } from '../../../../core/services/search.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    AvatarModule,
    SkeletonModule,
    InputTextModule,
    BadgeModule,
    MessageModule,
    DialogModule
],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent implements OnInit, OnDestroy {
  private readonly messageService = inject(MessageService);
  private readonly wsService = inject(WebSocketService);
  private readonly searchService = inject(SearchService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject$ = new Subject<string>();

  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  page = signal(1);
  hasMore = signal(false);
  loadingMore = signal(false);
  showNewMessageDialog = signal(false);
  searchUserQuery = signal('');
  searchingUsers = signal(false);
  foundUsers = signal<Array<{id: string; name: string; username: string | null; avatar: string | null}>>([]);

  // Use service signals directly
  readonly conversations = this.messageService.conversations;
  readonly totalUnread = this.messageService.unreadCount;
  
  // Filtered conversations computed from search query
  readonly filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const convs = this.conversations();
    
    if (!query) return convs;
    
    return convs.filter(c => 
      c.participant.name.toLowerCase().includes(query) ||
      (c.participant.username?.toLowerCase().includes(query) ?? false) ||
      c.lastMessage.content.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    // Connect to WebSocket if not connected
    if (!this.wsService.isConnected()) {
      this.wsService.connect();
    }
    
    // Set up debounced user search
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performUserSearch(query);
    });
    
    this.loadConversations();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations() {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(1);
    
    this.messageService.getConversations(1, 20).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.hasMore.set(response.hasMore);
        this.loading.set(false);
        
        // Check presence for all participants
        const userIds = response.conversations.map(c => c.participant.id);
        if (userIds.length > 0) {
          this.wsService.checkPresence(userIds);
        }
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        this.error.set('Não foi possível carregar suas mensagens. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    if (this.loadingMore() || !this.hasMore()) return;
    
    this.loadingMore.set(true);
    const nextPage = this.page() + 1;
    
    this.messageService.getConversations(nextPage, 20).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.page.set(nextPage);
        this.hasMore.set(response.hasMore);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('Error loading more conversations:', err);
        this.loadingMore.set(false);
      }
    });
  }

  isOnline(userId: string): boolean {
    return this.messageService.isOnline(userId);
  }

  formatTimeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return dateObj.toLocaleDateString('pt-BR');
  }

  truncateMessage(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  retry() {
    this.loadConversations();
  }

  openNewMessageDialog() {
    this.showNewMessageDialog.set(true);
    this.searchUserQuery.set('');
    this.foundUsers.set([]);
  }

  closeNewMessageDialog() {
    this.showNewMessageDialog.set(false);
    this.searchUserQuery.set('');
    this.foundUsers.set([]);
  }

  // Trigger debounced user search
  searchUsers(query: string) {
    if (!query || query.length < 2) {
      this.foundUsers.set([]);
      this.searchingUsers.set(false);
      return;
    }
    this.searchingUsers.set(true);
    this.searchSubject$.next(query);
  }

  // Perform the actual search
  private performUserSearch(query: string) {
    if (!query || query.length < 2) {
      this.foundUsers.set([]);
      this.searchingUsers.set(false);
      return;
    }

    this.searchService.searchUsers(query, 1, 10).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const users = response.results.users.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar
        }));
        this.foundUsers.set(users);
        this.searchingUsers.set(false);
      },
      error: (err) => {
        console.error('Error searching users:', err);
        this.foundUsers.set([]);
        this.searchingUsers.set(false);
      }
    });
  }
}
