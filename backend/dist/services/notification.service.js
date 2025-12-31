"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// WebSocket service reference (will be injected)
let websocketEmitter = null;
/**
 * Service for managing notifications
 */
class NotificationService {
    /**
     * Set WebSocket emitter for real-time notifications
     */
    setWebSocketEmitter(emitter) {
        websocketEmitter = emitter;
    }
    /**
     * Create a new notification
     */
    async create(dto) {
        const notification = await prisma_1.default.notification.create({
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
    async getByUser(userId, page = 1, limit = 20, type) {
        const skip = (page - 1) * limit;
        const whereClause = { userId };
        if (type) {
            whereClause.type = type;
        }
        const [notifications, total, unreadCount] = await Promise.all([
            prisma_1.default.notification.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.notification.count({ where: whereClause }),
            prisma_1.default.notification.count({ where: { userId, isRead: false } })
        ]);
        // Enrich notifications with actor info from data field
        const enrichedNotifications = await Promise.all(notifications.map(async (n) => {
            let actor = null;
            const data = n.data;
            if (data?.userId) {
                actor = await prisma_1.default.user.findUnique({
                    where: { id: data.userId },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                });
            }
            return {
                ...n,
                actor
            };
        }));
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
    async getUnreadCount(userId) {
        return prisma_1.default.notification.count({
            where: { userId, isRead: false }
        });
    }
    /**
     * Get notification counts
     */
    async getCounts(userId) {
        const [total, unread] = await Promise.all([
            prisma_1.default.notification.count({ where: { userId } }),
            prisma_1.default.notification.count({ where: { userId, isRead: false } })
        ]);
        return { total, unread };
    }
    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await prisma_1.default.notification.findUnique({
            where: { id: notificationId }
        });
        if (!notification) {
            throw new Error('Notificação não encontrada');
        }
        if (notification.userId !== userId) {
            throw new Error('Você não tem permissão para acessar esta notificação');
        }
        const updated = await prisma_1.default.notification.update({
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
    async markAllAsRead(userId) {
        const result = await prisma_1.default.notification.updateMany({
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
    async delete(notificationId, userId) {
        const notification = await prisma_1.default.notification.findUnique({
            where: { id: notificationId }
        });
        if (!notification) {
            throw new Error('Notificação não encontrada');
        }
        if (notification.userId !== userId) {
            throw new Error('Você não tem permissão para excluir esta notificação');
        }
        await prisma_1.default.notification.delete({
            where: { id: notificationId }
        });
    }
    /**
     * Delete all notifications for a user
     */
    async deleteAll(userId) {
        const result = await prisma_1.default.notification.deleteMany({
            where: { userId }
        });
        return result.count;
    }
    /**
     * Create notification helpers for common events
     */
    async notifyLike(postId, authorId, likerId) {
        if (authorId === likerId)
            return; // Don't notify self-likes
        const liker = await prisma_1.default.user.findUnique({
            where: { id: likerId },
            select: { name: true, username: true }
        });
        if (!liker)
            return;
        await this.create({
            userId: authorId,
            type: 'LIKE',
            title: 'Nova curtida',
            message: `${liker.name} curtiu seu post`,
            data: { postId, userId: likerId, username: liker.username }
        });
    }
    async notifyComment(postId, authorId, commenterId, preview) {
        if (authorId === commenterId)
            return;
        const commenter = await prisma_1.default.user.findUnique({
            where: { id: commenterId },
            select: { name: true, username: true }
        });
        if (!commenter)
            return;
        const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
        await this.create({
            userId: authorId,
            type: 'COMMENT',
            title: 'Novo comentário',
            message: `${commenter.name} comentou: "${truncatedPreview}"`,
            data: { postId, userId: commenterId, username: commenter.username }
        });
    }
    async notifyFollow(followingId, followerId) {
        const follower = await prisma_1.default.user.findUnique({
            where: { id: followerId },
            select: { name: true, username: true }
        });
        if (!follower)
            return;
        await this.create({
            userId: followingId,
            type: 'FOLLOW',
            title: 'Novo seguidor',
            message: `${follower.name} começou a seguir você`,
            data: { userId: followerId, username: follower.username }
        });
    }
    async notifyMention(postId, mentionedUserId, mentionerId) {
        if (mentionedUserId === mentionerId)
            return;
        const mentioner = await prisma_1.default.user.findUnique({
            where: { id: mentionerId },
            select: { name: true, username: true }
        });
        if (!mentioner)
            return;
        await this.create({
            userId: mentionedUserId,
            type: 'MENTION',
            title: 'Você foi mencionado',
            message: `${mentioner.name} mencionou você em um post`,
            data: { postId, userId: mentionerId, username: mentioner.username }
        });
    }
    async notifyAchievement(userId, achievementName, livraReward) {
        await this.create({
            userId,
            type: 'ACHIEVEMENT',
            title: 'Conquista desbloqueada!',
            message: `Você desbloqueou: ${achievementName}`,
            data: { achievementName, livraReward }
        });
    }
    async notifyLivraEarned(userId, amount, reason) {
        await this.create({
            userId,
            type: 'LIVRA_EARNED',
            title: 'Livras recebidas!',
            message: `Você ganhou ${amount} Livras: ${reason}`,
            data: { amount, reason }
        });
    }
    async notifySystem(userId, title, message, data) {
        await this.create({
            userId,
            type: 'SYSTEM',
            title,
            message,
            data
        });
    }
}
exports.notificationService = new NotificationService();
