import { Component, computed, signal, OnInit, OnDestroy, HostListener, inject } from '@angular/core';

import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { MenuItem, MessageService as PrimeMessageService } from 'primeng/api';

// Components
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../core/models/post.model';

import { NotificationService } from '../../../core/services/notification.service';
import { MessageService } from '../../../core/services/message.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { PostComposerComponent } from '../../shared';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Social Layout Component
 * 
 * Main layout for the social network module with:
 * - Header with logo, search, and user actions
 * - Sidebar navigation (desktop)
 * - Bottom navigation (mobile)
 * - Main content area with router outlet
 */
@Component({
  selector: 'app-social-layout',
  standalone: true,
  imports: [
    RouterModule,
    RouterOutlet,
    TranslocoModule,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    TooltipModule,
    RippleModule,
    MenuModule,
    ToastModule,
    PostComposerComponent
],
  providers: [PrimeMessageService],
  templateUrl: './social-layout.component.html',
  styleUrl: './social-layout.component.css'
})
export class SocialLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly msgService = inject(MessageService);
  private readonly wsService = inject(WebSocketService);
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);
  private readonly primeMessageService = inject(PrimeMessageService);
  private readonly translocoService = inject(TranslocoService);

  // Signals
  isMobile = signal(false);
  showPostComposer = signal(false);
  showRightSidebar = signal(true);
  currentUser = computed(() => this.authService.currentUser());

  // Real-time counts from services
  readonly notificationCount = computed(() => {
    const count = this.notificationService.unreadCount();
    return count > 0 ? (count > 99 ? '99+' : count.toString()) : '';
  });

  readonly messageCount = computed(() => {
    const count = this.msgService.unreadCount();
    return count > 0 ? (count > 99 ? '99+' : count.toString()) : '';
  });

  // Navigation items
  navItems = computed(() => [
    { label: this.translocoService.translate('social.layout.feed'), icon: 'pi pi-home', route: '/social/feed' },
    { label: this.translocoService.translate('social.layout.explore'), icon: 'pi pi-compass', route: '/social/explore' },
    { label: this.translocoService.translate('social.layout.groups'), icon: 'pi pi-users', route: '/social/groups' },
    { label: this.translocoService.translate('social.layout.search'), icon: 'pi pi-search', route: '/social/search' },
    { label: this.translocoService.translate('social.layout.notifications'), icon: 'pi pi-bell', route: '/social/notifications' },
    { label: this.translocoService.translate('social.layout.messages'), icon: 'pi pi-envelope', route: '/social/messages' },
    { label: this.translocoService.translate('social.layout.profile'), icon: 'pi pi-user', route: '/social/profile' },
  ]);

  mobileNavItems = computed(() => [
    { label: this.translocoService.translate('social.layout.feed'), icon: 'pi pi-home', route: '/social/feed' },
    { label: this.translocoService.translate('social.layout.explore'), icon: 'pi pi-compass', route: '/social/explore' },
    { label: this.translocoService.translate('social.layout.groups'), icon: 'pi pi-users', route: '/social/groups' },
    { label: this.translocoService.translate('social.layout.search'), icon: 'pi pi-search', route: '/social/search' },
    { label: this.translocoService.translate('social.layout.profile'), icon: 'pi pi-user', route: '/social/profile' },
  ]);

  userMenuItems = computed<MenuItem[]>(() => [
    {
      label: this.translocoService.translate('social.layout.myProfile'),
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/social/profile'])
    },
    {
      label: this.translocoService.translate('social.layout.settings'),
      icon: 'pi pi-cog',
      command: () => this.router.navigate(['/auth/profile'])
    },
    {
      label: this.translocoService.translate('social.layout.writerArea'),
      icon: 'pi pi-pencil',
      command: () => this.router.navigate(['/writer'])
    },
    { separator: true },
    {
      label: this.translocoService.translate('social.layout.logout'),
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ]);

  private routerSubscription?: Subscription;
  private currentRoute = '';

  constructor() {
    this.checkMobile();
  }

  ngOnInit(): void {
    // Connect WebSocket for real-time updates
    if (!this.wsService.isConnected()) {
      this.wsService.connect();
    }

    // Load initial counts
    this.notificationService.getCount().subscribe();
    this.msgService.getUnreadCount().subscribe();

    // Track current route for active state
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });

    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  goToFeed(): void {
    this.router.navigate(['/social/feed']);
  }

  goToSearch(): void {
    this.router.navigate(['/social/search']);
  }

  goToNotifications(): void {
    this.router.navigate(['/social/notifications']);
  }

  goToMessages(): void {
    this.router.navigate(['/social/messages']);
  }

  openNewPost(): void {
    this.showPostComposer.set(true);
  }

  onPostCreated(post: Post): void {
    // Show success toast
    this.primeMessageService.add({
      severity: 'success',
      summary: this.translocoService.translate('social.posts.success'),
      detail: this.translocoService.translate('social.posts.postPublished')
    });

    // Navigate to feed if not already there
    if (this.router.url !== '/social/feed') {
      this.router.navigate(['/social/feed']);
    } else {
      // Force refresh by navigating away and back
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/social/feed']);
      });
    }
  }

  private logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
