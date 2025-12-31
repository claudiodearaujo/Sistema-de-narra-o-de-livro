import prisma from '../lib/prisma';
import { Notification, NotificationType } from '@prisma/client';
import { 
  notificationQueue, 
  NOTIFICATION_JOB_NAMES, 
  queueNotification 
} from '../queues/notification.queue';

/**
 * Notification with actor info
 */
export interface NotificationWithActor {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
  actor?: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
  } | null;
}

/**
 * Create notification DTO
 */
export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Paginated notifications
 */
export interface PaginatedNotifications {
  notifications: NotificationWithActor[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  unreadCount: number;
}

/**
 * Notification counts
 */
export interface NotificationCounts {
  total: number;
  unread: number;
}

// WebSocket service reference (will be injected)
let websocketEmitter: ((userId: string, event: string, data: any) => void) | null = null;

/**
 * Service for managing notifications
 */
class NotificationService {
  /**
   * Set WebSocket emitter for real-time notifications
   */
  setWebSocketEmitter(emitter: (userId: string, event: string, data: any) => void): void {
    websocketEmitter = emitter;
  }

  /**
   * Create a new notification
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || {}
      }
    });

    // Emit real-time notification via WebSocket
    if (websocketEmitter) {
      websocketEmitter(dto.userId, 'notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt
      });

      // Also emit updated count
      const unreadCount = await this.getUnreadCount(dto.userId);
      websocketEmitter(dto.userId, 'notification:count', { unread: unreadCount });
    }

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getByUser(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    type?: NotificationType
  ): Promise<PaginatedNotifications> {
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };
    if (type) {
      whereClause.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    // Collect all unique actor IDs to batch fetch (fixes N+1 query problem)
    const actorIds = notifications
      .map(n => {
        const data = n.data as Record<string, any> | null;
        return data?.userId as string | undefined;
      })
      .filter((id): id is string => Boolean(id));

    const uniqueActorIds = [...new Set(actorIds)];

    // Batch fetch all actors in a single query
    const actors = uniqueActorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueActorIds } },
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        })
      : [];

    // Create a map for O(1) lookup
    const actorMap = new Map(actors.map(a => [a.id, a]));

    // Enrich notifications with actor info from the map
    const enrichedNotifications = notifications.map(n => {
      const data = n.data as Record<string, any> | null;
      const actor = data?.userId ? actorMap.get(data.userId) || null : null;
      
      return {
        ...n,
        actor
      };
    });

    return {
      notifications: enrichedNotifications,
      total,
      page,
      limit,
      hasMore: skip + notifications.length < total,
      unreadCount
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  /**
   * Get notification counts
   */
  async getCounts(userId: string): Promise<NotificationCounts> {
    const [total, unread] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return { total, unread };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    if (notification.userId !== userId) {
      throw new Error('Você não tem permissão para acessar esta notificação');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    // Emit updated count
    if (websocketEmitter) {
      const unreadCount = await this.getUnreadCount(userId);
      websocketEmitter(userId, 'notification:count', { unread: unreadCount });
    }

    return updated;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    // Emit updated count
    if (websocketEmitter) {
      websocketEmitter(userId, 'notification:count', { unread: 0 });
    }

    return result.count;
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    if (notification.userId !== userId) {
      throw new Error('Você não tem permissão para excluir esta notificação');
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAll(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });

    return result.count;
  }

  /**
   * Create notification helpers for common events
   */

  async notifyLike(postId: string, authorId: string, likerId: string): Promise<void> {
    if (authorId === likerId) return; // Don't notify self-likes

    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.LIKE, {
      postId,
      authorId,
      likerId
    });

    // If queue is not available, process directly
    if (!queued) {
      const liker = await prisma.user.findUnique({
        where: { id: likerId },
        select: { name: true, username: true }
      });

      if (!liker) return;

      await this.create({
        userId: authorId,
        type: 'LIKE',
        title: 'Nova curtida',
        message: `${liker.name} curtiu seu post`,
        data: { postId, userId: likerId, username: liker.username }
      });
    }
  }

  async notifyComment(postId: string, authorId: string, commenterId: string, preview: string): Promise<void> {
    if (authorId === commenterId) return;

    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.COMMENT, {
      postId,
      authorId,
      commenterId,
      preview
    });

