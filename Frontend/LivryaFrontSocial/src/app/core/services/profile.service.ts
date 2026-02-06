import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * User profile statistics
 * Note: Field names match backend response (posts, followers, etc.)
 */
export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
  books: number;
  totalLikes: number;
  // Future Sprint 8 fields - optional until implemented
  level?: number;
  xp?: number;
  livraBalance?: number;
}

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  website?: string | null;
  role: string;
  isVerified: boolean;
  createdAt: Date;
  stats: ProfileStats;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

/**
 * Profile update input
 */
export interface ProfileUpdateInput {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

/**
 * User post
 */
export interface UserPost {
  id: string;
  content: string;
  mediaUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  isLiked?: boolean;
}

/**
 * User book
 */
export interface UserBook {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  genre: string | null;
  chapterCount: number;
  createdAt: Date;
}

/**
 * Paginated posts response
 */
export interface UserPostsResponse {
  posts: UserPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Paginated books response
 */
export interface UserBooksResponse {
  books: UserBook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Service for user profile operations
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  /**
   * Get user profile by username
   */
  getProfile(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${username}`);
  }

  /**
   * Get user profile by ID
   */
  getProfileById(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/id/${userId}`);
  }

  /**
   * Get current user's profile
   */
  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  /**
   * Update current user's profile
   */
  updateProfile(data: ProfileUpdateInput): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, data);
  }

  /**
   * Get user's posts
   */
  getUserPosts(username: string, page: number = 1, limit: number = 20): Observable<UserPostsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<UserPostsResponse>(`${this.apiUrl}/${username}/posts`, { params });
  }

  /**
   * Get user's books
   */
  getUserBooks(username: string, page: number = 1, limit: number = 20): Observable<UserBooksResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<UserBooksResponse>(`${this.apiUrl}/${username}/books`, { params });
  }
}
