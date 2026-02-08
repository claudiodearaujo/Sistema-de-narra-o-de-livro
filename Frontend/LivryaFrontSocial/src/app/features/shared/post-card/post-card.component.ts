import { Component, inject, signal, computed, input, output } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// Core
import { Post } from '../../../core/models/post.model';
import { LikeService } from '../../../core/services/like.service';

// Shared Components
import { ShareModalComponent } from '../share-modal/share-modal.component';
import { BookUpdateCardComponent } from '../book-update-card/book-update-card.component';
import { ChapterPreviewCardComponent } from '../chapter-preview-card/chapter-preview-card.component';
import { AudioPreviewPlayerComponent } from '../audio-preview-player/audio-preview-player.component';
import { TimeAgoPipe } from 'src/app/core/pipes';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Post Card Component
 * 
 * Displays a post with user info, content, media, and interaction buttons.
 * Handles like, comment, and share actions.
 */
@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    AvatarModule,
    MenuModule,
    TooltipModule,
    TranslocoModule,
    TimeAgoPipe,
    ShareModalComponent,
    BookUpdateCardComponent,
    ChapterPreviewCardComponent,
    AudioPreviewPlayerComponent
],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css'
})
export class PostCardComponent {
  private readonly router = inject(Router);
  private readonly likeService = inject(LikeService);
  private readonly authService = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);

  readonly post = input.required<Post>();
  readonly showActions = input(true);

  readonly liked = output<{
    postId: string;
    liked: boolean;
    likeCount: number;
}>();
  readonly commented = output<string>();
  readonly shared = output<string>();
  readonly deleted = output<string>();

  // State
  isLiked = signal(false);
  localLikeCount = signal(0);
  localShareCount = signal(0);
  likeLoading = signal(false);
  shareModalVisible = false;

  // Computed
  likeButtonLabel = computed(() => {
    const count = this.localLikeCount();
    const label = this.translocoService.translate('postCard.like');
    return count > 0 ? `${label} (${count})` : label;
  });

  commentButtonLabel = computed(() => {
    const count = this.post()?.commentCount || 0;
    const label = this.translocoService.translate('postCard.comment');
    return count > 0 ? `${label} (${count})` : label;
  });

  shareButtonLabel = computed(() => {
    const count = this.localShareCount();
    const label = this.translocoService.translate('postCard.share');
    return count > 0 ? `${label} (${count})` : label;
  });

  menuItems = computed((): MenuItem[] => {
    const items: MenuItem[] = [];
    const currentUser = this.authService.currentUser();
    const isOwner = currentUser?.id === this.post()?.userId;

    if (isOwner) {
      items.push(
        { label: this.translocoService.translate('postCard.menu.edit'), icon: 'pi pi-pencil', command: () => this.onEditClick() },
        { label: this.translocoService.translate('postCard.menu.delete'), icon: 'pi pi-trash', command: () => this.onDeleteClick() }
      );
    } else {
      items.push(
        { label: this.translocoService.translate('postCard.menu.copyLink'), icon: 'pi pi-link', command: () => this.copyLink() },
        { label: this.translocoService.translate('postCard.menu.report'), icon: 'pi pi-flag', command: () => this.onReportClick() }
      );
    }

    return items;
  });

  ngOnInit(): void {
    // Initialize local state from post data
    const post = this.post();
    this.isLiked.set(post?.isLiked || false);
    this.localLikeCount.set(post?.likeCount || 0);
    this.localShareCount.set(post?.shareCount || 0);
  }

  ngOnChanges(): void {
    // Update when post input changes
    const post = this.post();
    if (post) {
      this.isLiked.set(post.isLiked || false);
      this.localLikeCount.set(post.likeCount || 0);
      this.localShareCount.set(post.shareCount || 0);
    }
  }

  getInitials(): string {
    const name = this.post()?.user?.name || 'U';
    return name.substring(0, 2).toUpperCase();
  }

  onLikeClick(): void {
    if (this.likeLoading()) return;

    // Optimistic update
    const wasLiked = this.isLiked();
    const newLiked = !wasLiked;
    const newCount = newLiked ? this.localLikeCount() + 1 : this.localLikeCount() - 1;

    this.isLiked.set(newLiked);
    this.localLikeCount.set(Math.max(0, newCount));
    this.likeLoading.set(true);

    this.likeService.toggleLike(this.post().id).subscribe({
      next: (response) => {
        // Update with server response
        this.isLiked.set(response.liked);
        this.localLikeCount.set(response.likeCount);
        this.likeLoading.set(false);
        this.liked.emit({ postId: this.post().id, liked: response.liked, likeCount: response.likeCount });
      },
      error: (err) => {
        // Revert optimistic update
        console.error('[PostCard] Error toggling like:', err);
        this.isLiked.set(wasLiked);
        this.localLikeCount.set(wasLiked ? newCount + 1 : newCount - 1);
        this.likeLoading.set(false);
      }
    });
  }

  onCommentClick(): void {
    const post = this.post();
    this.commented.emit(post.id);
    // Navigate to post detail with comments
    this.router.navigate(['/social/post', post.id], { fragment: 'comments' });
  }

  onShareClick(): void {
    // Cannot share a post that is already a share
    if (this.post().type === 'SHARED') {
      return;
    }
    this.shareModalVisible = true;
  }

  onPostShared(sharedPost: Post): void {
    // Update local share count
    this.localShareCount.update(count => count + 1);
    this.shared.emit(this.post().id);
  }

  onEditClick(): void {
    // TODO: Open edit modal
  }

  onDeleteClick(): void {
    this.deleted.emit(this.post().id);
  }

  onReportClick(): void {
    // TODO: Open report modal
  }

  openMedia(): void {
    // TODO: Open media in lightbox
  }

  copyLink(): void {
    const url = `${window.location.origin}/social/post/${this.post().id}`;
    navigator.clipboard.writeText(url);
  }

  // Helper methods for preview cards
  getBookDescription(): string {
    // Extract description from post content if it's a book update
    const post = this.post();
    if (post.type === 'BOOK_UPDATE') {
      const lines = post.content.split('\n\n');
      return lines.length > 1 ? lines[1] : '';
    }
    return '';
  }

  getChapterExcerpt(): string {
    // Extract excerpt from post content if it's a chapter preview
    const post = this.post();
    if (post.type === 'CHAPTER_PREVIEW') {
      const match = post.content.match(/"([^"]+)"/);
      return match ? match[1] : '';
    }
    return '';
  }
}
