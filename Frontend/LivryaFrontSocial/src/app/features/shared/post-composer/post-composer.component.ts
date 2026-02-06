import { Component, signal, inject, OnChanges, SimpleChanges, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// Core
import { PostService } from '../../../core/services/post.service';
import { Post, PostType, CreatePostDto } from '../../../core/models/post.model';

/**
 * Post Composer Component
 * 
 * A modal dialog for creating new posts.
 * Features:
 * - Text content with character limit
 * - Image upload (URL for now)
 * - Post type selection
 * - Character counter
 */
@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    AvatarModule,
    TooltipModule,
    ProgressSpinnerModule,
    SelectModule,
    TranslocoModule
],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.css'
})
export class PostComposerComponent implements OnChanges {
  private readonly postService = inject(PostService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  /** Whether the dialog is visible */
  readonly visible = input(false);

  /** User's display name for avatar */
  readonly userName = input('');

  /** User's avatar URL */
  readonly userAvatar = input<string>();

  /** Emitted when visibility changes */
  readonly visibleChange = output<boolean>();

  /** Emitted when a post is successfully created */
  readonly postCreated = output<Post>();

  // Internal visible state for two-way binding with p-dialog
  dialogVisible = false;

  // State
  content = signal('');
  mediaUrl = signal('');
  postType = signal<PostType>('TEXT');
  submitting = signal(false);
  showImageInput = signal(false);

  // Constants
  readonly MAX_CHARACTERS = 2000;

  // Post type options
  get postTypeOptions() {
    return [
      { label: this.translocoService.translate('social.posts.postTypes.text'), value: 'TEXT' },
      { label: this.translocoService.translate('social.posts.postTypes.image'), value: 'IMAGE' },
      { label: this.translocoService.translate('social.posts.postTypes.bookUpdate'), value: 'BOOK_UPDATE' }
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.dialogVisible = changes['visible'].currentValue;
    }
  }

  onDialogVisibleChange(visible: boolean): void {
    this.dialogVisible = visible;
    this.visibleChange.emit(visible);
    if (!visible) {
      this.reset();
    }
  }

  /**
   * Get remaining characters count
   */
  get remainingCharacters(): number {
    return this.MAX_CHARACTERS - this.content().length;
  }

  /**
   * Check if content is valid
   */
  get isValid(): boolean {
    const contentTrimmed = this.content().trim();
    return contentTrimmed.length > 0 && contentTrimmed.length <= this.MAX_CHARACTERS;
  }

  /**
   * Get user initials for avatar fallback
   */
  getInitials(): string {
    const userName = this.userName();
    if (!userName) return '?';
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  /**
   * Toggle image URL input visibility
   */
  toggleImageInput(): void {
    this.showImageInput.update(v => !v);
    if (!this.showImageInput()) {
      this.mediaUrl.set('');
    } else {
      this.postType.set('IMAGE');
    }
  }

  /**
   * Handle content change
   */
  onContentChange(value: string): void {
    this.content.set(value);
  }

  /**
   * Handle media URL change
   */
  onMediaUrlChange(value: string): void {
    this.mediaUrl.set(value);
  }

  /**
   * Close the dialog
   */
  close(): void {
    this.dialogVisible = false;
    this.visibleChange.emit(false);
    this.reset();
  }

  /**
   * Reset form state
   */
  reset(): void {
    this.content.set('');
    this.mediaUrl.set('');
    this.postType.set('TEXT');
    this.showImageInput.set(false);
  }

  /**
   * Submit the post
   */
  submit(): void {
    if (!this.isValid || this.submitting()) return;

    this.submitting.set(true);

    const dto: CreatePostDto = {
      type: this.mediaUrl() ? 'IMAGE' : this.postType(),
      content: this.content().trim(),
      mediaUrl: this.mediaUrl() || undefined
    };

    this.postService.createPost(dto).subscribe({
      next: (post) => {
        this.submitting.set(false);
        this.postCreated.emit(post);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('social.posts.success'),
          detail: this.translocoService.translate('social.posts.postPublished')
        });
        this.close();
      },
      error: (err) => {
        console.error('[PostComposer] Error creating post:', err);
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('social.posts.error'),
          detail: err.error?.error || this.translocoService.translate('social.posts.postError')
        });
      }
    });
  }
}
