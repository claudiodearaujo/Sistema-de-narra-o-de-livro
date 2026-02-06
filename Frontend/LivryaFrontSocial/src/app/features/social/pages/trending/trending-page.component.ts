import { Component, inject, signal, OnInit } from '@angular/core';

import { TranslocoModule } from '@jsverse/transloco';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// Core
import { TrendingPost } from '../../../../core/models/post.model';
import { PostService } from '../../../../core/services/post.service';
import { PostCardComponent } from 'src/app/features/shared';


/**
 * Trending Page Component - Sprint 7
 * 
 * Displays all trending posts from the last 24 hours.
 */
@Component({
  selector: 'app-trending-page',
  standalone: true,
  imports: [
    TranslocoModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    DividerModule,
    PostCardComponent
],
  templateUrl: './trending-page.component.html',
  styleUrl: './trending-page.component.css',
})
export class TrendingPageComponent implements OnInit {
  private readonly postService = inject(PostService);

  posts = signal<TrendingPost[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  currentPage = 1;

  // Computed stats
  totalPosts = signal(0);
  totalLikes = signal(0);
  totalComments = signal(0);

  ngOnInit(): void {
    this.loadTrending();
  }

  loadTrending(): void {
    this.loading.set(true);
    this.postService.getTrending(1, 20).subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        this.hasMore.set(response.pagination.hasMore);
        this.totalPosts.set(response.pagination.total);
        this.calculateStats(response.posts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TrendingPage] Error loading trending:', err);
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    this.currentPage++;

    this.postService.getTrending(this.currentPage, 20).subscribe({
      next: (response) => {
        this.posts.update(posts => [...posts, ...response.posts]);
        this.hasMore.set(response.pagination.hasMore);
        this.calculateStats(this.posts());
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('[TrendingPage] Error loading more:', err);
        this.currentPage--;
        this.loadingMore.set(false);
      }
    });
  }

  calculateStats(posts: TrendingPost[]): void {
    const likes = posts.reduce((sum, p) => sum + p.likeCount, 0);
    const comments = posts.reduce((sum, p) => sum + p.commentCount, 0);
    this.totalLikes.set(likes);
    this.totalComments.set(comments);
  }

  onPostShared(): void {
    // Optionally refresh stats
  }

  getRankClass(index: number): string {
    switch (index) {
      case 0:
        return 'bg-linear-to-br from-livra-500 to-livra-600 text-white';
      case 1:
        return 'bg-linear-to-br from-secondary-300 to-secondary-500 text-white';
      case 2:
        return 'bg-linear-to-br from-livra-400 to-livra-500 text-white';
      default:
        return 'bg-secondary-100 text-primary-700 dark:bg-secondary-800 dark:text-secondary-200';
    }
  }
}
