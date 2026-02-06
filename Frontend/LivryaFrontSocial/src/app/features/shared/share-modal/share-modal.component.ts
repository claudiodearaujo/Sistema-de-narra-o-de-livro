import { Component, inject, signal, ViewChild, input, output, model } from '@angular/core';

import { FormsModule } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// Core
import { Post } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Share Modal Component - Sprint 7
 *
 * Modal for sharing/quoting posts with optional commentary.
 */
@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    AvatarModule,
    ToastModule,
    TranslocoModule
  ],
  providers: [MessageService],
  templateUrl: './share-modal.component.html',
  styleUrl: './share-modal.component.css'
})
export class ShareModalComponent {
  private readonly postService = inject(PostService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  readonly post = input<Post | null>(null);
  visible = model<boolean>(false);
  readonly shared = output<Post>();

  currentUser = this.authService.currentUser;
  quoteText = '';
  sharing = signal(false);

  getInitials(): string {
    const name = this.currentUser()?.name || 'U';
    return name.substring(0, 2).toUpperCase();
  }

  onClose(): void {
    this.visible.set(false);
    this.quoteText = '';
  }

  onShare(): void {
    const post = this.post();
    if (!post || this.sharing()) return;

    // Cannot share a post that is already a share
    if (post.type === 'SHARED') {
      this.messageService.add({
        severity: 'warn',
        summary: this.translocoService.translate('shareModal.notAllowed'),
        detail: this.translocoService.translate('shareModal.cannotShareShared')
      });
      return;
    }

    this.sharing.set(true);

    const content = this.quoteText.trim() || undefined;

    this.postService.sharePost(post.id, content).subscribe({
      next: (sharedPost) => {
        this.sharing.set(false);
        this.shared.emit(sharedPost);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('shareModal.shared'),
          detail: this.translocoService.translate('shareModal.sharedSuccess')
        });
        this.onClose();
      },
      error: (err) => {
        this.sharing.set(false);
        console.error('[ShareModal] Error sharing post:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: err.error?.error || this.translocoService.translate('shareModal.shareError')
        });
      }
    });
  }
}
