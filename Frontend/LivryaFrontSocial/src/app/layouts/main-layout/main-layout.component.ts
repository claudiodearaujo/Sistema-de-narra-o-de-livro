import { Component, computed, inject, OnInit, OnDestroy } from '@angular/core';

import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { LivraBalanceComponent } from 'src/app/features/shared/livra-balance/livra-balance.component';
import { BetaBannerComponent } from 'src/app/features/shared/beta-banner/beta-banner.component';
import { LanguageSelectorComponent } from 'src/app/features/shared/language-selector/language-selector.component';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { WebSocketService } from 'src/app/core/services/websocket.service';

/**
 * Main layout for authenticated areas of the application.
 * Contains navigation menu, user avatar dropdown, and footer.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterModule,
    RouterOutlet,
    MenubarModule,
    AvatarModule,
    ButtonModule,
    MenuModule,
    TranslocoModule,
    LivraBalanceComponent,
    BetaBannerComponent,
    LanguageSelectorComponent
],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private translocoService = inject(TranslocoService);
  private wsService = inject(WebSocketService);
  private langSubscription?: Subscription;

  menuItems: MenuItem[] = [];
  userMenuItems: MenuItem[] = [];
  currentYear = new Date().getFullYear();

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
    this.initMenuItems();
    this.initUserMenuItems();

    // Connect WebSocket
    if (!this.wsService.isConnected()) {
      this.wsService.connect();
    }

    // Update menu items when language changes
    this.langSubscription = this.translocoService.langChanges$.subscribe(() => {
      this.initMenuItems();
      this.initUserMenuItems();
    });
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  private initMenuItems(): void {
    this.menuItems = [
      {
        label: this.translocoService.translate('common.nav.writerArea'),
        icon: 'pi pi-pencil',
        items: [
          {
            label: this.translocoService.translate('common.nav.dashboard'),
            icon: 'pi pi-home',
            command: () => this.router.navigate(['/writer'])
          },
          {
            label: this.translocoService.translate('common.nav.myBooks'),
            icon: 'pi pi-book',
            command: () => this.router.navigate(['/writer/books'])
          },
          {
            label: this.translocoService.translate('common.nav.characters'),
            icon: 'pi pi-users',
            command: () => this.router.navigate(['/writer/characters'])
          },
          {
            label: this.translocoService.translate('common.nav.voices'),
            icon: 'pi pi-volume-up',
            command: () => this.router.navigate(['/writer/voices'])
          }
        ]
      },
      {
        label: this.translocoService.translate('common.nav.socialNetwork'),
        icon: 'pi pi-globe',
        items: [
          {
            label: this.translocoService.translate('common.nav.feed'),
            icon: 'pi pi-th-large',
            command: () => this.router.navigate(['/social/feed'])
          },
          {
            label: this.translocoService.translate('common.nav.explore'),
            icon: 'pi pi-search',
            command: () => this.router.navigate(['/social/explore'])
          },
          {
            label: this.translocoService.translate('common.nav.messages'),
            icon: 'pi pi-envelope',
            command: () => this.router.navigate(['/social/messages'])
          },
          {
            label: this.translocoService.translate('common.nav.myProfile'),
            icon: 'pi pi-user',
            command: () => this.router.navigate(['/social/profile'])
          }
        ]
      }
    ];

    // Add Admin menu if user is an admin
    if (this.currentUser()?.role === 'ADMIN') {
      this.menuItems.push({
        label: 'Admin',
        icon: 'pi pi-shield',
        items: [
          {
            label: 'Logs de Auditoria',
            icon: 'pi pi-history',
            command: () => this.router.navigate(['/admin/audit-logs'])
          }
        ]
      });
    }
  }

  private initUserMenuItems(): void {
    this.userMenuItems = [
      {
        label: this.translocoService.translate('common.nav.myProfile'),
        icon: 'pi pi-user',
        command: () => this.router.navigate(['/auth/profile'])
      },
      {
        label: this.translocoService.translate('common.nav.settings'),
        icon: 'pi pi-cog',
        command: () => this.router.navigate(['/settings'])
      },
      {
        separator: true
      },
      {
        label: this.translocoService.translate('common.nav.logout'),
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user?.name) return '?';

    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
