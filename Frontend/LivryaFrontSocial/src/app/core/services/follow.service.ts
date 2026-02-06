import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Follow response
 */
export interface FollowResponse {
  following: boolean;
  followerCount: number;
}

/**
 * Follow status
 */
export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

/**
 * Follow user info
 */
export interface FollowUser {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  isFollowing?: boolean;
}

/**
 * Paginated follows
 */
export interface PaginatedFollows {
  users: FollowUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Follow counts
 */
export interface FollowCounts {
  followers: number;
  following: number;
}

/**
 * Suggestions response
 */
export interface SuggestionsResponse {
  users: FollowUser[];
}

/**
 * Service for managing user follows
 */
@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  /**
   * Follow a user
   */
  follow(userId: string): Observable<FollowResponse> {
    return this.http.post<FollowResponse>(`${this.apiUrl}/${userId}/follow`, {});
  }

  /**
   * Unfollow a user
   */
  unfollow(userId: string): Observable<FollowResponse> {
    return this.http.delete<FollowResponse>(`${this.apiUrl}/${userId}/follow`);
  }

  /**
   * Toggle follow on a user
   */
  toggleFollow(userId: string): Observable<FollowResponse> {
    return this.http.post<FollowResponse>(`${this.apiUrl}/${userId}/follow`, {});
  }

  /**
   * Get followers of a user
   */
  getFollowers(userId: string, page: number = 1, limit: number = 20): Observable<PaginatedFollows> {
    return this.http.get<PaginatedFollows>(
      `${this.apiUrl}/${userId}/followers`,
      { params: { page: page.toString(), limit: limit.toString() } }
    );
  }

  /**
   * Get users that a user is following
   */
  getFollowing(userId: string, page: number = 1, limit: number = 20): Observable<PaginatedFollows> {
    return this.http.get<PaginatedFollows>(
      `${this.apiUrl}/${userId}/following`,
      { params: { page: page.toString(), limit: limit.toString() } }
    );
  }

  /**
   * Get follow status between current user and target
   */
  getFollowStatus(userId: string): Observable<FollowStatus> {
    return this.http.get<FollowStatus>(`${this.apiUrl}/${userId}/follow-status`);
  }

  /**
   * Get follow counts for a user
   */
  getFollowCounts(userId: string): Observable<FollowCounts> {
    return this.http.get<FollowCounts>(`${this.apiUrl}/${userId}/follow-counts`);
  }

  /**
   * Get suggested users to follow
   */
  getSuggestions(limit: number = 5): Observable<SuggestionsResponse> {
    return this.http.get<SuggestionsResponse>(
      `${this.apiUrl}/suggestions`,
      { params: { limit: limit.toString() } }
    );
  }
}
