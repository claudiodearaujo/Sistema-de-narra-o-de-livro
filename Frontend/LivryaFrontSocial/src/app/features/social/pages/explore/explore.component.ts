import { Component, OnInit, signal, inject, computed } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Core
import { PostService } from '../../../../core/services/post.service';
import { FollowService, FollowUser } from '../../../../core/services/follow.service';
import { Post } from '../../../../core/models/post.model';
import { TimeAgoPipe } from 'src/app/core/pipes';
import { InfiniteScrollDirective } from 'src/app/core/directives';
import { TrendingSectionComponent } from 'src/app/features/shared';

interface TrendingTopic {
  tag: string;
  posts: number;
}

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  followersCount: number;
  isFollowing: boolean;
}

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  rating: number;
  reviewsCount: number;
}

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoModule,
    ButtonModule,
    CardModule,
    TabsModule,
    AvatarModule,
    SkeletonModule,
    ChipModule,
    ToastModule,
    TimeAgoPipe,
    InfiniteScrollDirective,
    TrendingSectionComponent
],
  providers: [MessageService],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css'
})
export class ExploreComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);
  private readonly followService = inject(FollowService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  // Posts state
  posts = signal<Post[]>([]);
  loadingPosts = signal(false);
  loadingMore = signal(false);
  page = signal(1);
  hasMore = signal(true);

  // Other content state
  loading = signal(true);
  trendingTopics = signal<TrendingTopic[]>([]);
  suggestedUsers = signal<SuggestedUser[]>([]);
  featuredBooks = signal<FeaturedBook[]>([]);
  popularGenres = signal<string[]>([]);
  followingInProgress = signal<Set<string>>(new Set());

  // Computed
  isScrollDisabled = computed(() =>
    this.loadingPosts() || this.loadingMore() || !this.hasMore()
  );

  ngOnInit() {
    this.loadExploreData();
    this.loadExplorePosts();
  }

  /**
   * Load trending posts from API
   */
  loadExplorePosts(): void {
    this.loadingPosts.set(true);

    this.postService.getExplore(1, 20).subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        this.hasMore.set(response.pagination.hasMore);
        this.page.set(1);
        this.loadingPosts.set(false);
      },
      error: (err) => {
        console.error('[ExploreComponent] Error loading posts:', err);
        this.loadingPosts.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: this.translocoService.translate('social.explore.loadPostsError')
        });
      }
    });
  }

  /**
   * Load more posts (infinite scroll)
   */
  loadMorePosts(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    const nextPage = this.page() + 1;
    this.loadingMore.set(true);

    this.postService.getExplore(nextPage, 20).subscribe({
      next: (response) => {
        this.posts.update(posts => [...posts, ...response.posts]);
        this.hasMore.set(response.pagination.hasMore);
        this.page.set(nextPage);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('[ExploreComponent] Error loading more posts:', err);
        this.loadingMore.set(false);
      }
    });
  }

  /**
   * Toggle like on a post
   */
  togglePostLike(post: Post): void {
    const previousState = post.isLiked;
    const previousCount = post.likeCount;

    post.isLiked = !previousState;
    post.likeCount += post.isLiked ? 1 : -1;
    this.posts.update(posts => [...posts]);

    this.postService.toggleLike(post.id).subscribe({
      next: (response) => {
        post.isLiked = response.liked;
        post.likeCount = response.likeCount;
        this.posts.update(posts => [...posts]);
      },
      error: () => {
        post.isLiked = previousState;
        post.likeCount = previousCount;
        this.posts.update(posts => [...posts]);
      }
    });
  }

  loadExploreData() {
    this.loading.set(true);

    // Load suggested users from API
    this.followService.getSuggestions(10).subscribe({
      next: (response) => {
        // Map API response to SuggestedUser format
        const users: SuggestedUser[] = response.users.map(u => ({
          id: u.id,
          username: u.username || u.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: u.name,
          avatar: u.avatar,
          bio: u.bio,
          followersCount: 0, // API doesn't return this
          isFollowing: u.isFollowing || false
        }));
        this.suggestedUsers.set(users);
      },
      error: (err) => {
        console.error('[ExploreComponent] Error loading suggestions:', err);
        // Fallback to empty array
        this.suggestedUsers.set([]);
      }
    });

    // Trending topics (static for now, can be connected to API later)
    this.trendingTopics.set([
      { tag: 'FantasiaEpica', posts: 1243 },
      { tag: 'LivrosDoMes', posts: 892 },
      { tag: 'RomanceLiterario', posts: 756 },
      { tag: 'LeituraDomingo', posts: 543 },
      { tag: 'NovosAutores', posts: 421 }
    ]);

    this.featuredBooks.set([
      {
        id: '1',
        title: 'O Reino das Sombras',
        author: 'Carlos Mendes',
        cover: null,
        rating: 4.8,
        reviewsCount: 234
      },
      {
        id: '2',
        title: 'Além do Horizonte',
        author: 'Lucia Ferreira',
        cover: null,
        rating: 4.6,
        reviewsCount: 189
      }
    ]);

    this.popularGenres.set([
      'Fantasia', 'Romance', 'Ficção Científica', 'Terror',
      'Mistério', 'Aventura', 'Drama', 'Comédia'
    ]);

    this.loading.set(false);
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  toggleFollow(user: SuggestedUser) {
    // Prevent multiple clicks
    if (this.followingInProgress().has(user.id)) return;

    // Mark as in progress
    this.followingInProgress.update(set => new Set(set).add(user.id));

    // Optimistic update
    const wasFollowing = user.isFollowing;
    const users = this.suggestedUsers();
    const updated = users.map(u =>
      u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u
    );
    this.suggestedUsers.set(updated);

    // Call API
    this.followService.toggleFollow(user.id).subscribe({
      next: (response) => {
        // Update with actual response
        const currentUsers = this.suggestedUsers();
        const finalUpdated = currentUsers.map(u =>
          u.id === user.id ? { ...u, isFollowing: response.following } : u
        );
        this.suggestedUsers.set(finalUpdated);
        this.followingInProgress.update(set => {
          const newSet = new Set(set);
          newSet.delete(user.id);
          return newSet;
        });

        this.messageService.add({
          severity: 'success',
          summary: response.following
            ? this.translocoService.translate('social.explore.following')
            : this.translocoService.translate('social.explore.unfollowed'),
          detail: response.following
            ? this.translocoService.translate('social.explore.startedFollowing', { name: user.displayName })
            : this.translocoService.translate('social.explore.stoppedFollowing', { name: user.displayName }),
          life: 3000
        });
      },
      error: (err) => {
        console.error('[ExploreComponent] Error toggling follow:', err);
        // Revert optimistic update
        const currentUsers = this.suggestedUsers();
        const reverted = currentUsers.map(u =>
          u.id === user.id ? { ...u, isFollowing: wasFollowing } : u
        );
        this.suggestedUsers.set(reverted);
        this.followingInProgress.update(set => {
          const newSet = new Set(set);
          newSet.delete(user.id);
          return newSet;
        });

        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: this.translocoService.translate('social.explore.followError'),
          life: 3000
        });
      }
    });
  }

  goToPost(postId: string): void {
    this.router.navigate(['/social/post', postId]);
  }

  goToProfile(username: string): void {
    this.router.navigate(['/social/profile', username]);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
