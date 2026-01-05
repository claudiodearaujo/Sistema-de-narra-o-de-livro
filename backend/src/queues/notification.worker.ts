import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import prisma from '../lib/prisma';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';
import { 
    NOTIFICATION_JOB_NAMES,
    NotifyLikeJobData,
    NotifyCommentJobData,
    NotifyFollowJobData,
    NotifyMentionJobData,
    NotifyAchievementJobData,
    NotifyLivraEarnedJobData,
    NotifySystemJobData,
    NotifyMessageJobData,
    NotifyBulkJobData
} from './notification.queue';

dotenv.config();

// WebSocket service reference (will be injected)
let websocketEmitter: ((userId: string, event: string, data: any) => void) | null = null;

/**
 * Set WebSocket emitter for real-time notifications
 */
export function setNotificationWorkerEmitter(emitter: (userId: string, event: string, data: any) => void): void {
    websocketEmitter = emitter;
}

/**
 * Create notification in database and emit via WebSocket
 */
async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>
): Promise<void> {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type: type as any,
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
            const unreadCount = await prisma.notification.count({
                where: { userId, isRead: false }
            });
            websocketEmitter(userId, 'notification:count', { unread: unreadCount });
        }
    } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Process like notification
 */
async function processLikeNotification(data: NotifyLikeJobData): Promise<void> {
    const { postId, authorId, likerId } = data;
    
    if (authorId === likerId) return; // Don't notify self-likes

    const liker = await prisma.user.findUnique({
        where: { id: likerId },
        select: { name: true, username: true }
    });

    if (!liker) return;

    await createNotification(
        authorId,
        'LIKE',
        'Nova curtida',
        `${liker.name} curtiu seu post`,
        { postId, userId: likerId, username: liker.username }
    );
}

/**
 * Process comment notification
 */
async function processCommentNotification(data: NotifyCommentJobData): Promise<void> {
    const { postId, authorId, commenterId, preview } = data;
    
    if (authorId === commenterId) return;

    const commenter = await prisma.user.findUnique({
        where: { id: commenterId },
        select: { name: true, username: true }
    });

    if (!commenter) return;

    const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;

    await createNotification(
        authorId,
        'COMMENT',
        'Novo comentário',
        `${commenter.name} comentou: "${truncatedPreview}"`,
        { postId, userId: commenterId, username: commenter.username }
    );
}

/**
 * Process follow notification
 */
async function processFollowNotification(data: NotifyFollowJobData): Promise<void> {
    const { followingId, followerId } = data;

    const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { name: true, username: true }
    });

    if (!follower) return;

    await createNotification(
        followingId,
        'FOLLOW',
        'Novo seguidor',
        `${follower.name} começou a seguir você`,
        { userId: followerId, username: follower.username }
    );
}

/**
 * Process mention notification
 */
async function processMentionNotification(data: NotifyMentionJobData): Promise<void> {
    const { postId, mentionedUserId, mentionerId } = data;
    
    if (mentionedUserId === mentionerId) return;

    const mentioner = await prisma.user.findUnique({
        where: { id: mentionerId },
        select: { name: true, username: true }
    });

    if (!mentioner) return;

    await createNotification(
        mentionedUserId,
        'MENTION',
        'Você foi mencionado',
        `${mentioner.name} mencionou você em um post`,
        { postId, userId: mentionerId, username: mentioner.username }
    );
}

/**
 * Process achievement notification
 */
async function processAchievementNotification(data: NotifyAchievementJobData): Promise<void> {
    const { userId, achievementName, livraReward } = data;

    await createNotification(
        userId,
        'ACHIEVEMENT',
        'Conquista desbloqueada!',
        `Você desbloqueou: ${achievementName}`,
        { achievementName, livraReward }
    );
}

/**
 * Process livra earned notification
 */
async function processLivraEarnedNotification(data: NotifyLivraEarnedJobData): Promise<void> {
    const { userId, amount, reason } = data;

    await createNotification(
        userId,
        'LIVRA_EARNED',
        'Livras recebidas!',
        `Você ganhou ${amount} Livras: ${reason}`,
        { amount, reason }
    );
}

