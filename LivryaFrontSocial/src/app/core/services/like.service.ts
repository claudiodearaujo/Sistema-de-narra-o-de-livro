import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Like response from API
 */
export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

/**
 * User who liked
 */
export interface LikeUser {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
}

/**
 * Paginated likes response
 */
export interface PaginatedLikes {
  users: LikeUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Like status response
 */
export interface LikeStatusResponse {
  isLiked: boolean;
}

/**
 * Service for managing post likes
 */
@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/posts`;

  /**
   * Toggle like on a post
   */
  toggleLike(postId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/${postId}/like`, {});
  }

  /**
   * Get users who liked a post
   */
  getLikes(postId: string, page: number = 1, limit: number = 20): Observable<PaginatedLikes> {
    return this.http.get<PaginatedLikes>(
      `${this.apiUrl}/${postId}/likes`,
      { params: { page: page.toString(), limit: limit.toString() } }
    );
  }

  /**
   * Check if current user liked a post
   */
  getLikeStatus(postId: string): Observable<LikeStatusResponse> {
    return this.http.get<LikeStatusResponse>(`${this.apiUrl}/${postId}/like/status`);
  }
}
