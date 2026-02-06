import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';

import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';

import { 
  SearchService, 
  UserSearchResult, 
  BookSearchResult, 
  PostSearchResult 
} from '../../../../core/services/search.service';
import { FollowService } from '../../../../core/services/follow.service';

/**
 * Search Component
 * 
 * Search for users, posts, and books with real-time suggestions.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    TabsModule,
    SkeletonModule
],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit, OnDestroy {
  private readonly searchService = inject(SearchService);
  private readonly followService = inject(FollowService);
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchTerms$ = new Subject<string>();

  searchQuery = '';
  loading = signal(false);
  hasSearched = signal(false);
  activeTab = signal<'users' | 'posts' | 'books'>('users');
  
  users = signal<UserSearchResult[]>([]);
  posts = signal<PostSearchResult[]>([]);
  books = signal<BookSearchResult[]>([]);
  
  // Totals for tab badges
  totalUsers = signal(0);
  totalPosts = signal(0);
  totalBooks = signal(0);

  // Suggestions
  suggestions = signal<{ users: string[]; books: string[] }>({ users: [], books: [] });
  showSuggestions = signal(false);

  // Trending
  trendingTags = signal<string[]>([]);
  loadingTrending = signal(true);

  // Follow loading states
  followingUsers = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadTrending();
    this.setupSearchObservable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchObservable(): void {
    // Real-time search as user types (with debounce)
    this.searchTerms$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) {
          return of(null);
        }
        this.loading.set(true);
        return this.searchService.search(term);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response) {
          this.users.set(response.results.users);
          this.posts.set(response.results.posts);
          this.books.set(response.results.books);
          this.totalUsers.set(response.totals.users);
          this.totalPosts.set(response.totals.posts);
          this.totalBooks.set(response.totals.books);
          this.hasSearched.set(true);
        }
        this.loading.set(false);
        this.showSuggestions.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadTrending(): void {
    this.loadingTrending.set(true);
    this.searchService.getTrending().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.trendingTags.set(response.trending);
        this.loadingTrending.set(false);
      },
      error: () => {
        // Fallback to default trending if API fails
        this.trendingTags.set(['suspense', 'romance', 'ficção científica', 'fantasia', 'mistério']);
        this.loadingTrending.set(false);
      }
    });
  }

  onSearchInput(): void {
    this.searchTerms$.next(this.searchQuery);
    
    // Load suggestions for autocomplete
    if (this.searchQuery.length >= 2) {
      this.searchService.getSuggestions(this.searchQuery).pipe(takeUntil(this.destroy$)).subscribe({
        next: (suggestions) => {
          this.suggestions.set(suggestions);
          this.showSuggestions.set(suggestions.users.length > 0 || suggestions.books.length > 0);
        }
      });
    } else {
      this.showSuggestions.set(false);
    }
  }

  search(): void {
    if (!this.searchQuery.trim()) return;
    this.showSuggestions.set(false);
    this.searchTerms$.next(this.searchQuery);
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.showSuggestions.set(false);
    this.search();
  }

  searchTag(tag: string): void {
    this.searchQuery = tag;
    this.search();
  }

  onTabChange(tab: 'users' | 'posts' | 'books'): void {
    this.activeTab.set(tab);
  }

  goToProfile(username: string | null): void {
    if (username) {
      this.router.navigate(['/social/profile', username]);
    }
  }

  goToPost(postId: string): void {
    this.router.navigate(['/social/post', postId]);
  }

  goToBook(bookId: string): void {
    this.router.navigate(['/writer/books', bookId]);
  }

  toggleFollow(user: UserSearchResult, event: Event): void {
    event.stopPropagation();
    
    const followingSet = new Set(this.followingUsers());
    if (followingSet.has(user.id)) return; // Already processing
    
    followingSet.add(user.id);
    this.followingUsers.set(followingSet);
    
    this.followService.follow(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Update local state
        this.users.update(users => 
          users.map(u => u.id === user.id ? { ...u, followerCount: u.followerCount + 1 } : u)
        );
        const newSet = new Set(this.followingUsers());
        newSet.delete(user.id);
        this.followingUsers.set(newSet);
      },
      error: () => {
        const newSet = new Set(this.followingUsers());
        newSet.delete(user.id);
        this.followingUsers.set(newSet);
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.hasSearched.set(false);
    this.showSuggestions.set(false);
    this.users.set([]);
    this.posts.set([]);
    this.books.set([]);
    this.totalUsers.set(0);
    this.totalPosts.set(0);
    this.totalBooks.set(0);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return this.translocoService.translate('common.time.now');
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    const lang = this.translocoService.getActiveLang();
    return new Intl.DateTimeFormat(lang, {
      day: '2-digit',
      month: 'short'
    }).format(d);
  }
}
