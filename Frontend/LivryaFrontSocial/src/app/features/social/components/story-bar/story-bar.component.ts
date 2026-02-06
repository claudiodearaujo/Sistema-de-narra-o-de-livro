import { Component, OnInit, inject, signal, output } from '@angular/core';

import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoModule } from '@jsverse/transloco';
import { StoryService, UserStories } from '../../../../core';

@Component({
  selector: 'app-story-bar',
  standalone: true,
  imports: [
    RouterModule,
    AvatarModule,
    ProgressBarModule,
    ButtonModule,
    SkeletonModule,
    TranslocoModule
],
  templateUrl: './story-bar.component.html',
  styleUrl: './story-bar.component.css',
})
export class StoryBarComponent implements OnInit {
  private readonly storyService = inject(StoryService);

  // State
  userStories = signal<UserStories[]>([]);
  loading = signal(true);

  // Events
  createStory = output<void>();
  viewStory = output<UserStories>();

  ngOnInit(): void {
    this.loadStories();
  }

  loadStories(): void {
    this.loading.set(true);
    this.storyService.getStoriesFeed().subscribe({
      next: (stories) => {
        this.userStories.set(stories);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[StoryBar] Error loading stories:', err);
        this.loading.set(false);
      },
    });
  }

  onCreateClick(): void {
    this.createStory.emit();
  }

  onStoryClick(userStory: UserStories): void {
    this.viewStory.emit(userStory);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getFirstName(name: string): string {
    return name.split(' ')[0];
  }
}
