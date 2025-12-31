import prisma from '../lib/prisma';
import { Achievement, AchievementCategory, NotificationType } from '@prisma/client';
import { livraService } from './livra.service';
import { notificationService } from './notification.service';

// WebSocket emitter type
type WebSocketEmitter = (userId: string, event: string, data: any) => void;
let wsEmitter: WebSocketEmitter | null = null;

/**
 * Set WebSocket emitter for real-time updates
 */
export function setAchievementWebSocketEmitter(emitter: WebSocketEmitter): void {
  wsEmitter = emitter;
}

/**
 * Achievement requirement types
 */
export type AchievementRequirementType = 
  | 'posts_count'
  | 'books_count'
  | 'chapters_count'
  | 'followers_count'
  | 'following_count'
  | 'likes_received'
  | 'comments_received'
  | 'messages_sent'
  | 'campaigns_completed'
  | 'groups_joined';

export interface AchievementRequirement {
  type: AchievementRequirementType;
  target: number;
}

export interface AchievementDto {
  id: string;
  key: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  livraReward: number;
  requirement: AchievementRequirement | null;
  isHidden: boolean;
  unlockedAt?: Date | null;
  progress?: number;
  progressTarget?: number;
}

export interface UserAchievementDto {
  id: string;
  achievementId: string;
  userId: string;
  unlockedAt: Date;
  achievement: AchievementDto;
}

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  locked: number;
  percentage: number;
  recentUnlocks: UserAchievementDto[];
}

