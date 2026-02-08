import { Component, OnInit, inject, signal, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CampaignService } from '../../../../core/services/campaign.service';
import { Campaign } from '../../../../core/models/group.model';

interface BookOption {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  selected: boolean;
}

@Component({
  selector: 'app-campaign-create-modal',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  templateUrl: './campaign-create-modal.component.html',
  styleUrl: './campaign-create-modal.component.css',
})
export class CampaignCreateModalComponent implements OnInit {
  readonly groupId = input.required<string>();
  readonly close = output<void>();
  readonly created = output<Campaign>();

  private readonly campaignService = inject(CampaignService);
  private readonly translocoService = inject(TranslocoService);

  name = '';
  description = '';
  startDate = '';
  endDate = '';
  livraReward = 50;
  bookSearch = '';
  
  loading = signal(false);
  booksLoading = signal(false);
  error = signal<string | null>(null);
  
  availableBooks = signal<BookOption[]>([]);
  selectedBooks = signal<BookOption[]>([]);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.booksLoading.set(true);
    
    // Fetch books from the API - using fetch directly since we don't have a books service injected
    fetch(`${this.getApiUrl()}/books`)
      .then(res => res.json())
      .then(books => {
        const bookOptions: BookOption[] = books.map((book: any) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          selected: false
        }));
        this.availableBooks.set(bookOptions);
        this.booksLoading.set(false);
      })
      .catch(err => {
        console.error('Error loading books:', err);
        this.booksLoading.set(false);
      });
  }

  searchBooks() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      const search = this.bookSearch.toLowerCase();
      this.availableBooks.update(books => 
        books.map(book => ({
          ...book,
          // Keep selected state but filter display
        })).filter(book => 
          book.title.toLowerCase().includes(search) || 
          book.author.toLowerCase().includes(search) ||
          book.selected
        )
      );
    }, 300);
  }

  toggleBook(book: BookOption) {
    book.selected = !book.selected;
    
    if (book.selected) {
      this.selectedBooks.update(books => [...books, book]);
    } else {
      this.selectedBooks.update(books => books.filter(b => b.id !== book.id));
    }
    
    this.availableBooks.update(books => [...books]);
  }

  onSubmit() {
    if (!this.name.trim() || this.selectedBooks().length === 0) return;

    this.loading.set(true);
    this.error.set(null);

    this.campaignService.createCampaign(this.groupId(), {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      livraReward: this.livraReward,
      bookIds: this.selectedBooks().map(b => b.id)
    }).subscribe({
      next: (campaign) => {
        this.loading.set(false);
        this.created.emit(campaign);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || this.translocoService.translate('social.campaigns.createError'));
      }
    });
  }

  private getApiUrl(): string {
    // Get from environment
    return 'http://localhost:3000/api';
  }
}