/**
 * Process system notification
 */
async function processSystemNotification(data: NotifySystemJobData): Promise<void> {
    const { userId, title, message, data: notificationData } = data;

    await createNotification(
        userId,
        'SYSTEM',
        title,
        message,
        notificationData
    );
}

/**
 * Process message notification
 */
async function processMessageNotification(data: NotifyMessageJobData): Promise<void> {
    const { recipientId, senderId, messagePreview, conversationId } = data;

    if (recipientId === senderId) return;

    const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true, username: true }
    });

    if (!sender) return;

    const truncatedPreview = messagePreview.length > 50 
        ? messagePreview.substring(0, 50) + '...' 
        : messagePreview;

    await createNotification(
        recipientId,
        'SYSTEM', // Using SYSTEM type for messages
        'Nova mensagem',
        `${sender.name}: ${truncatedPreview}`,
        { userId: senderId, username: sender.username, conversationId }
    );
}

/**
 * Process bulk notification (send to multiple users)
 */
async function processBulkNotification(data: NotifyBulkJobData): Promise<void> {
    const { userIds, type, title, message, data: notificationData } = data;

    // Create notifications in batch
    const notifications = await prisma.notification.createMany({
        data: userIds.map(userId => ({
            userId,
            type: type as any,
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

            const unreadCount = await prisma.notification.count({
                where: { userId, isRead: false }
            });
            websocketEmitter(userId, 'notification:count', { unread: unreadCount });
        }
    }

    console.log(`📧 Bulk notification sent to ${notifications.count} users`);
}

let notificationWorker: Worker | null = null;

if (isRedisEnabled()) {
    try {
        const redisConnection = new IORedis(getRedisConfig());

        redisConnection.on('error', (err) => {
            console.error('Redis connection error (notification worker):', err.message);
        });

        notificationWorker = new Worker('notifications', async (job: Job) => {
            console.log(`🔔 Processing notification job: ${job.name} (${job.id})`);

            try {
                switch (job.name) {
                    case NOTIFICATION_JOB_NAMES.LIKE:
                        await processLikeNotification(job.data as NotifyLikeJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.COMMENT:
                        await processCommentNotification(job.data as NotifyCommentJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.FOLLOW:
                        await processFollowNotification(job.data as NotifyFollowJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.MENTION:
                        await processMentionNotification(job.data as NotifyMentionJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.ACHIEVEMENT:
                        await processAchievementNotification(job.data as NotifyAchievementJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.LIVRA_EARNED:
                        await processLivraEarnedNotification(job.data as NotifyLivraEarnedJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.SYSTEM:
                        await processSystemNotification(job.data as NotifySystemJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.MESSAGE:
                        await processMessageNotification(job.data as NotifyMessageJobData);
                        break;

                    case NOTIFICATION_JOB_NAMES.BULK:
                        await processBulkNotification(job.data as NotifyBulkJobData);
                        break;

                    default:
                        console.warn(`Unknown notification job type: ${job.name}`);
                }

                console.log(`✅ Notification job completed: ${job.name} (${job.id})`);
            } catch (error) {
                console.error(`❌ Notification job failed: ${job.name} (${job.id})`, error);
                throw error; // Re-throw to trigger retry
            }
        }, {
            connection: redisConnection,
            concurrency: 5, // Process up to 5 notifications concurrently
            limiter: {
                max: 100,    // Max 100 jobs
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
    } catch (error) {
        console.warn('⚠️  Failed to initialize Notification Worker:', error);
    }
} else {
    console.log('ℹ️  Redis desabilitado - Notification Worker não inicializado');
}

export { notificationWorker };

/**
 * Gracefully close the worker
 */
export async function closeNotificationWorker(): Promise<void> {
    if (notificationWorker) {
        await notificationWorker.close();
        console.log('Notification Worker closed');
    }
}
