/**
 * Post Models
 * 
 * Modelos e interfaces para o sistema de posts da rede social.
 */

export type PostType = 
  | 'TEXT' 
  | 'IMAGE' 
  | 'BOOK_UPDATE' 
  | 'CHAPTER_PREVIEW' 
  | 'AUDIO_PREVIEW' 
  | 'POLL' 
  | 'SHARED';

export interface PostUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
}

export interface PostBook {
  id: string;
  title: string;
  coverUrl?: string;
  author: string;
}

export interface PostChapter {
  id: string;
  title: string;
  orderIndex: number;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
}

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  content: string;
  mediaUrl?: string;
  bookId?: string;
  chapterId?: string;
  sharedPostId?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user: PostUser;
  book?: PostBook;
  chapter?: PostChapter;
  sharedPost?: Post;
  comments?: PostComment[];
  
  // Computed
  isLiked?: boolean;
  isBookmarked?: boolean;
  
  // UI helpers (calculated on frontend)
  timeAgo?: string;
}

export interface CreatePostDto {
  type: PostType;
  content: string;
  mediaUrl?: string;
  bookId?: string;
  chapterId?: string;
  sharedPostId?: string;
}

export interface PaginatedResponse<T> {
  posts: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface FeedResponse extends PaginatedResponse<Post> {}

export interface ExploreResponse extends PaginatedResponse<Post> {}

/**
 * Trending post with engagement score - Sprint 7
 */
export interface TrendingPost extends Post {
  engagementScore: number;
}

export interface TrendingResponse extends PaginatedResponse<TrendingPost> {}

/**
 * Post statistics - Sprint 7
 */
export interface PostStats {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementScore: number;
}

/**
 * Share post DTO - Sprint 7
 */
export interface SharePostDto {
  content?: string;
}
