/**
 * Story Models - Sprint 12
 */

export type StoryType = 'TEXT' | 'IMAGE' | 'QUOTE' | 'POLL';

export interface Story {
  id: string;
  userId: string;
  type: StoryType;
  content?: string;
  mediaUrl?: string;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  views: Array<{ userId: string }>;
  isViewed?: boolean;
}

export interface UserStories {
  userId: string;
  userName: string;
  userAvatar: string | null;
  stories: Story[];
  hasUnviewed: boolean;
  latestStoryAt: string;
}

export interface CreateStoryDto {
  type: StoryType;
  content?: string;
  mediaUrl?: string;
  expiresInHours?: number;
}

export interface StoryViewer {
  id: string;
  name: string;
  avatarUrl: string | null;
  viewedAt: string;
}

export interface StoryViewersResponse {
  viewers: StoryViewer[];
  total: number;
}

export interface StoriesResponse {
  stories: UserStories[];
}

export interface StoryCountResponse {
  count: number;
  limit: number;
  remaining: number;
}
