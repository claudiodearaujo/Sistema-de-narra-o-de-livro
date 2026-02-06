import { Component, inject, signal, computed, input, output } from '@angular/core';


// PrimeNG
import { ButtonModule } from 'primeng/button';

// Core
import { FollowService, FollowResponse } from '../../../core/services/follow.service';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Follow Button Component
 * 
 * A button that allows users to follow/unfollow other users.
 * Handles optimistic updates and loading states.
 */
@Component({
  selector: 'app-follow-button',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './follow-button.component.html',
  styleUrl: './follow-button.component.css'
})
export class FollowButtonComponent {
  private readonly followService = inject(FollowService);
  private readonly authService = inject(AuthService);

  readonly userId = input.required<string>();
  readonly isFollowing = input(false);
  readonly size = input<'small' | 'normal' | 'large'>('normal');
  readonly outlined = input(false);

  readonly followChanged = output<FollowResponse>();

  // State
  localIsFollowing = signal(false);
  loading = signal(false);
  hovering = signal(false);

  // Computed
  isSelf = computed(() => {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.userId();
  });

  buttonLabel = computed(() => {
    if (this.loading()) return '';

    if (this.localIsFollowing()) {
      return this.hovering() ? 'Deixar de seguir' : 'Seguindo';
    }
    return 'Seguir';
  });

  buttonIcon = computed(() => {
    if (this.loading()) return '';

    if (this.localIsFollowing()) {
      return this.hovering() ? 'pi pi-user-minus' : 'pi pi-check';
    }
    return 'pi pi-user-plus';
  });

  buttonClass = computed(() => {
    const size = this.size();
    const sizeClass = size === 'small' ? 'p-button-sm' : size === 'large' ? 'p-button-lg' : '';

    if (this.localIsFollowing()) {
      if (this.hovering()) {
        return `${sizeClass} unfollow-hover`;
      }
      return `${sizeClass} p-button-outlined p-button-success`;
    }

    return `${sizeClass} ${this.outlined() ? 'p-button-outlined' : ''}`;
  });

  ngOnInit(): void {
    this.localIsFollowing.set(this.isFollowing());
  }

  ngOnChanges(): void {
    this.localIsFollowing.set(this.isFollowing());
  }

  onFollowClick(): void {
    if (this.loading() || this.isSelf()) return;

    // Optimistic update
    const wasFollowing = this.localIsFollowing();
    this.localIsFollowing.set(!wasFollowing);
    this.loading.set(true);

    this.followService.toggleFollow(this.userId()).subscribe({
      next: (response) => {
        this.localIsFollowing.set(response.following);
        this.loading.set(false);
        this.followChanged.emit(response);
      },
      error: (err) => {
        console.error('[FollowButton] Error toggling follow:', err);
        // Revert optimistic update
        this.localIsFollowing.set(wasFollowing);
        this.loading.set(false);
      }
    });
  }
}
