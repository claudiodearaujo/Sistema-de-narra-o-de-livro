"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationWorker = void 0;
exports.setNotificationWorkerEmitter = setNotificationWorkerEmitter;
exports.closeNotificationWorker = closeNotificationWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const redis_config_1 = require("../config/redis.config");
const notification_queue_1 = require("./notification.queue");
dotenv_1.default.config();
// WebSocket service reference (will be injected)
let websocketEmitter = null;
/**
 * Set WebSocket emitter for real-time notifications
 */
function setNotificationWorkerEmitter(emitter) {
    websocketEmitter = emitter;
}
/**
 * Create notification in database and emit via WebSocket
 */
async function createNotification(userId, type, title, message, data) {
    try {
        const notification = await prisma_1.default.notification.create({
            data: {
                userId,
                type: type,
                title,
                message,
                data: data || {}
            }
        });
        // Emit real-time notification via WebSocket
        if (websocketEmitter) {
            websocketEmitter(userId, 'notification:new', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                createdAt: notification.createdAt
            });
            // Also emit updated count
            const unreadCount = await prisma_1.default.notification.count({
                where: { userId, isRead: false }
            });
            websocketEmitter(userId, 'notification:count', { unread: unreadCount });
        }
    }
    catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
        throw error;
    }
}
/**
 * Process like notification
 */
async function processLikeNotification(data) {
    const { postId, authorId, likerId } = data;
    if (authorId === likerId)
        return; // Don't notify self-likes
    const liker = await prisma_1.default.user.findUnique({
        where: { id: likerId },
        select: { name: true, username: true }
    });
    if (!liker)
        return;
    await createNotification(authorId, 'LIKE', 'Nova curtida', `${liker.name} curtiu seu post`, { postId, userId: likerId, username: liker.username });
}
/**
 * Process comment notification
 */
async function processCommentNotification(data) {
    const { postId, authorId, commenterId, preview } = data;
    if (authorId === commenterId)
        return;
    const commenter = await prisma_1.default.user.findUnique({
        where: { id: commenterId },
        select: { name: true, username: true }
    });
    if (!commenter)
        return;
    const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
    await createNotification(authorId, 'COMMENT', 'Novo comentário', `${commenter.name} comentou: "${truncatedPreview}"`, { postId, userId: commenterId, username: commenter.username });
}
/**
 * Process follow notification
 */
async function processFollowNotification(data) {
    const { followingId, followerId } = data;
    const follower = await prisma_1.default.user.findUnique({
        where: { id: followerId },
        select: { name: true, username: true }
    });
    if (!follower)
        return;
    await createNotification(followingId, 'FOLLOW', 'Novo seguidor', `${follower.name} começou a seguir você`, { userId: followerId, username: follower.username });
}
/**
 * Process mention notification
 */
async function processMentionNotification(data) {
    const { postId, mentionedUserId, mentionerId } = data;
    if (mentionedUserId === mentionerId)
        return;
    const mentioner = await prisma_1.default.user.findUnique({
        where: { id: mentionerId },
        select: { name: true, username: true }
    });
    if (!mentioner)
        return;
    await createNotification(mentionedUserId, 'MENTION', 'Você foi mencionado', `${mentioner.name} mencionou você em um post`, { postId, userId: mentionerId, username: mentioner.username });
}
/**
 * Process achievement notification
 */
async function processAchievementNotification(data) {
    const { userId, achievementName, livraReward } = data;
    await createNotification(userId, 'ACHIEVEMENT', 'Conquista desbloqueada!', `Você desbloqueou: ${achievementName}`, { achievementName, livraReward });
}
/**
 * Process livra earned notification
 */
async function processLivraEarnedNotification(data) {
    const { userId, amount, reason } = data;
    await createNotification(userId, 'LIVRA_EARNED', 'Livras recebidas!', `Você ganhou ${amount} Livras: ${reason}`, { amount, reason });
}
/**
 * Process system notification
 */
async function processSystemNotification(data) {
    const { userId, title, message, data: notificationData } = data;
    await createNotification(userId, 'SYSTEM', title, message, notificationData);
}
/**
 * Process message notification
 */
