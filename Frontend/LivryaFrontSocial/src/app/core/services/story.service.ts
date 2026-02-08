import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Story,
  UserStories,
  CreateStoryDto,
  StoriesResponse,
  StoryViewersResponse,
  StoryCountResponse,
} from '../models/story.model';

@Injectable({
  providedIn: 'root',
})
export class StoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stories`;

  /**
   * Get stories feed from followed users
   */
  getStoriesFeed(): Observable<UserStories[]> {
    return this.http.get<StoriesResponse>(this.baseUrl).pipe(
      map((res) => res.stories)
    );
  }

  /**
   * Get stories by a specific user
   */
  getStoriesByUser(userId: string): Observable<Story[]> {
    return this.http.get<{ stories: Story[] }>(`${this.baseUrl}/user/${userId}`).pipe(
      map((res) => res.stories)
    );
  }

  /**
   * Get a single story by ID
   */
  getStoryById(storyId: string): Observable<Story> {
    return this.http.get<Story>(`${this.baseUrl}/${storyId}`);
  }

  /**
   * Create a new story
   */
  createStory(data: CreateStoryDto): Observable<Story> {
    return this.http.post<Story>(this.baseUrl, data);
  }

  /**
   * Mark story as viewed
   */
  markAsViewed(storyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${storyId}/view`, {});
  }

  /**
   * Delete a story
   */
  deleteStory(storyId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${storyId}`);
  }

  /**
   * Get story viewers (owner only)
   */
  getStoryViewers(storyId: string, page: number = 1): Observable<StoryViewersResponse> {
    return this.http.get<StoryViewersResponse>(`${this.baseUrl}/${storyId}/viewers`, {
      params: { page: page.toString() },
    });
  }

  /**
   * Get my story count and limits
   */
  getStoryCount(): Observable<StoryCountResponse> {
    return this.http.get<StoryCountResponse>(`${this.baseUrl}/count`);
  }

  /**
   * Calculate time remaining until expiration
   */
  getTimeRemaining(expiresAt: string): string {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h restantes`;
    }
    return `${minutes}m restantes`;
  }

  /**
   * Format time since creation
   */
  getTimeSince(createdAt: string): string {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const diff = now - created;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours > 0) {
      return `${hours}h`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return 'agora';
  }
}
