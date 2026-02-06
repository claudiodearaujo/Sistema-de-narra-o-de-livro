import { Component, OnInit, OnDestroy, inject, signal, input, output, HostListener } from '@angular/core';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { StoryService, UserStories, Story } from '../../../../core';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [
    AvatarModule,
    ButtonModule
],
  templateUrl: './story-viewer.component.html',
  styleUrl: './story-viewer.component.css',
})
export class StoryViewerComponent implements OnInit, OnDestroy {
  private readonly storyService = inject(StoryService);

  // Inputs
  userStories = input.required<UserStories[]>();
  startIndex = input<number>(0);
  currentUserId = input<string>('');

  // Outputs
  close = output<void>();
  showViewers = output<Story>();
  storyViewed = output<Story>();

  // State
  currentUserIndex = signal(0);
  currentStoryIndex = signal(0);
  isPlaying = signal(false);

  private storyTimeout: any;
  private readonly STORY_DURATION = environment.story.durationMs;
  
  // CSS custom property for animation duration
  readonly storyDurationCss = `${this.STORY_DURATION}ms`;

  ngOnInit(): void {
    this.currentUserIndex.set(this.startIndex());
    this.currentStoryIndex.set(0);
    this.startProgress();
    this.markCurrentAsViewed();
  }

  ngOnDestroy(): void {
    this.stopProgress();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        this.previousStory();
        break;
      case 'ArrowRight':
        this.nextStory();
        break;
      case 'Escape':
        this.close.emit();
        break;
    }
  }

  currentUserStories(): UserStories | undefined {
    return this.userStories()[this.currentUserIndex()];
  }

  currentStory(): Story | undefined {
    const userStories = this.currentUserStories();
    if (!userStories) return undefined;
    return userStories.stories[this.currentStoryIndex()];
  }

  isOwner(): boolean {
    return this.currentUserStories()?.userId === this.currentUserId();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getTimeSince(createdAt: string): string {
    return this.storyService.getTimeSince(createdAt);
  }

  nextStory(): void {
    const userStories = this.currentUserStories();
    if (!userStories) return;

    this.stopProgress();

    if (this.currentStoryIndex() < userStories.stories.length - 1) {
      // Next story of same user
      this.currentStoryIndex.update((i) => i + 1);
      this.resetProgress();
      this.startProgress();
      this.markCurrentAsViewed();
    } else if (this.currentUserIndex() < this.userStories().length - 1) {
      // Next user
      this.currentUserIndex.update((i) => i + 1);
      this.currentStoryIndex.set(0);
      this.resetProgress();
      this.startProgress();
      this.markCurrentAsViewed();
    } else {
      // End of all stories
      this.close.emit();
    }
  }

  previousStory(): void {
    this.stopProgress();
    
    if (this.currentStoryIndex() > 0) {
      // Previous story of same user
      this.currentStoryIndex.update((i) => i - 1);
      this.resetProgress();
      this.startProgress();
    } else if (this.currentUserIndex() > 0) {
      // Previous user (last story)
      this.currentUserIndex.update((i) => i - 1);
      const prevUserStories = this.currentUserStories();
      if (prevUserStories) {
        this.currentStoryIndex.set(prevUserStories.stories.length - 1);
      }
      this.resetProgress();
      this.startProgress();
    } else {
      // Already at first story, restart progress
      this.resetProgress();
      this.startProgress();
    }
  }

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('story-viewer-overlay')) {
      this.close.emit();
    }
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
  }

  private startProgress(): void {
    this.stopProgress();
    
    // Para reiniciar a animação CSS, precisamos remover e readicionar a classe
    // Isso é feito definindo isPlaying para false e depois true no próximo frame
    this.isPlaying.set(false);
    
    // Usar requestAnimationFrame para garantir que o navegador processe a mudança
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.isPlaying.set(true);
        
        // Define timeout para avançar para próximo story após STORY_DURATION
        this.storyTimeout = setTimeout(() => {
          this.nextStory();
        }, this.STORY_DURATION);
      });
    });
  }

  private stopProgress(): void {
    if (this.storyTimeout) {
      clearTimeout(this.storyTimeout);
      this.storyTimeout = null;
    }
    this.isPlaying.set(false);
  }

  private resetProgress(): void {
    // Reset é feito automaticamente ao mudar de story
    // A animação CSS reinicia quando a classe é reaplicada
    this.isPlaying.set(false);
  }

  private markCurrentAsViewed(): void {
    const story = this.currentStory();
    if (story && !story.isViewed) {
      this.storyService.markAsViewed(story.id).subscribe({
        next: () => {
          story.isViewed = true;
          this.storyViewed.emit(story);
        },
        error: (err) => console.error('[StoryViewer] Error marking as viewed:', err),
      });
    }
  }
}
