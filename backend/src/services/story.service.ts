import prisma from '../lib/prisma';
import { Story, StoryType, Prisma } from '@prisma/client';

// Story with user data
export interface StoryWithUser extends Story {
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  views: Array<{ userId: string }>;
  isViewed?: boolean;
}

// Grouped stories by user
export interface UserStories {
  userId: string;
  userName: string;
  userAvatar: string | null;
  stories: StoryWithUser[];
  hasUnviewed: boolean;
  latestStoryAt: Date;
}

// Create story DTO
export interface CreateStoryDto {
  type: StoryType;
  content?: string;
  mediaUrl?: string;
  expiresInHours?: number;
}

// Plan limits for stories
const STORY_LIMITS = {
  FREE: 3,      // 3 stories per day
  PREMIUM: 10,  // 10 stories per day
  PRO: 50,      // 50 stories per day
};

// Default expiration in hours
const DEFAULT_EXPIRATION_HOURS = 24;

// Prisma includes
const storyInclude = {
  user: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
  views: {
    select: {
      userId: true,
    },
  },
} satisfies Prisma.StoryInclude;

class StoryService {
  /**
   * Get stories from followed users (feed)
   */
  async getStoriesFeed(userId: string): Promise<UserStories[]> {
    // Get list of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    // Include own stories
    followingIds.push(userId);

    // Get non-expired stories from followed users
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: followingIds },
        expiresAt: { gt: new Date() },
      },
      include: storyInclude,
      orderBy: { createdAt: 'desc' },
    });

    // Group stories by user
    const userStoriesMap = new Map<string, UserStories>();

    for (const story of stories) {
      const isViewed = story.views.some((v) => v.userId === userId);
      const storyWithViewed: StoryWithUser = {
        ...story,
        isViewed,
      };

      if (!userStoriesMap.has(story.userId)) {
        userStoriesMap.set(story.userId, {
          userId: story.userId,
          userName: story.user.name,
          userAvatar: story.user.avatar,
          stories: [],
          hasUnviewed: false,
          latestStoryAt: story.createdAt,
        });
      }

      const userStories = userStoriesMap.get(story.userId)!;
      userStories.stories.push(storyWithViewed);
      if (!isViewed) {
        userStories.hasUnviewed = true;
      }
    }

    // Sort: own stories first, then by hasUnviewed, then by latestStoryAt
    const result = Array.from(userStoriesMap.values()).sort((a, b) => {
      // Own stories always first
      if (a.userId === userId) return -1;
      if (b.userId === userId) return 1;
      // Then unviewed first
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      // Then by latest story
      return b.latestStoryAt.getTime() - a.latestStoryAt.getTime();
    });

    return result;
  }

  /**
   * Get stories by a specific user
   */
  async getStoriesByUser(userId: string, viewerId?: string): Promise<StoryWithUser[]> {
    const stories = await prisma.story.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: storyInclude,
      orderBy: { createdAt: 'asc' },
    });

    return stories.map((story) => ({
      ...story,
      isViewed: viewerId ? story.views.some((v) => v.userId === viewerId) : false,
    }));
  }

  /**
   * Get a single story by ID
   */
  async getById(storyId: string, viewerId?: string): Promise<StoryWithUser | null> {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: storyInclude,
    });

    if (!story) return null;

    // Check if expired
    if (story.expiresAt < new Date()) {
      return null;
    }

    return {
      ...story,
      isViewed: viewerId ? story.views.some((v) => v.userId === viewerId) : false,
    };
  }

  /**
   * Create a new story
   */
  async create(userId: string, data: CreateStoryDto): Promise<StoryWithUser> {
    // Check daily limit based on plan (get from subscription)
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true },
    });

    const plan = subscription?.plan || 'FREE';
    const dailyLimit = STORY_LIMITS[plan as keyof typeof STORY_LIMITS] || STORY_LIMITS.FREE;
    
    // Count stories created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStoriesCount = await prisma.story.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    if (todayStoriesCount >= dailyLimit) {
      throw new Error(`Você atingiu o limite de ${dailyLimit} stories por dia. Faça upgrade do seu plano para mais stories.`);
    }

    // Validate content
    if (data.type === 'TEXT' && !data.content?.trim()) {
      throw new Error('Conteúdo é obrigatório para stories de texto');
    }

    if (data.type === 'IMAGE' && !data.mediaUrl) {
      throw new Error('URL da mídia é obrigatória para stories de imagem');
    }

    // Calculate expiration
    const expiresInHours = data.expiresInHours || DEFAULT_EXPIRATION_HOURS;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const story = await prisma.story.create({
      data: {
        userId,
        type: data.type,
        content: data.content?.trim(),
        mediaUrl: data.mediaUrl,
        expiresAt,
      },
      include: storyInclude,
    });

    return { ...story, isViewed: false };
  }

  /**
   * Mark story as viewed
   */
  async markAsViewed(storyId: string, userId: string): Promise<void> {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { userId: true, expiresAt: true },
    });

    if (!story) {
      throw new Error('Story não encontrado');
    }

    if (story.expiresAt < new Date()) {
      throw new Error('Story expirado');
    }

    // Don't count own views
    if (story.userId === userId) {
      return;
    }

    // Create view (upsert to avoid duplicates)
    await prisma.$transaction([
      prisma.storyView.upsert({
        where: {
          storyId_userId: { storyId, userId },
        },
        create: { storyId, userId },
        update: {},
      }),
      prisma.story.update({
        where: { id: storyId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);
  }

  /**
   * Delete a story
   */
  async delete(storyId: string, userId: string): Promise<void> {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { userId: true },
    });

    if (!story) {
      throw new Error('Story não encontrado');
    }

    if (story.userId !== userId) {
      throw new Error('Você não tem permissão para excluir este story');
    }

    await prisma.story.delete({
      where: { id: storyId },
    });
  }

  /**
   * Get story viewers list
   */
  async getViewers(
    storyId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ viewers: Array<{ id: string; name: string; avatarUrl: string | null; viewedAt: Date }>; total: number }> {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { userId: true },
    });

    if (!story) {
      throw new Error('Story não encontrado');
    }

    // Only owner can see viewers
    if (story.userId !== userId) {
      throw new Error('Você não tem permissão para ver os visualizadores');
    }

    const skip = (page - 1) * limit;

    const [views, total] = await Promise.all([
      prisma.storyView.findMany({
        where: { storyId },
        skip,
        take: limit,
        orderBy: { viewedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.storyView.count({ where: { storyId } }),
    ]);

    return {
      viewers: views.map((v) => ({
        id: v.user.id,
        name: v.user.name,
        avatarUrl: v.user.avatar,
        viewedAt: v.viewedAt,
      })),
      total,
    };
  }

  /**
   * Clean up expired stories (to be called by worker)
   */
  async cleanupExpiredStories(): Promise<number> {
    const result = await prisma.story.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  /**
   * Get user's active stories count
   */
  async getActiveStoriesCount(userId: string): Promise<number> {
    return prisma.story.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Get user's active stories count with limit info
   */
  async getActiveStoriesCountWithLimit(userId: string): Promise<{ count: number; limit: number }> {
    const [count, subscription] = await Promise.all([
      this.getActiveStoriesCount(userId),
      prisma.subscription.findUnique({
        where: { userId },
        select: { plan: true },
      }),
    ]);

    const plan = subscription?.plan || 'FREE';
    const limit = this.getStoryLimit(plan);

    return { count, limit };
  }

  /**
   * Get plan story limit
   */
  getStoryLimit(plan: string): number {
    return STORY_LIMITS[plan as keyof typeof STORY_LIMITS] || STORY_LIMITS.FREE;
  }
}

export const storyService = new StoryService();
