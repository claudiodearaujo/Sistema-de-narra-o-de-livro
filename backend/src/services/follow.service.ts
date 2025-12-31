import prisma from '../lib/prisma';
import { Follow, User } from '@prisma/client';
import { feedService } from './feed.service';

/**
 * Follow response
 */
export interface FollowResponse {
  following: boolean;
  followerCount: number;
}

/**
 * Follow status between two users
 */
export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

/**
 * User info for follow list
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
 * Paginated follow list
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
 * Service for managing user follows
 */
class FollowService {
  /**
   * Follow or unfollow a user (atomic operation using transaction)
   */
  async toggleFollow(followerId: string, followingId: string): Promise<FollowResponse> {
    // Cannot follow yourself
    if (followerId === followingId) {
      throw new Error('Você não pode seguir a si mesmo');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true, name: true }
    });

    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }

    // Use transaction to prevent race conditions
    return await prisma.$transaction(async (tx) => {
      // Check if already following (within transaction for consistency)
      const existingFollow = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });

      if (existingFollow) {
        // Unfollow - delete within transaction
        await tx.follow.delete({
          where: { id: existingFollow.id }
        });

        const followerCount = await tx.follow.count({
          where: { followingId }
        });

        // Update feed cache outside transaction (non-critical)
        setImmediate(() => feedService.onUnfollow(followerId, followingId));

        return {
          following: false,
          followerCount
        };
      } else {
        // Follow - create within transaction
        await tx.follow.create({
          data: {
            followerId,
            followingId
          }
        });

        const followerCount = await tx.follow.count({
          where: { followingId }
        });

        // Side effects outside transaction (non-critical)
        setImmediate(async () => {
          await feedService.onFollow(followerId, followingId);
          await this.createFollowNotification(followingId, followerId);
        });

        // TODO: Sprint 8 - Add Livras to followed user
        // await livraService.addLivras(followingId, 5, 'EARNED_FOLLOW', { fromUserId: followerId });

        // TODO: Check achievements (first_follower, 10_followers, 100_followers)
        // await achievementService.checkFollowerAchievements(followingId);

        return {
          following: true,
          followerCount
        };
      }
    });
  }

  /**
   * Check if a user is following another
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    return !!follow;
  }

  /**
   * Get follow status between two users
   */
  async getFollowStatus(userId: string, targetId: string): Promise<FollowStatus> {
    const [isFollowing, isFollowedBy] = await Promise.all([
      this.isFollowing(userId, targetId),
      this.isFollowing(targetId, userId)
    ]);

    return { isFollowing, isFollowedBy };
  }

  /**
   * Get followers of a user
   */
  async getFollowers(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    currentUserId?: string
  ): Promise<PaginatedFollows> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              bio: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.follow.count({ where: { followingId: userId } })
    ]);

    let users = follows.map(f => f.follower);

    // If current user is logged in, check if they follow each user
    if (currentUserId) {
      const userIds = users.map(u => u.id);
      const currentUserFollows = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: userIds }
        },
        select: { followingId: true }
      });
      const followingSet = new Set(currentUserFollows.map(f => f.followingId));
      
      users = users.map(u => ({
        ...u,
        isFollowing: followingSet.has(u.id)
      }));
    }

    return {
      users,
      total,
      page,
      limit,
      hasMore: skip + follows.length < total
    };
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    currentUserId?: string
  ): Promise<PaginatedFollows> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              bio: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.follow.count({ where: { followerId: userId } })
    ]);

    let users = follows.map(f => f.following);

    // If current user is logged in, check if they follow each user
    if (currentUserId) {
      const userIds = users.map(u => u.id);
      const currentUserFollows = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: userIds }
        },
        select: { followingId: true }
      });
      const followingSet = new Set(currentUserFollows.map(f => f.followingId));
      
      users = users.map(u => ({
        ...u,
        isFollowing: followingSet.has(u.id)
      }));
    }

    return {
      users,
      total,
      page,
      limit,
      hasMore: skip + follows.length < total
    };
  }

  /**
   * Get follow counts for a user
   */
  async getFollowCounts(userId: string): Promise<FollowCounts> {
    const [followers, following] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } })
    ]);

    return { followers, following };
  }

  /**
   * Get suggested users to follow
   */
  async getSuggestions(userId: string, limit: number = 5): Promise<FollowUser[]> {
    // Get users that the current user is NOT following
    // Prioritize users with more followers (popular users)
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Exclude self

    const suggestions = await prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
        role: { in: ['WRITER', 'PRO'] } // Prioritize writers
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        _count: {
          select: { followers: true }
        }
      },
      orderBy: {
        followers: { _count: 'desc' }
      },
      take: limit
    });

    return suggestions.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing: false
    }));
  }

  /**
   * Create notification for new follower
   */
  private async createFollowNotification(followingId: string, followerId: string): Promise<void> {
    try {
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { name: true, username: true }
      });

      if (!follower) return;

      await prisma.notification.create({
        data: {
          userId: followingId,
          type: 'FOLLOW',
          title: 'Novo seguidor',
          message: `${follower.name} começou a seguir você`,
          data: {
            userId: followerId,
            username: follower.username
          }
        }
      });

      // TODO: Emit WebSocket event
    } catch (error) {
      console.error('[FollowService] Error creating notification:', error);
    }
  }
}

export const followService = new FollowService();
