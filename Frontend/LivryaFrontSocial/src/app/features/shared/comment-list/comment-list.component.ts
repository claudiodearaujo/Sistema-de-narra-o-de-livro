import { Component, inject, signal, OnInit, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// Core
import { CommentService, Comment, CreateCommentDto } from '../../../core/services/comment.service';
import { TimeAgoPipe } from 'src/app/core/pipes';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Comment List Component
 * 
 * Displays comments for a post with support for:
 * - Creating new comments
 * - Replying to comments
 * - Editing/deleting own comments
 * - Loading more comments
 */
@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    AvatarModule,
    TextareaModule,
    SkeletonModule,
    MenuModule,
    TimeAgoPipe,
    TranslocoModule
],
  templateUrl: './comment-list.component.html',
  styleUrl: './comment-list.component.css'
})
export class CommentListComponent implements OnInit {
  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);

  readonly postId = input.required<string>();
  readonly autoLoad = input(true);

  readonly commentAdded = output<Comment>();
  readonly commentDeleted = output<string>();

  // State
  comments = signal<Comment[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  submitting = signal(false);
  hasMore = signal(false);
  page = signal(1);

  newComment = '';
  editContent = '';
  replyingTo = signal<Comment | null>(null);
  editingComment = signal<Comment | null>(null);

  currentUserAvatar = () => this.authService.currentUser()?.avatar || null;
  currentUserInitials = () => {
    const name = this.authService.currentUser()?.name || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  ngOnInit(): void {
    if (this.autoLoad()) {
      this.loadComments();
    }
  }

  loadComments(): void {
    this.loading.set(true);
    this.commentService.getComments(this.postId(), 1, 20).subscribe({
      next: (response) => {
        this.comments.set(response.comments);
        this.hasMore.set(response.hasMore);
        this.page.set(1);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[CommentList] Error loading comments:', err);
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    const nextPage = this.page() + 1;

    this.commentService.getComments(this.postId(), nextPage, 20).subscribe({
      next: (response) => {
        this.comments.update(comments => [...comments, ...response.comments]);
        this.hasMore.set(response.hasMore);
        this.page.set(nextPage);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('[CommentList] Error loading more:', err);
        this.loadingMore.set(false);
      }
    });
  }

  loadReplies(comment: Comment): void {
    this.commentService.getReplies(comment.id, 1, 10).subscribe({
      next: (response) => {
        this.comments.update(comments =>
          comments.map(c =>
            c.id === comment.id
              ? { ...c, replies: response.comments }
              : c
          )
        );
      },
      error: (err) => {
        console.error('[CommentList] Error loading replies:', err);
      }
    });
  }

  submitComment(): void {
    const content = this.newComment.trim();
    if (!content || this.submitting()) return;

    this.submitting.set(true);
    const data: CreateCommentDto = {
      content,
      parentId: this.replyingTo()?.id
    };

    this.commentService.createComment(this.postId(), data).subscribe({
      next: (comment) => {
        if (data.parentId) {
          // Add as reply
          this.comments.update(comments =>
            comments.map(c =>
              c.id === data.parentId
                ? { ...c, replies: [...(c.replies || []), comment], replyCount: (c.replyCount || 0) + 1 }
                : c
            )
          );
        } else {
          // Add as new comment at the beginning
          this.comments.update(comments => [comment, ...comments]);
        }

        this.newComment = '';
        this.replyingTo.set(null);
        this.submitting.set(false);
        this.commentAdded.emit(comment);
      },
      error: (err) => {
        console.error('[CommentList] Error creating comment:', err);
        this.submitting.set(false);
      }
    });
  }

  onSubmitComment(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      event.preventDefault();
      this.submitComment();
    }
  }

  startReply(comment: Comment): void {
    this.replyingTo.set(comment);
    this.editingComment.set(null);
  }

  cancelReply(): void {
    this.replyingTo.set(null);
  }

  startEdit(comment: Comment): void {
    this.editingComment.set(comment);
    this.editContent = comment.content;
    this.replyingTo.set(null);
  }

  cancelEdit(): void {
    this.editingComment.set(null);
    this.editContent = '';
  }

  saveEdit(commentId: string): void {
    const content = this.editContent.trim();
    if (!content || this.submitting()) return;

    this.submitting.set(true);
    this.commentService.updateComment(commentId, content).subscribe({
      next: (updated) => {
        this.comments.update(comments =>
          comments.map(c => c.id === commentId ? { ...c, content: updated.content } : c)
        );
        this.cancelEdit();
        this.submitting.set(false);
      },
      error: (err) => {
        console.error('[CommentList] Error updating comment:', err);
        this.submitting.set(false);
      }
    });
  }

  deleteComment(comment: Comment): void {
    if (!confirm(this.translocoService.translate('commentList.deleteConfirm'))) return;

    this.commentService.deleteComment(comment.id).subscribe({
      next: () => {
        if (comment.parentId) {
          // Remove from replies
          this.comments.update(comments =>
            comments.map(c =>
              c.id === comment.parentId
                ? {
                  ...c,
                  replies: c.replies?.filter(r => r.id !== comment.id),
                  replyCount: Math.max(0, (c.replyCount || 0) - 1)
                }
                : c
            )
          );
        } else {
          // Remove from main list
          this.comments.update(comments => comments.filter(c => c.id !== comment.id));
        }
        this.commentDeleted.emit(comment.id);
      },
      error: (err) => {
        console.error('[CommentList] Error deleting comment:', err);
      }
    });
  }

  onLikeComment(comment: Comment): void {
    this.commentService.toggleCommentLike(comment.id).subscribe({
      next: (response) => {
        // Update like count
        const updateFn = (c: Comment) =>
          c.id === comment.id ? { ...c, likeCount: response.likeCount } : c;

        this.comments.update(comments =>
          comments.map(c => {
            const updated = updateFn(c);
            if (updated.replies) {
              return { ...updated, replies: updated.replies.map(updateFn) };
            }
            return updated;
          })
        );
      },
      error: (err) => {
        console.error('[CommentList] Error liking comment:', err);
      }
    });
  }

  isOwner(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === comment.userId;
  }

  getInitials(name?: string): string {
    return (name || 'U').substring(0, 2).toUpperCase();
  }
}
