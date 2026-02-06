import { Component, signal, OnInit, OnDestroy, inject, computed, viewChild } from '@angular/core';

import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Transloco
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// Core
import { PostService } from '../../../../core/services/post.service';
import { Post } from '../../../../core/models/post.model';
import { UserStories } from '../../../../core/models/story.model';
import { StoryBarComponent } from '../../components/story-bar/story-bar.component';
import { StoryViewerComponent } from '../../components/story-viewer/story-viewer.component';
import { StoryCreatorComponent } from '../../components/story-creator/story-creator.component';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { TimeAgoPipe } from 'src/app/core/pipes';
import { InfiniteScrollDirective } from 'src/app/core/directives';
import { PostComposerComponent } from 'src/app/features/shared';
import { AuthService } from 'src/app/features/auth/services/auth.service';

/**
 * Feed Component
 *
 * Main feed page showing posts from followed users.
 * Features:
 * - Infinite scroll
 * - Pull to refresh (mobile)
 * - Post composer
 * - Story bar
 */
@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    ButtonModule,
    SkeletonModule,
    AvatarModule,
    TooltipModule,
    ToastModule,
    TranslocoModule,
    TimeAgoPipe,
    InfiniteScrollDirective,
    PostComposerComponent,
    StoryBarComponent,
    StoryViewerComponent,
    StoryCreatorComponent
],
  providers: [MessageService],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);
  private readonly analytics = inject(AnalyticsService);

  // State signals
  posts = signal<Post[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  page = signal(1);
  hasMore = signal(true);
  error = signal<string | null>(null);
  showPostComposer = signal(false);

  // Stories state
  showStoryViewer = signal(false);
  storyViewerData = signal<UserStories[]>([]);
  storyViewerStartIndex = signal(0);

  readonly storyCreator = viewChild.required<StoryCreatorComponent>('storyCreator');
  readonly storyBar = viewChild.required<StoryBarComponent>('storyBar');

  // Computed
  isScrollDisabled = computed(() =>
    this.loading() || this.loadingMore() || !this.hasMore()
  );
  currentUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
    this.analytics.trackPageView('Social Feed', '/social/feed');
    this.loadPosts();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Load initial posts from API
   */
  loadPosts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.postService.getFeed(1, 20).subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        this.hasMore.set(response.pagination.hasMore);
        this.page.set(1);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[FeedComponent] Error loading posts:', err);
        this.error.set(this.translocoService.translate('errors.unexpected'));
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: this.translocoService.translate('social.feed.loadError')
        });
      }
    });
  }

  /**
   * Load more posts (infinite scroll)
   */
  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    const nextPage = this.page() + 1;
    this.loadingMore.set(true);

    this.postService.getFeed(nextPage, 20).subscribe({
      next: (response) => {
        this.posts.update(posts => [...posts, ...response.posts]);
        this.hasMore.set(response.pagination.hasMore);
        this.page.set(nextPage);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('[FeedComponent] Error loading more posts:', err);
        this.loadingMore.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: this.translocoService.translate('social.feed.loadMoreError')
        });
      }
    });
  }

  /**
   * Refresh feed
   */
  refresh(): void {
    this.page.set(1);
    this.loadPosts();
  }

  /**
   * Toggle like on a post (optimistic update)
   */
  toggleLike(post: Post): void {
    const previousState = post.isLiked;
    const previousCount = post.likeCount;

    // Optimistic update
    post.isLiked = !previousState;
    post.likeCount += post.isLiked ? 1 : -1;

    // Update signal
    this.posts.update(posts => [...posts]);

    this.postService.toggleLike(post.id).subscribe({
      next: (response) => {
        // Update with server response
        post.isLiked = response.liked;
        post.likeCount = response.likeCount;
        this.posts.update(posts => [...posts]);
        if (response.liked) {
          this.analytics.trackLike('post', post.id);
        }
      },
      error: (err) => {
        console.error('[FeedComponent] Error toggling like:', err);
        // Rollback
        post.isLiked = previousState;
        post.likeCount = previousCount;
        this.posts.update(posts => [...posts]);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: this.translocoService.translate('social.feed.likeError')
        });
      }
    });
  }

  /**
   * Open post composer modal
   */
  openPostModal(): void {
    this.showPostComposer.set(true);
  }

  /**
   * Handle new post created
   */
  onPostCreated(post: Post): void {
    // Track post creation
    this.analytics.trackEvent('create_post', {
      post_id: post.id,
      content_type: 'post',
      has_media: post.mediaUrl ? true : false
    });
    // Add new post to the beginning of the feed
    this.posts.update(posts => [post, ...posts]);
  }

  /**
   * Navigate to user profile
   */
  goToProfile(username: string): void {
    this.router.navigate(['/social/profile', username]);
  }

  /**
   * Navigate to post detail
   */
  goToPost(postId: string): void {
    this.router.navigate(['/social/post', postId]);
  }

  /**
   * Navigate to explore page
   */
  goToExplore(): void {
    this.router.navigate(['/social/explore']);
  }

  /**
   * Get user initials for avatar fallback
   */
  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  /**
   * Track posts by ID for ngFor
   */
  trackByPostId(index: number, post: Post): string {
    return post.id;
  }

  /**
   * Open story creator modal
   */
  openStoryCreator(): void {
    this.storyCreator()?.open();
  }

  /**
   * Open story viewer for a user's stories
   */
  openStoryViewer(userStories: UserStories): void {
    const storyBar = this.storyBar();
    if (!storyBar) return;

    const allStories = (storyBar as any).userStories() || [];
    const index = allStories.findIndex((s: UserStories) => s.userId === userStories.userId);

    this.storyViewerData.set(allStories);
    this.storyViewerStartIndex.set(Math.max(0, index));
    this.showStoryViewer.set(true);
  }

  /**
   * Close story viewer
   */
  closeStoryViewer(): void {
    this.showStoryViewer.set(false);
    // Refresh stories after viewing
    this.storyBar()?.loadStories();
  }

  /**
   * Handle story created
   */
  onStoryCreated(): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translocoService.translate('common.actions.publish'),
      detail: this.translocoService.translate('social.stories.publishSuccess')
    });
    // Refresh story bar
    this.storyBar()?.loadStories();
  }
}
