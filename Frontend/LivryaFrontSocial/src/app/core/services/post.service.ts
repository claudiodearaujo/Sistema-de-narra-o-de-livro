import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Post, 
  CreatePostDto, 
  FeedResponse, 
  ExploreResponse,
  PaginatedResponse,
  TrendingResponse,
  PostStats
} from '../models/post.model';

/**
 * PostService
 * 
 * Service for managing posts in the social network.
 * Handles CRUD operations, feed retrieval, and interactions.
 */
@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/posts`;

  /**
   * Get personalized feed for authenticated user
   */
  getFeed(page: number = 1, limit: number = 20): Observable<FeedResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<FeedResponse>(this.apiUrl + '/feed', { params }).pipe(
      map(response => this.enrichPostsWithTimeAgo(response)),
      catchError(error => {
        console.error('[PostService] Error fetching feed:', error);
        throw error;
      })
    );
  }

  /**
   * Get explore/trending posts (public)
   */
  getExplore(page: number = 1, limit: number = 20): Observable<ExploreResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ExploreResponse>(this.apiUrl + '/explore', { params }).pipe(
      map(response => this.enrichPostsWithTimeAgo(response)),
      catchError(error => {
        console.error('[PostService] Error fetching explore:', error);
        throw error;
      })
    );
  }

  /**
   * Get posts by a specific user
   */
  getPostsByUser(userId: string, page: number = 1, limit: number = 20): Observable<PaginatedResponse<Post>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Post>>(`${this.apiUrl}/user/${userId}`, { params }).pipe(
      map(response => this.enrichPostsWithTimeAgo(response)),
      catchError(error => {
        console.error('[PostService] Error fetching user posts:', error);
        throw error;
      })
    );
  }

  /**
   * Get a single post by ID
   */
  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`).pipe(
      map(post => ({ ...post, timeAgo: this.calculateTimeAgo(post.createdAt) })),
      catchError(error => {
        console.error('[PostService] Error fetching post:', error);
        throw error;
      })
    );
  }

  /**
   * Create a new post
   */
  createPost(data: CreatePostDto): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, data).pipe(
      map(post => ({ ...post, timeAgo: this.calculateTimeAgo(post.createdAt) })),
      catchError(error => {
        console.error('[PostService] Error creating post:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a post
   */
  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('[PostService] Error deleting post:', error);
        throw error;
      })
    );
  }

  /**
   * Toggle like on a post
   */
  toggleLike(postId: string): Observable<{ liked: boolean; likeCount: number }> {
    return this.http.post<{ liked: boolean; likeCount: number }>(
      `${this.apiUrl}/${postId}/like`, 
      {}
    ).pipe(
      catchError(error => {
        console.error('[PostService] Error toggling like:', error);
        throw error;
      })
    );
  }

  /**
   * Rebuild user's feed cache
   */
  rebuildFeed(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl + '/rebuild-feed', {}).pipe(
      catchError(error => {
        console.error('[PostService] Error rebuilding feed:', error);
        throw error;
      })
    );
  }

  /**
   * Share a post (quote repost) - Sprint 7
   */
  sharePost(postId: string, content?: string): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${postId}/share`, { content }).pipe(
      map(post => ({ ...post, timeAgo: this.calculateTimeAgo(post.createdAt) })),
      catchError(error => {
        console.error('[PostService] Error sharing post:', error);
        throw error;
      })
    );
  }

  /**
   * Get trending posts (last 24h) - Sprint 7
   */
  getTrending(page: number = 1, limit: number = 10): Observable<TrendingResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<TrendingResponse>(this.apiUrl + '/trending', { params }).pipe(
      map(response => this.enrichPostsWithTimeAgo(response)),
      catchError(error => {
        console.error('[PostService] Error fetching trending:', error);
        throw error;
      })
    );
  }

  /**
   * Get post statistics - Sprint 7
   */
  getPostStats(postId: string): Observable<PostStats> {
    return this.http.get<PostStats>(`${this.apiUrl}/${postId}/stats`).pipe(
      catchError(error => {
        console.error('[PostService] Error fetching post stats:', error);
        throw error;
      })
    );
  }

  /**
   * Enrich posts with calculated timeAgo
   */
  private enrichPostsWithTimeAgo<T extends PaginatedResponse<Post>>(response: T): T {
    return {
      ...response,
      posts: response.posts.map(post => ({
        ...post,
        timeAgo: this.calculateTimeAgo(post.createdAt)
      }))
    };
  }

  /**
   * Calculate relative time string
   */
  private calculateTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'agora';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}sem`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mês${diffInMonths > 1 ? 'es' : ''}`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}ano${diffInYears > 1 ? 's' : ''}`;
  }
}
