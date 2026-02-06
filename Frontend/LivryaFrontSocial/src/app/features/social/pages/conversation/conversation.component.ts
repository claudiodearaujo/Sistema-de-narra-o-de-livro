import { Component, signal, OnInit, OnDestroy, ElementRef, AfterViewChecked, inject, computed, viewChild } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';

import { MessageService, Message, ConversationParticipant } from '../../../../core/services/message.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuthService } from 'src/app/features/auth/services/auth.service';

/**
 * Formatted message for display
 */
interface DisplayMessage {
  id: string;
  content: string;
  isMe: boolean;
  time: string;
  isRead: boolean;
}

/**
 * Conversation Component
 * 
 * Direct message conversation between two users with real-time updates.
 */
@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    AvatarModule,
    InputTextModule,
    MessageModule,
    SkeletonModule
],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.css'
})
export class ConversationComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly messagesContainer = viewChild.required<ElementRef>('messagesContainer');

  private readonly messageService = inject(MessageService);
  private readonly wsService = inject(WebSocketService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);

  private readonly destroy$ = new Subject<void>();
  private readonly typing$ = new Subject<string>();

  loading = signal(true);
  error = signal<string | null>(null);
  sending = signal(false);
  loadingMore = signal(false);

  participant = signal<ConversationParticipant | null>(null);
  messages = signal<Message[]>([]);
  newMessage = '';

  page = signal(1);
  hasMore = signal(false);

  private shouldScroll = false;
  private userId: string = '';
  private currentUserId: string = '';

  // Computed display messages
  readonly displayMessages = computed(() => {
    return this.messages().map(msg => this.formatMessage(msg));
  });

  // Online status
  readonly isOnline = computed(() => {
    const p = this.participant();
    return p ? this.messageService.isOnline(p.id) : false;
  });

  // Typing indicator
  readonly isTyping = this.messageService.isUserTyping;

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['userId'];
    this.currentUserId = this.authService.currentUser()?.id || '';

    // Connect WebSocket if needed
    if (!this.wsService.isConnected()) {
      this.wsService.connect();
    }

    // Join conversation room
    this.messageService.setActiveConversation(this.userId);

    // Setup typing debounce
    this.typing$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(text => {
      this.messageService.sendTyping(this.userId, text.length > 0);
    });

    // Listen for new messages via WebSocket
    this.wsService.on<{ message: Message }>('message:new').pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      if (data.message.senderId === this.userId) {
        this.messages.update(msgs => [...msgs, data.message]);
        this.shouldScroll = true;
        // Mark as read since we're viewing
        this.messageService.markAsRead(this.userId).subscribe();
      }
    });

    this.loadConversation();
  }

  ngOnDestroy(): void {
    // Leave conversation room
    this.messageService.leaveConversation(this.userId);
    this.messageService.sendTyping(this.userId, false);

    this.destroy$.next();
    this.destroy$.complete();
    this.typing$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private loadConversation(): void {
    this.loading.set(true);
    this.error.set(null);

    this.messageService.getMessages(this.userId, 1, 50).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.participant.set(response.participant);
        this.messages.set(response.messages.reverse()); // Oldest first for display
        this.hasMore.set(response.hasMore);
        this.loading.set(false);
        this.shouldScroll = true;

        // Mark messages as read
        this.messageService.markAsRead(this.userId).subscribe();

        // Check online status
        this.wsService.checkPresence([this.userId]);
      },
      error: (err) => {
        console.error('Error loading conversation:', err);
        this.error.set(this.translocoService.translate('social.conversation.loadError'));
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    const nextPage = this.page() + 1;

    this.messageService.getMessages(this.userId, nextPage, 50).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Prepend older messages
        this.messages.update(msgs => [...response.messages.reverse(), ...msgs]);
        this.page.set(nextPage);
        this.hasMore.set(response.hasMore);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      }
    });
  }

  private formatMessage(msg: Message): DisplayMessage {
    return {
      id: msg.id,
      content: msg.content,
      isMe: msg.senderId === this.currentUserId,
      time: this.formatTime(msg.createdAt),
      isRead: msg.isRead
    };
  }

  private formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const lang = this.translocoService.getActiveLang();
    return d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  }

  onTyping(): void {
    this.typing$.next(this.newMessage);
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || this.sending()) return;

    this.sending.set(true);

    this.messageService.sendMessage(this.userId, content).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.messages.update(msgs => [...msgs, response.message]);
        this.newMessage = '';
        this.shouldScroll = true;
        this.sending.set(false);
        this.messageService.sendTyping(this.userId, false);
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.sending.set(false);
        // Could show toast error here
      }
    });
  }

  deleteMessage(messageId: string): void {
    this.messageService.deleteMessage(messageId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messages.update(msgs => msgs.filter(m => m.id !== messageId));
      }
    });
  }

  private scrollToBottom(): void {
    try {
      const messagesContainer = this.messagesContainer();
      if (messagesContainer?.nativeElement) {
        messagesContainer.nativeElement.scrollTop = messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  goBack(): void {
    this.router.navigate(['/social/messages']);
  }

  goToProfile(): void {
    const p = this.participant();
    if (p?.username) {
      this.router.navigate(['/social/profile', p.username]);
    } else if (p?.id) {
      this.router.navigate(['/social/profile', p.id]);
    }
  }

  retry(): void {
    this.loadConversation();
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