class AchievementService {
  /**
   * Get all achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    return prisma.achievement.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  /**
   * Get achievements for a user (with unlock status and progress)
   */
  async getUserAchievements(userId: string): Promise<AchievementDto[]> {
    const [achievements, userAchievements, userStats] = await Promise.all([
      prisma.achievement.findMany({
        where: { isHidden: false },
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true }
      }),
      this.getUserStats(userId)
    ]);

    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
    );

    return achievements.map(achievement => {
      const unlockedAt = unlockedMap.get(achievement.id);
      const requirement = achievement.requirement as AchievementRequirement | null;
      const progress = requirement 
        ? this.calculateProgress(requirement, userStats)
        : null;

      return {
        id: achievement.id,
        key: achievement.key,
        category: achievement.category,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        livraReward: achievement.livraReward,
        requirement,
        isHidden: achievement.isHidden,
        unlockedAt: unlockedAt || null,
        progress: progress?.current,
        progressTarget: progress?.target
      };
    });
  }

  /**
   * Get achievements by user ID (public profile view)
   */
  async getAchievementsByUserId(userId: string): Promise<UserAchievementDto[]> {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' }
    });

    return userAchievements.map(ua => ({
      id: ua.id,
      achievementId: ua.achievementId,
      userId: ua.userId,
      unlockedAt: ua.unlockedAt,
      achievement: {
        id: ua.achievement.id,
        key: ua.achievement.key,
        category: ua.achievement.category,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        livraReward: ua.achievement.livraReward,
        requirement: ua.achievement.requirement as AchievementRequirement | null,
        isHidden: ua.achievement.isHidden
      }
    }));
  }

  /**
   * Get achievement stats for a user
   */
  async getAchievementStats(userId: string): Promise<AchievementStats> {
    const [total, unlocked, recentUnlocks] = await Promise.all([
      prisma.achievement.count({ where: { isHidden: false } }),
      prisma.userAchievement.count({ where: { userId } }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        take: 5
      })
    ]);

    return {
      total,
      unlocked,
      locked: total - unlocked,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      recentUnlocks: recentUnlocks.map(ua => ({
        id: ua.id,
        achievementId: ua.achievementId,
        userId: ua.userId,
        unlockedAt: ua.unlockedAt,
        achievement: {
          id: ua.achievement.id,
          key: ua.achievement.key,
          category: ua.achievement.category,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          livraReward: ua.achievement.livraReward,
          requirement: ua.achievement.requirement as AchievementRequirement | null,
          isHidden: ua.achievement.isHidden
        }
      }))
    };
  }

  /**
   * Check and unlock achievements based on action type
   */
  async checkAndUnlock(userId: string, actionType: AchievementRequirementType): Promise<Achievement[]> {
    const userStats = await this.getUserStats(userId);
    
    // Get all achievements that might be unlockable based on action type
    const achievements = await prisma.achievement.findMany({
      where: { isHidden: false }
    });

    const unlockedAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      const requirement = achievement.requirement as AchievementRequirement | null;
      
      // Skip if no requirement or wrong type
      if (!requirement || requirement.type !== actionType) continue;

      // Check if already unlocked
      const existingUnlock = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id
          }
        }
      });

      if (existingUnlock) continue;

      // Check if requirement is met
      const currentValue = this.getStatValue(requirement.type, userStats);
      
      if (currentValue >= requirement.target) {
        // Unlock the achievement
        await this.unlockAchievement(userId, achievement);
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Unlock a specific achievement for a user
   */
  async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    // Create user achievement record
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id
      }
    });

    // Award Livras if there's a reward
    if (achievement.livraReward > 0) {
      await livraService.addLivras(userId, {
        type: 'EARNED_ACHIEVEMENT',
        amount: achievement.livraReward,
        metadata: {
          achievementId: achievement.id,
          achievementKey: achievement.key,
          achievementName: achievement.name
        }
      });
    }

    // Create notification
    await notificationService.create({
      userId,
      type: NotificationType.ACHIEVEMENT,
      title: '🏆 Conquista Desbloqueada!',
      message: `Você desbloqueou "${achievement.name}" e ganhou ${achievement.livraReward} Livras!`,
      data: {
        achievementId: achievement.id,
        achievementKey: achievement.key,
        achievementName: achievement.name,
        achievementIcon: achievement.icon,
        livraReward: achievement.livraReward
      }
    });

    // Emit WebSocket event for real-time notification
    if (wsEmitter) {
      wsEmitter(userId, 'achievement:unlocked', {
        id: achievement.id,
        key: achievement.key,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        livraReward: achievement.livraReward,
        category: achievement.category
      });
    }
  }

  /**
   * Get user stats for achievement checking
   */
  private async getUserStats(userId: string): Promise<Record<string, number>> {
    const [
      postsCount,
      booksCount,
      chaptersCount,
      followersCount,
      followingCount,
      likesReceived,
      commentsReceived,
      messagesSent,
      campaignsCompleted,
      groupsJoined
    ] = await Promise.all([
      prisma.post.count({ where: { userId } }),
      prisma.book.count({ where: { userId } }),
      prisma.chapter.count({ where: { book: { userId } } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.like.count({ where: { post: { userId } } }),
      prisma.comment.count({ where: { post: { userId } } }),
      prisma.message.count({ where: { senderId: userId } }),
      prisma.campaignProgress.count({ where: { userId, isCompleted: true } }),
      prisma.groupMember.count({ where: { userId } })
    ]);

    return {
      posts_count: postsCount,
      books_count: booksCount,
      chapters_count: chaptersCount,
      followers_count: followersCount,
      following_count: followingCount,
      likes_received: likesReceived,
      comments_received: commentsReceived,
      messages_sent: messagesSent,
      campaigns_completed: campaignsCompleted,
      groups_joined: groupsJoined
    };
  }

  /**
   * Get stat value by type
   */
  private getStatValue(type: AchievementRequirementType, stats: Record<string, number>): number {
    return stats[type] || 0;
  }

  /**
   * Calculate progress for an achievement requirement
   */
  private calculateProgress(
    requirement: AchievementRequirement, 
    stats: Record<string, number>
  ): AchievementProgress {
    const current = this.getStatValue(requirement.type, stats);
    const target = requirement.target;
    const percentage = Math.min(Math.round((current / target) * 100), 100);

    return { current, target, percentage };
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(category: AchievementCategory): Promise<Achievement[]> {
    return prisma.achievement.findMany({
      where: { category, isHidden: false },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Check if user has a specific achievement
   */
  async hasAchievement(userId: string, achievementKey: string): Promise<boolean> {
    const userAchievement = await prisma.userAchievement.findFirst({
      where: {
        userId,
        achievement: { key: achievementKey }
      }
    });
    return !!userAchievement;
  }

  /**
   * Force check all achievements for a user (used after migrations or fixes)
   */
  async recheckAllAchievements(userId: string): Promise<Achievement[]> {
    const allTypes: AchievementRequirementType[] = [
      'posts_count',
      'books_count',
      'chapters_count',
      'followers_count',
      'following_count',
      'likes_received',
      'comments_received',
      'messages_sent',
      'campaigns_completed',
      'groups_joined'
    ];

    const allUnlocked: Achievement[] = [];

    for (const type of allTypes) {
      const unlocked = await this.checkAndUnlock(userId, type);
      allUnlocked.push(...unlocked);
    }

    return allUnlocked;
  }
}

export const achievementService = new AchievementService();
