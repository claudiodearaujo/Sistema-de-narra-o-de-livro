"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_JOB_NAMES = exports.notificationQueue = void 0;
exports.queueNotification = queueNotification;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_config_1 = require("../config/redis.config");
dotenv_1.default.config();
let connection = null;
let notificationQueue = null;
exports.notificationQueue = notificationQueue;
if ((0, redis_config_1.isRedisEnabled)()) {
    try {
        connection = new ioredis_1.default((0, redis_config_1.getRedisConfig)());
        connection.on('ready', () => {
            console.log('✅ Redis connected (Notification Queue)');
        });
        connection.on('error', (err) => {
            console.warn('⚠️  Redis error (Notification):', err.message);
        });
        connection.on('close', () => {
            console.warn('⚠️  Redis connection closed (Notification)');
        });
        exports.notificationQueue = notificationQueue = new bullmq_1.Queue('notifications', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: {
                    age: 24 * 3600, // Keep completed jobs for 24 hours
                    count: 1000 // Keep last 1000 completed jobs
                },
                removeOnFail: {
                    age: 7 * 24 * 3600 // Keep failed jobs for 7 days
                }
            }
        });
        console.log('✅ Notification Queue initialized');
    }
    catch (error) {
        console.warn('⚠️  Failed to initialize Notification Queue:', error);
    }
}
else {
    console.log('ℹ️  Redis desabilitado - Notification Queue não inicializada');
}
// Job types
exports.NOTIFICATION_JOB_NAMES = {
    LIKE: 'notify-like',
    COMMENT: 'notify-comment',
    FOLLOW: 'notify-follow',
    MENTION: 'notify-mention',
    ACHIEVEMENT: 'notify-achievement',
    LIVRA_EARNED: 'notify-livra-earned',
    SYSTEM: 'notify-system',
    MESSAGE: 'notify-message',
    BULK: 'notify-bulk'
};
/**
 * Helper function to add notification jobs to the queue
 * Falls back to direct notification if queue is not available
 */
async function queueNotification(jobName, data, options = {}) {
    if (!notificationQueue) {
        return false; // Queue not available, caller should handle directly
    }
    try {
        await notificationQueue.add(jobName, data, {
            priority: options.priority || 5,
            delay: options.delay || 0
        });
        return true;
    }
    catch (error) {
        console.error('Failed to queue notification:', error);
        return false;
    }
}
