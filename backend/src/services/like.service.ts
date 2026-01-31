import prisma from '../lib/prisma';
import { Like, Post, User } from '@prisma/client';
import { livraService } from './livra.service';
import { achievementService } from './achievement.service';
import { auditService } from './audit.service';

/**
 * Like Response with counts
 */
export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

/**
 * User info for like list
 */
export interface LikeUser {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
}

/**
 * Paginated result
 */
export interface PaginatedLikes {
  users: LikeUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Service for managing post likes
 */
class LikeService {
  /**
   * Toggle like on a post (like if not liked, unlike if already liked)
   */
  async toggleLike(postId: string, userId: string, userEmail?: string): Promise<LikeResponse> {
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, likeCount: true }
    });

    if (!post) {
      throw new Error('Post não encontrado');
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (existingLike) {
      // Unlike: remove like and decrement count
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id }
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } }
        })
      ]);

      // Audit log - unlike
      if (userEmail) {
        auditService.log({
          userId,
          userEmail,
          action: 'POST_UNLIKE' as any,
          category: 'SOCIAL' as any,
          severity: 'LOW' as any,
          resource: 'Post',
          resourceId: postId,
          description: `Usuário descurtiu o post`,
          metadata: { postId }
        }).catch(err => console.error('[AUDIT]', err));
      }

      return {
        liked: false,
        likeCount: Math.max(0, post.likeCount - 1)
      };
    } else {
      // Like: create like and increment count
      await prisma.$transaction([
        prisma.like.create({
          data: {
            postId,
            userId
          }
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } }
        })
      ]);

      // Audit log - like
      if (userEmail) {
        auditService.log({
          userId,
          userEmail,
          action: 'POST_LIKE' as any,
          category: 'SOCIAL' as any,
          severity: 'LOW' as any,
          resource: 'Post',
          resourceId: postId,
          description: `Usuário curtiu o post`,
          metadata: { postId }
        }).catch(err => console.error('[AUDIT]', err));
      }

      // Sprint 8: Award Livras to post author
      if (post.userId !== userId) {
        try {
          await livraService.awardForLikeReceived(post.userId, postId, userId);
        } catch (err) {
          console.error('Failed to award Livras for like:', err);
        }
        
        // Create notification for post author
        await this.createLikeNotification(postId, post.userId, userId);

        // Sprint 10: Check achievements for likes received
        setImmediate(async () => {
          try {
            await achievementService.checkAndUnlock(post.userId, 'likes_received');
          } catch (err) {
            console.error('Failed to check achievements:', err);
          }
        });
      }

      return {
        liked: true,
        likeCount: post.likeCount + 1
      };
    }
  }

  /**
   * Check if user has liked a post
   */
  async isLiked(postId: string, userId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });
    return !!like;
  }

  /**
   * Check if user has liked multiple posts (batch)
   */
  async isLikedBatch(postIds: string[], userId: string): Promise<Record<string, boolean>> {
    const likes = await prisma.like.findMany({
      where: {
        postId: { in: postIds },
        userId
      },
      select: { postId: true }
    });

    const likedMap: Record<string, boolean> = {};
    postIds.forEach(id => {
      likedMap[id] = likes.some(like => like.postId === id);
    });

    return likedMap;
  }

  /**
   * Get users who liked a post
   */
  async getLikesByPost(postId: string, page: number = 1, limit: number = 20): Promise<PaginatedLikes> {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.like.count({ where: { postId } })
    ]);

    return {
      users: likes.map(like => like.user),
      total,
      page,
      limit,
      hasMore: skip + likes.length < total
    };
  }

  /**
   * Create notification for like
   */
  private async createLikeNotification(postId: string, authorId: string, likerId: string): Promise<void> {
    try {
      const liker = await prisma.user.findUnique({
        where: { id: likerId },
        select: { name: true, username: true }
      });

      if (!liker) return;

      await prisma.notification.create({
        data: {
          userId: authorId,
          type: 'LIKE',
          title: 'Nova curtida',
          message: `${liker.name} curtiu seu post`,
          data: {
            postId,
            userId: likerId,
            username: liker.username
          }
        }
      });
    } catch (error) {
      console.error('[LikeService] Error creating notification:', error);
    }
  }
}

export const likeService = new LikeService();
