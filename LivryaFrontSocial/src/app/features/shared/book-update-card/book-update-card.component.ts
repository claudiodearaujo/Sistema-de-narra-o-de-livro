import { Component, input } from '@angular/core';

import { RouterLink } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

// Core
import { Post, PostBook } from '../../../core/models/post.model';

/**
 * Book Update Card Component - Sprint 7
 * 
 * Displays a book update post with cover, title, and action button.
 */
@Component({
  selector: 'app-book-update-card',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    TagModule
],
  templateUrl: './book-update-card.component.html',
  styleUrl: './book-update-card.component.css'
})
export class BookUpdateCardComponent {
  readonly book = input<PostBook>();
  readonly description = input<string>('');
  readonly isNewBook = input<boolean>(true);
}