async function processMessageNotification(data) {
    const { recipientId, senderId, messagePreview, conversationId } = data;
    if (recipientId === senderId)
        return;
    const sender = await prisma_1.default.user.findUnique({
        where: { id: senderId },
        select: { name: true, username: true }
    });
    if (!sender)
        return;
    const truncatedPreview = messagePreview.length > 50
        ? messagePreview.substring(0, 50) + '...'
        : messagePreview;
    await createNotification(recipientId, 'SYSTEM', // Using SYSTEM type for messages
    'Nova mensagem', `${sender.name}: ${truncatedPreview}`, { userId: senderId, username: sender.username, conversationId });
}
/**
 * Process bulk notification (send to multiple users)
 */
async function processBulkNotification(data) {
    const { userIds, type, title, message, data: notificationData } = data;
    // Create notifications in batch
    const notifications = await prisma_1.default.notification.createMany({
        data: userIds.map(userId => ({
            userId,
            type: type,
            title,
            message,
            data: notificationData || {}
        }))
    });
    // Emit to each user via WebSocket
    if (websocketEmitter) {
        for (const userId of userIds) {
            websocketEmitter(userId, 'notification:new', {
                type,
                title,
                message,
                createdAt: new Date()
            });
            const unreadCount = await prisma_1.default.notification.count({
                where: { userId, isRead: false }
            });
            websocketEmitter(userId, 'notification:count', { unread: unreadCount });
        }
    }
    console.log(`📧 Bulk notification sent to ${notifications.count} users`);
}
let notificationWorker = null;
exports.notificationWorker = notificationWorker;
if ((0, redis_config_1.isRedisEnabled)()) {
    try {
        const redisConnection = new ioredis_1.default((0, redis_config_1.getRedisConfig)());
        redisConnection.on('error', (err) => {
            console.error('Redis connection error (notification worker):', err.message);
        });
        exports.notificationWorker = notificationWorker = new bullmq_1.Worker('notifications', async (job) => {
            console.log(`🔔 Processing notification job: ${job.name} (${job.id})`);
            try {
                switch (job.name) {
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.LIKE:
                        await processLikeNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.COMMENT:
                        await processCommentNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.FOLLOW:
                        await processFollowNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.MENTION:
                        await processMentionNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.ACHIEVEMENT:
                        await processAchievementNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.LIVRA_EARNED:
                        await processLivraEarnedNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.SYSTEM:
                        await processSystemNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.MESSAGE:
                        await processMessageNotification(job.data);
                        break;
                    case notification_queue_1.NOTIFICATION_JOB_NAMES.BULK:
                        await processBulkNotification(job.data);
                        break;
                    default:
                        console.warn(`Unknown notification job type: ${job.name}`);
                }
                console.log(`✅ Notification job completed: ${job.name} (${job.id})`);
            }
            catch (error) {
                console.error(`❌ Notification job failed: ${job.name} (${job.id})`, error);
                throw error; // Re-throw to trigger retry
            }
        }, {
            connection: redisConnection,
            concurrency: 5, // Process up to 5 notifications concurrently
            limiter: {
                max: 100, // Max 100 jobs
                duration: 1000 // per second
            }
        });
        notificationWorker.on('completed', (job) => {
            console.log(`🔔 Notification job ${job.id} completed`);
        });
        notificationWorker.on('failed', (job, err) => {
            console.error(`❌ Notification job ${job?.id} failed:`, err.message);
        });
        notificationWorker.on('error', (err) => {
            console.error('Notification worker error:', err);
        });
        console.log('✅ Notification Worker initialized');
    }
    catch (error) {
        console.warn('⚠️  Failed to initialize Notification Worker:', error);
    }
}
else {
    console.log('ℹ️  Redis desabilitado - Notification Worker não inicializado');
}
/**
 * Gracefully close the worker
 */
async function closeNotificationWorker() {
    if (notificationWorker) {
        await notificationWorker.close();
        console.log('Notification Worker closed');
    }
}
