import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Comment user info
 */
export interface CommentUser {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
}

/**
 * Comment with user
 */
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  likeCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: CommentUser;
  replyCount?: number;
  replies?: Comment[];
}

/**
 * Create comment DTO
 */
export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

/**
 * Paginated comments response
 */
export interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Comment like response
 */
export interface CommentLikeResponse {
  liked: boolean;
  likeCount: number;
}

/**
 * Service for managing comments
 */
@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get comments for a post
   */
  getComments(postId: string, page: number = 1, limit: number = 20, parentId?: string): Observable<PaginatedComments> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (parentId) {
      params.parentId = parentId;
    }
    
    return this.http.get<PaginatedComments>(
      `${this.apiUrl}/posts/${postId}/comments`,
      { params }
    );
  }

  /**
   * Create a comment on a post
   */
  createComment(postId: string, data: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/posts/${postId}/comments`, data);
  }

  /**
   * Get replies for a comment
   */
  getReplies(commentId: string, page: number = 1, limit: number = 10): Observable<PaginatedComments> {
    return this.http.get<PaginatedComments>(
      `${this.apiUrl}/comments/${commentId}/replies`,
      { params: { page: page.toString(), limit: limit.toString() } }
    );
  }

  /**
   * Update a comment
   */
  updateComment(commentId: string, content: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/comments/${commentId}`, { content });
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }

  /**
   * Toggle like on a comment
   */
  toggleCommentLike(commentId: string): Observable<CommentLikeResponse> {
    return this.http.post<CommentLikeResponse>(`${this.apiUrl}/comments/${commentId}/like`, {});
  }
}