    // If queue is not available, process directly
    if (!queued) {
      const commenter = await prisma.user.findUnique({
        where: { id: commenterId },
        select: { name: true, username: true }
      });

      if (!commenter) return;

      const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;

      await this.create({
        userId: authorId,
        type: 'COMMENT',
        title: 'Novo comentário',
        message: `${commenter.name} comentou: "${truncatedPreview}"`,
        data: { postId, userId: commenterId, username: commenter.username }
      });
    }
  }

  async notifyFollow(followingId: string, followerId: string): Promise<void> {
    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.FOLLOW, {
      followingId,
      followerId
    });

    // If queue is not available, process directly
    if (!queued) {
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { name: true, username: true }
      });

      if (!follower) return;

      await this.create({
        userId: followingId,
        type: 'FOLLOW',
        title: 'Novo seguidor',
        message: `${follower.name} começou a seguir você`,
        data: { userId: followerId, username: follower.username }
      });
    }
  }

  async notifyMention(postId: string, mentionedUserId: string, mentionerId: string): Promise<void> {
    if (mentionedUserId === mentionerId) return;

    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.MENTION, {
      postId,
      mentionedUserId,
      mentionerId
    });

    // If queue is not available, process directly
    if (!queued) {
      const mentioner = await prisma.user.findUnique({
        where: { id: mentionerId },
        select: { name: true, username: true }
      });

      if (!mentioner) return;

      await this.create({
        userId: mentionedUserId,
        type: 'MENTION',
        title: 'Você foi mencionado',
        message: `${mentioner.name} mencionou você em um post`,
        data: { postId, userId: mentionerId, username: mentioner.username }
      });
    }
  }

  async notifyAchievement(userId: string, achievementName: string, livraReward: number): Promise<void> {
    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.ACHIEVEMENT, {
      userId,
      achievementName,
      livraReward
    });

    // If queue is not available, process directly
    if (!queued) {
      await this.create({
        userId,
        type: 'ACHIEVEMENT',
        title: 'Conquista desbloqueada!',
        message: `Você desbloqueou: ${achievementName}`,
        data: { achievementName, livraReward }
      });
    }
  }

  async notifyLivraEarned(userId: string, amount: number, reason: string): Promise<void> {
    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.LIVRA_EARNED, {
      userId,
      amount,
      reason
    });

    // If queue is not available, process directly
    if (!queued) {
      await this.create({
        userId,
        type: 'LIVRA_EARNED',
        title: 'Livras recebidas!',
        message: `Você ganhou ${amount} Livras: ${reason}`,
        data: { amount, reason }
      });
    }
  }

  async notifySystem(userId: string, title: string, message: string, data?: Record<string, any>): Promise<void> {
    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.SYSTEM, {
      userId,
      title,
      message,
      data
    });

    // If queue is not available, process directly
    if (!queued) {
      await this.create({
        userId,
        type: 'SYSTEM',
        title,
        message,
        data
      });
    }
  }

  /**
   * Send notification about new message
   */
  async notifyMessage(recipientId: string, senderId: string, messagePreview: string, conversationId?: string): Promise<void> {
    if (recipientId === senderId) return;

    // Try to queue the notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.MESSAGE, {
      recipientId,
      senderId,
      messagePreview,
      conversationId
    });

    // If queue is not available, process directly
    if (!queued) {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true, username: true }
      });

      if (!sender) return;

      const truncatedPreview = messagePreview.length > 50 
        ? messagePreview.substring(0, 50) + '...' 
        : messagePreview;

      await this.create({
        userId: recipientId,
        type: 'SYSTEM',
        title: 'Nova mensagem',
        message: `${sender.name}: ${truncatedPreview}`,
        data: { userId: senderId, username: sender.username, conversationId }
      });
    }
  }

  /**
   * Send bulk notification to multiple users
   */
  async notifyBulk(
    userIds: string[], 
    type: NotificationType, 
    title: string, 
    message: string, 
    data?: Record<string, any>
  ): Promise<void> {
    if (userIds.length === 0) return;

    // Try to queue the bulk notification
    const queued = await queueNotification(NOTIFICATION_JOB_NAMES.BULK, {
      userIds,
      type,
      title,
      message,
      data
    });

    // If queue is not available, process directly (sequentially to avoid overwhelming)
    if (!queued) {
      for (const userId of userIds) {
        await this.create({
          userId,
          type,
          title,
          message,
          data
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
