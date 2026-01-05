import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';

dotenv.config();

let connection: IORedis | null = null;
let notificationQueue: Queue | null = null;

if (isRedisEnabled()) {
    try {
        connection = new IORedis(getRedisConfig());

        connection.on('ready', () => {
            console.log('✅ Redis connected (Notification Queue)');
        });

        connection.on('error', (err) => {
            console.warn('⚠️  Redis error (Notification):', err.message);
        });

        connection.on('close', () => {
            console.warn('⚠️  Redis connection closed (Notification)');
        });

        notificationQueue = new Queue('notifications', { 
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: {
                    age: 24 * 3600, // Keep completed jobs for 24 hours
                    count: 1000     // Keep last 1000 completed jobs
                },
                removeOnFail: {
                    age: 7 * 24 * 3600 // Keep failed jobs for 7 days
                }
            }
        });
        console.log('✅ Notification Queue initialized');
    } catch (error) {
        console.warn('⚠️  Failed to initialize Notification Queue:', error);
    }
} else {
    console.log('ℹ️  Redis desabilitado - Notification Queue não inicializada');
}

export { notificationQueue };

// Job types
export const NOTIFICATION_JOB_NAMES = {
    LIKE: 'notify-like',
    COMMENT: 'notify-comment',
    FOLLOW: 'notify-follow',
    MENTION: 'notify-mention',
    ACHIEVEMENT: 'notify-achievement',
    LIVRA_EARNED: 'notify-livra-earned',
    SYSTEM: 'notify-system',
    MESSAGE: 'notify-message',
    BULK: 'notify-bulk'
} as const;

// Job data interfaces
export interface NotifyLikeJobData {
    postId: string;
    authorId: string;
    likerId: string;
}

export interface NotifyCommentJobData {
    postId: string;
    authorId: string;
    commenterId: string;
    preview: string;
}

export interface NotifyFollowJobData {
    followingId: string;
    followerId: string;
}

export interface NotifyMentionJobData {
    postId: string;
    mentionedUserId: string;
    mentionerId: string;
}

export interface NotifyAchievementJobData {
    userId: string;
    achievementName: string;
    livraReward: number;
}

export interface NotifyLivraEarnedJobData {
    userId: string;
    amount: number;
    reason: string;
}

export interface NotifySystemJobData {
    userId: string;
    title: string;
    message: string;
    data?: Record<string, any>;
}

export interface NotifyMessageJobData {
    recipientId: string;
    senderId: string;
    messagePreview: string;
    conversationId?: string;
}

export interface NotifyBulkJobData {
    userIds: string[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
}

/**
 * Helper function to add notification jobs to the queue
 * Falls back to direct notification if queue is not available
 */
export async function queueNotification(
    jobName: string, 
    data: any,
    options: { priority?: number; delay?: number } = {}
): Promise<boolean> {
    if (!notificationQueue) {
        return false; // Queue not available, caller should handle directly
    }

    try {
        await notificationQueue.add(jobName, data, {
            priority: options.priority || 5,
            delay: options.delay || 0
        });
        return true;
    } catch (error) {
        console.error('Failed to queue notification:', error);
        return false;
    }
}
