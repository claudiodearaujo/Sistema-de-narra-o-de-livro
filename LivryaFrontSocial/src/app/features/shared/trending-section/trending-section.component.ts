import { Component, inject, signal, OnInit, input, output } from '@angular/core';

import { RouterLink } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

// Core
import { TrendingPost } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';

/**
 * Trending Section Component - Sprint 7
 * 
 * Displays trending posts from the last 24 hours.
 */
@Component({
  selector: 'app-trending-section',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    SkeletonModule,
    AvatarModule,
    TagModule
],
  templateUrl: './trending-section.component.html',
  styleUrl: './trending-section.component.css'
})
export class TrendingSectionComponent implements OnInit {
  private readonly postService = inject(PostService);

  readonly limit = input<number>(5);
  readonly postClicked = output<TrendingPost>();

  posts = signal<TrendingPost[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadTrending();
  }

  loadTrending(): void {
    this.loading.set(true);
    this.postService.getTrending(1, this.limit()).subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TrendingSection] Error loading trending:', err);
        this.loading.set(false);
      }
    });
  }

  getRankClass(index: number): string {
    switch (index) {
      case 0:
        return 'bg-livra-500 text-white';
      case 1:
        return 'bg-secondary-400 text-white';
      case 2:
        return 'bg-livra-600 text-white';
      default:
        return 'bg-secondary-200 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300';
    }
  }

  getTrendingLabel(index: number): string {
    switch (index) {
      case 0:
        return '🥇 #1';
      case 1:
        return '🥈 #2';
      case 2:
        return '🥉 #3';
      default:
        return `#${index + 1}`;
    }
  }

  getTrendingSeverity(index: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (index) {
      case 0:
        return 'warn';
      case 1:
        return 'secondary';
      case 2:
        return 'info';
      default:
        return 'secondary';
    }
  }
}
