import prisma from '../lib/prisma';
import { Comment, User } from '@prisma/client';

/**
 * Comment with user info
 */
export interface CommentWithUser {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
  };
  replyCount?: number;
  replies?: CommentWithUser[];
}

/**
 * Create comment DTO
 */
export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

/**
 * Paginated comments result
 */
export interface PaginatedComments {
  comments: CommentWithUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Service for managing comments
 */
class CommentService {
  /**
   * Create a new comment on a post
   */
  async create(postId: string, userId: string, data: CreateCommentDto): Promise<CommentWithUser> {
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true }
    });

    if (!post) {
      throw new Error('Post não encontrado');
    }

    // If it's a reply, check if parent comment exists
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { id: true, postId: true, userId: true }
      });

      if (!parentComment) {
        throw new Error('Comentário pai não encontrado');
      }

      if (parentComment.postId !== postId) {
        throw new Error('Comentário pai não pertence a este post');
      }
    }

    // Create comment and increment post comment count
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          userId,
          content: data.content,
          parentId: data.parentId || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } }
      })
    ]);

    // Create notification for post author (if not self-comment)
    if (post.userId !== userId) {
      await this.createCommentNotification(postId, post.userId, userId, data.content);
    }

    // If reply, notify parent comment author
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { userId: true }
      });
      
      if (parentComment && parentComment.userId !== userId && parentComment.userId !== post.userId) {
        await this.createReplyNotification(postId, parentComment.userId, userId, data.content);
      }
    }

    // TODO: Sprint 8 - Add Livras to post author
    // await livraService.addLivras(post.userId, 2, 'EARNED_COMMENT', { postId, fromUserId: userId });

    return comment as CommentWithUser;
  }

  /**
   * Get comments for a post (root comments or replies)
   */
  async getByPost(
    postId: string, 
    page: number = 1, 
    limit: number = 20, 
    parentId: string | null = null
  ): Promise<PaginatedComments> {
    const skip = (page - 1) * limit;

    const whereClause = {
      postId,
      parentId: parentId || null
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: { replies: true }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.comment.count({ where: whereClause })
    ]);

    const commentsWithReplyCount = comments.map(comment => ({
      ...comment,
      replyCount: comment._count.replies,
      _count: undefined
    }));

    return {
      comments: commentsWithReplyCount as CommentWithUser[],
      total,
      page,
      limit,
      hasMore: skip + comments.length < total
    };
  }

  /**
   * Get replies for a comment
   */
  async getReplies(commentId: string, page: number = 1, limit: number = 10): Promise<PaginatedComments> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { postId: true }
    });

    if (!comment) {
      throw new Error('Comentário não encontrado');
    }

    return this.getByPost(comment.postId, page, limit, commentId);
  }

  /**
   * Update a comment
   */
  async update(commentId: string, userId: string, content: string): Promise<CommentWithUser> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true }
    });

    if (!comment) {
      throw new Error('Comentário não encontrado');
    }

    if (comment.userId !== userId) {
      throw new Error('Você não tem permissão para editar este comentário');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    return updated as CommentWithUser;
  }

  /**
   * Delete a comment
   */
  async delete(commentId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, postId: true },
      
    });

    if (!comment) {
      throw new Error('Comentário não encontrado');
    }

    if (comment.userId !== userId && !isAdmin) {
      throw new Error('Você não tem permissão para excluir este comentário');
    }

    // Count this comment and its replies to decrement post comment count
    const replyCount = await prisma.comment.count({
      where: { parentId: commentId }
    });
    const totalToDecrement = 1 + replyCount;

    await prisma.$transaction([
      // Delete replies first (cascade should handle this, but being explicit)
      prisma.comment.deleteMany({
        where: { parentId: commentId }
      }),
      // Delete the comment
      prisma.comment.delete({
        where: { id: commentId }
      }),
      // Decrement post comment count
      prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: totalToDecrement } }
      })
    ]);
  }

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    // For now, we'll just increment/decrement the likeCount on the comment
    // In a full implementation, we'd have a CommentLike table
    
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, likeCount: true }
    });

    if (!comment) {
      throw new Error('Comentário não encontrado');
    }

    // TODO: Implement CommentLike table for proper tracking
    // For now, this is a simplified version
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } }
    });

    return {
      liked: true,
      likeCount: updated.likeCount
    };
  }

  /**
   * Create notification for new comment
   */
  private async createCommentNotification(
    postId: string, 
    authorId: string, 
    commenterId: string, 
    content: string
  ): Promise<void> {
    try {
      const commenter = await prisma.user.findUnique({
        where: { id: commenterId },
        select: { name: true, username: true }
      });

      if (!commenter) return;

      const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;

      await prisma.notification.create({
        data: {
          userId: authorId,
          type: 'COMMENT',
          title: 'Novo comentário',
          message: `${commenter.name} comentou: "${preview}"`,
          data: {
            postId,
            userId: commenterId,
            username: commenter.username
          }
        }
      });

      // TODO: Emit WebSocket event
    } catch (error) {
      console.error('[CommentService] Error creating notification:', error);
    }
  }

  /**
   * Create notification for reply
   */
  private async createReplyNotification(
    postId: string, 
    parentAuthorId: string, 
    replierId: string, 
    content: string
  ): Promise<void> {
    try {
      const replier = await prisma.user.findUnique({
        where: { id: replierId },
        select: { name: true, username: true }
      });

      if (!replier) return;

      const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;

      await prisma.notification.create({
        data: {
          userId: parentAuthorId,
          type: 'COMMENT',
          title: 'Nova resposta',
          message: `${replier.name} respondeu seu comentário: "${preview}"`,
          data: {
            postId,
            userId: replierId,
            username: replier.username
          }
        }
      });

      // TODO: Emit WebSocket event
    } catch (error) {
      console.error('[CommentService] Error creating reply notification:', error);
    }
  }
}

export const commentService = new CommentService();
