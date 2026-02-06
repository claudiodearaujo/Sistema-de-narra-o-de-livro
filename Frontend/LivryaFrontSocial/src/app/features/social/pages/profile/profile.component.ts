import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { ProfileService, UserProfile, UserPost, UserBook } from '../../../../core/services/profile.service';
import { FollowService, FollowResponse } from '../../../../core/services/follow.service';
import { AchievementService } from '../../../../core/services/achievement.service';
import { UserAchievement } from '../../../../core/models/achievement.model';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';
import { AuthService } from 'src/app/features/auth/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    TabsModule,
    AvatarModule,
    SkeletonModule,
    CardModule,
    DialogModule,
    TooltipModule,
    TranslocoModule
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly profileService = inject(ProfileService);
  private readonly followService = inject(FollowService);
  private readonly authService = inject(AuthService);
  private readonly achievementService = inject(AchievementService);
  private readonly seoService = inject(SeoService);
  private readonly structuredDataService = inject(StructuredDataService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  profile = signal<UserProfile | null>(null);
  posts = signal<UserPost[]>([]);
  books = signal<UserBook[]>([]);
  achievements = signal<UserAchievement[]>([]);

  // Error states
  error = signal<string | null>(null);
  notFound = signal(false);

  loadingPosts = signal(false);
  loadingBooks = signal(false);
  loadingFollow = signal(false);
  loadingFollowers = signal(false);
  loadingFollowing = signal(false);

  postsPage = signal(1);
  booksPage = signal(1);
  hasMorePosts = signal(false);
  hasMoreBooks = signal(false);

  showFollowersDialog = signal(false);
  showFollowingDialog = signal(false);

  // Followers and Following data
  followers = signal<{ id: string; name: string; username: string | null; avatar: string | null }[]>([]);
  following = signal<{ id: string; name: string; username: string | null; avatar: string | null }[]>([]);

  currentTab = signal<'posts' | 'books'>('posts');

  isOwnProfile = computed(() => {
    const p = this.profile();
    const currentUser = this.authService.currentUser();
    return p && currentUser && p.id === currentUser.id;
  });

  isFollowing = computed(() => {
    const p = this.profile();
    return p?.isFollowing ?? false;
  });

  xpProgress = computed(() => {
    const p = this.profile();
    if (!p || !p.stats.level || !p.stats.xp) return 0;
    const xpForNextLevel = p.stats.level * 1000;
    return (p.stats.xp / xpForNextLevel) * 100;
  });

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const username = params['username'];
      if (username) {
        this.loadProfile(username);
      } else {
        // Load current user's profile when no username provided
        this.loadOwnProfile();
      }
    });
  }

  loadOwnProfile() {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.loading.set(false);
      this.error.set(this.translocoService.translate('social.profile.loginRequired'));
      return;
    }

    // If user has username, use it to load profile
    if (currentUser.username) {
      this.loadProfile(currentUser.username);
    } else {
      // Fallback: load by ID via profile service
      this.profileService.getMyProfile().pipe(takeUntil(this.destroy$)).subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);

          // Configure SEO for profile
          this.configureProfileSeo(profile);

          // Load posts for the profile
          if (profile.username) {
            this.profileService.getUserPosts(profile.username, 1, 10).pipe(takeUntil(this.destroy$)).subscribe({
              next: (posts) => {
                this.posts.set(posts.posts);
                this.hasMorePosts.set(posts.pagination.hasMore);
              }
            });
          }

          // Load achievements
          this.loadAchievements(profile.id);
        },
        error: (err) => {
          console.error('Failed to load own profile:', err);
          this.loading.set(false);
          this.error.set(this.translocoService.translate('social.profile.loadError'));
        }
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up SEO schemas
    this.structuredDataService.removeJsonLd('person-schema');
    this.structuredDataService.removeJsonLd('breadcrumb-schema');
    this.seoService.resetToDefaults();
  }

  loadProfile(username: string) {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.postsPage.set(1);
    this.booksPage.set(1);

    forkJoin({
      profile: this.profileService.getProfile(username),
      posts: this.profileService.getUserPosts(username, 1, 10)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ profile, posts }) => {
        this.profile.set(profile);
        this.posts.set(posts.posts);
        this.hasMorePosts.set(posts.pagination.hasMore);
        this.loading.set(false);

        // Configure SEO for profile
        this.configureProfileSeo(profile);

        // Load achievements for profile
        this.loadAchievements(profile.id);
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.loading.set(false);

        if (err.status === 404) {
          this.notFound.set(true);
          this.error.set(this.translocoService.translate('social.profile.userNotFound'));
        } else if (err.status === 0) {
          this.error.set(this.translocoService.translate('social.profile.connectionError'));
        } else {
          this.error.set(this.translocoService.translate('social.profile.loadError'));
        }
      }
    });
  }

  onTabChange(tab: 'posts' | 'books') {
    this.currentTab.set(tab);
    if (tab === 'books' && this.books().length === 0) {
      this.loadBooks();
    }
  }

  loadBooks() {
    const p = this.profile();
    if (!p?.username || this.loadingBooks()) return;

    this.loadingBooks.set(true);
    this.profileService.getUserBooks(p.username, 1, 10).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.books.set(response.books);
        this.hasMoreBooks.set(response.pagination.hasMore);
        this.booksPage.set(1);
        this.loadingBooks.set(false);
      },
      error: () => this.loadingBooks.set(false)
    });
  }

  loadMorePosts() {
    const p = this.profile();
    if (!p?.username || this.loadingPosts()) return;

    this.loadingPosts.set(true);
    const nextPage = this.postsPage() + 1;

    this.profileService.getUserPosts(p.username, nextPage, 10).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.posts.update(posts => [...posts, ...response.posts]);
        this.hasMorePosts.set(response.pagination.hasMore);
        this.postsPage.set(nextPage);
        this.loadingPosts.set(false);
      },
      error: () => this.loadingPosts.set(false)
    });
  }

  loadMoreBooks() {
    const p = this.profile();
    if (!p?.username || this.loadingBooks()) return;

    this.loadingBooks.set(true);
    const nextPage = this.booksPage() + 1;

    this.profileService.getUserBooks(p.username, nextPage, 10).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.books.update(books => [...books, ...response.books]);
        this.hasMoreBooks.set(response.pagination.hasMore);
        this.booksPage.set(nextPage);
        this.loadingBooks.set(false);
      },
      error: () => this.loadingBooks.set(false)
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).format(d);
  }

  toggleFollow() {
    const p = this.profile();
    if (!p || this.loadingFollow()) return;

    this.loadingFollow.set(true);

    const action$ = p.isFollowing
      ? this.followService.unfollow(p.id)
      : this.followService.follow(p.id);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: FollowResponse) => {
        this.profile.set({
          ...p,
          isFollowing: response.following,
          stats: {
            ...p.stats,
            followers: response.followerCount
          }
        });
        this.loadingFollow.set(false);
      },
      error: () => this.loadingFollow.set(false)
    });
  }

  openFollowers() {
    this.showFollowersDialog.set(true);
    this.loadFollowers();
  }

  openFollowing() {
    this.showFollowingDialog.set(true);
    this.loadFollowing();
  }

  loadFollowers() {
    const p = this.profile();
    if (!p) return;

    this.loadingFollowers.set(true);
    this.followService.getFollowers(p.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.followers.set(response.users);
        this.loadingFollowers.set(false);
      },
      error: (err) => {
        console.error('Failed to load followers:', err);
        this.loadingFollowers.set(false);
      }
    });
  }

  loadFollowing() {
    const p = this.profile();
    if (!p) return;

    this.loadingFollowing.set(true);
    this.followService.getFollowing(p.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.following.set(response.users);
        this.loadingFollowing.set(false);
      },
      error: (err) => {
        console.error('Failed to load following:', err);
        this.loadingFollowing.set(false);
      }
    });
  }

  loadAchievements(userId: string) {
    this.achievementService.getUserAchievements(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.achievements.set(response.achievements.slice(0, 6)); // Show max 6
      },
      error: (err) => {
        console.error('Failed to load achievements:', err);
      }
    });
  }

  private configureProfileSeo(profile: UserProfile): void {
    // Configure SEO meta tags
    this.seoService.setAuthorPage({
      name: profile.name,
      bio: profile.bio || this.translocoService.translate('social.profile.profileOf', { name: profile.name }),
      avatar: profile.avatar || undefined
    });

    // Configure Person schema for structured data
    this.structuredDataService.setPersonSchema({
      name: profile.name,
      description: profile.bio || this.translocoService.translate('social.profile.authorAt'),
      image: profile.avatar || undefined,
      url: profile.username ? `https://livrya.com.br/social/profile/${profile.username}` : undefined
    });

    // Configure breadcrumb
    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Comunidade', url: 'https://livrya.com.br/social' },
      { name: profile.name, url: profile.username ? `https://livrya.com.br/social/profile/${profile.username}` : 'https://livrya.com.br/social' }
    ]);
  }
}
