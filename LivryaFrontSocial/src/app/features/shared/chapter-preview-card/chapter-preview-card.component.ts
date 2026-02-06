import { Component, input } from '@angular/core';

import { RouterLink } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// Core
import { PostBook, PostChapter } from '../../../core/models/post.model';

/**
 * Chapter Preview Card Component - Sprint 7
 * 
 * Displays a chapter preview with book info and excerpt.
 */
@Component({
  selector: 'app-chapter-preview-card',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    DividerModule
],
  templateUrl: './chapter-preview-card.component.html',
  styleUrl: './chapter-preview-card.component.css'
})
export class ChapterPreviewCardComponent {
  readonly book = input<PostBook>();
  readonly chapter = input<PostChapter>();
  readonly excerpt = input<string>('');
}
