import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Search result types
 */
export type SearchResultType = 'user' | 'book' | 'post' | 'chapter';

/**
 * User search result
 */
export interface UserSearchResult {
  type: 'user';
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  isVerified: boolean;
  followerCount: number;
}

/**
 * Book search result
 */
export interface BookSearchResult {
  type: 'book';
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  genre: string | null;
  author: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
  };
  chapterCount: number;
}

/**
 * Post search result
 */
export interface PostSearchResult {
  type: 'post';
  id: string;
  content: string;
  mediaUrl: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
  };
  likeCount: number;
  commentCount: number;
}

/**
 * Combined search result
 */
export type SearchResult = UserSearchResult | BookSearchResult | PostSearchResult;

/**
 * Search response
 */
export interface SearchResponse {
  query: string;
  results: {
    users: UserSearchResult[];
    books: BookSearchResult[];
    posts: PostSearchResult[];
  };
  totals: {
    users: number;
    books: number;
    posts: number;
  };
  pagination: {
    page: number;
    limit: number;
  };
}

/**
 * Search suggestions response
 */
export interface SearchSuggestionsResponse {
  users: string[];
  books: string[];
}

/**
 * Trending tags response
 */
export interface TrendingTagsResponse {
  trending: string[];
}

/**
 * Service for search operations
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/search`;

  /**
   * Perform global search
   */
  search(
    query: string,
    options: { type?: SearchResultType | SearchResultType[]; page?: number; limit?: number } = {}
  ): Observable<SearchResponse> {
    let params = new HttpParams()
      .set('q', query)
      .set('page', (options.page || 1).toString())
      .set('limit', (options.limit || 10).toString());

    if (options.type) {
      const types = Array.isArray(options.type) ? options.type.join(',') : options.type;
      params = params.set('type', types);
    }

    return this.http.get<SearchResponse>(this.apiUrl, { params });
  }

  /**
   * Search only users
   */
  searchUsers(query: string, page: number = 1, limit: number = 10): Observable<SearchResponse> {
    return this.search(query, { type: 'user', page, limit });
  }

  /**
   * Search only books
   */
  searchBooks(query: string, page: number = 1, limit: number = 10): Observable<SearchResponse> {
    return this.search(query, { type: 'book', page, limit });
  }

  /**
   * Search only posts
   */
  searchPosts(query: string, page: number = 1, limit: number = 10): Observable<SearchResponse> {
    return this.search(query, { type: 'post', page, limit });
  }

  /**
   * Get search suggestions (autocomplete)
   */
  getSuggestions(query: string, limit: number = 5): Observable<SearchSuggestionsResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());

    return this.http.get<SearchSuggestionsResponse>(`${this.apiUrl}/suggestions`, { params });
  }

  /**
   * Get trending searches
   */
  getTrending(): Observable<TrendingTagsResponse> {
    return this.http.get<TrendingTagsResponse>(`${this.apiUrl}/trending`);
  }

  /**
   * Create a search observable with debounce
   * Useful for search-as-you-type functionality
   */
  createSearchObservable(
    searchTerms$: Subject<string>,
    debounceMs: number = 300
  ): Observable<SearchResponse> {
    return searchTerms$.pipe(
      debounceTime(debounceMs),
      distinctUntilChanged(),
      switchMap(term => this.search(term))
    );
  }
}
