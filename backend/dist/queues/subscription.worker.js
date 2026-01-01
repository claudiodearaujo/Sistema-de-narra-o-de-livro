"use strict";
/**
 * Subscription Worker
 * Handles scheduled tasks for subscriptions
 * Sprint 9: Planos e Pagamentos
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSubscriptionQueue = initSubscriptionQueue;
exports.initSubscriptionWorker = initSubscriptionWorker;
exports.scheduleMonthlyLivraCredits = scheduleMonthlyLivraCredits;
exports.scheduleExpirationCheck = scheduleExpirationCheck;
exports.triggerMonthlyLivraCredits = triggerMonthlyLivraCredits;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const subscription_service_1 = require("../services/subscription.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const QUEUE_NAME = 'subscription-tasks';
// Redis connection for BullMQ (requires maxRetriesPerRequest: null)
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';
let connection = null;
const createConnection = () => {
    if (!REDIS_ENABLED)
        return null;
    try {
        return new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn('⚠️ Redis not available for subscription worker');
                    return null;
                }
                return Math.min(times * 100, 3000);
            }
        });
    }
    catch {
        return null;
    }
};
// Initialize queue if Redis is enabled
let subscriptionQueue = null;
async function initSubscriptionQueue() {
    if (!REDIS_ENABLED) {
        console.log('⚠️ Redis disabled - Subscription queue not initialized');
        return null;
    }
    if (!connection) {
        connection = createConnection();
    }
    if (!connection) {
        console.log('⚠️ Redis client not available - Subscription queue not initialized');
        return null;
    }
    subscriptionQueue = new bullmq_1.Queue(QUEUE_NAME, {
        connection: connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000, // 1 minute
            },
            removeOnComplete: true,
            removeOnFail: 100,
        },
    });
    console.log('✅ Subscription queue initialized');
    return subscriptionQueue;
}
// Initialize worker
async function initSubscriptionWorker() {
    if (!REDIS_ENABLED) {
        console.log('⚠️ Redis disabled - Subscription worker not initialized');
        return null;
    }
    // Create a separate connection for the worker
    const workerConnection = createConnection();
    if (!workerConnection) {
        console.log('⚠️ Redis client not available - Subscription worker not initialized');
        return null;
    }
    const worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => {
        console.log(`Processing subscription job: ${job.name}`);
        switch (job.name) {
            case 'monthly-livra-credits':
                return await processMonthlyLivraCredits();
            case 'check-expired-subscriptions':
                return await checkExpiredSubscriptions();
            default:
                console.warn(`Unknown job type: ${job.name}`);
        }
    }, {
        connection: workerConnection,
        concurrency: 1,
    });
    worker.on('completed', (job) => {
        console.log(`✅ Subscription job completed: ${job.name}`);
    });
    worker.on('failed', (job, err) => {
        console.error(`❌ Subscription job failed: ${job?.name}`, err);
    });
    console.log('✅ Subscription worker initialized');
    return worker;
}
/**
 * Schedule monthly Livra credits job
 * Should run on the 1st of each month at 00:05
 */
async function scheduleMonthlyLivraCredits() {
    if (!subscriptionQueue) {
        console.warn('Subscription queue not initialized');
        return;
    }
    // Remove existing scheduled job if any
    const existingJobs = await subscriptionQueue.getRepeatableJobs();
    for (const job of existingJobs) {
        if (job.name === 'monthly-livra-credits') {
            await subscriptionQueue.removeRepeatableByKey(job.key);
        }
    }
    // Schedule new job - runs on 1st of each month at 00:05
    await subscriptionQueue.add('monthly-livra-credits', {}, {
        repeat: {
            pattern: '5 0 1 * *', // At 00:05 on day 1 of every month
        },
    });
    console.log('✅ Monthly Livra credits job scheduled');
}
/**
 * Schedule subscription expiration check
 * Runs daily at 01:00
 */
async function scheduleExpirationCheck() {
    if (!subscriptionQueue) {
        console.warn('Subscription queue not initialized');
        return;
    }
    // Remove existing scheduled job if any
    const existingJobs = await subscriptionQueue.getRepeatableJobs();
    for (const job of existingJobs) {
        if (job.name === 'check-expired-subscriptions') {
            await subscriptionQueue.removeRepeatableByKey(job.key);
        }
    }
    // Schedule new job - runs daily at 01:00
    await subscriptionQueue.add('check-expired-subscriptions', {}, {
        repeat: {
            pattern: '0 1 * * *', // At 01:00 every day
        },
    });
    console.log('✅ Subscription expiration check job scheduled');
}
/**
 * Process monthly Livra credits for all active paid subscriptions
 */
async function processMonthlyLivraCredits() {
    console.log('Starting monthly Livra credits processing...');
    const result = await subscription_service_1.subscriptionService.processMonthlyLivraCredits();
    console.log(`Monthly Livra credits completed: ${result.processed} processed, ${result.errors} errors`);
    return result;
}
/**
 * Check for expired subscriptions and update their status
 */
async function checkExpiredSubscriptions() {
    console.log('Checking for expired subscriptions...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        // Find subscriptions that should have expired
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'ACTIVE',
                plan: { not: 'FREE' },
                currentPeriodEnd: { lt: new Date() },
                cancelAtPeriodEnd: true,
            },
        });
        let expiredCount = 0;
        for (const sub of expiredSubscriptions) {
            try {
                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: {
                        plan: 'FREE',
                        status: 'CANCELLED',
                        stripeSubscriptionId: null,
                        stripePriceId: null,
                        cancelAtPeriodEnd: false,
                    },
                });
                await prisma.user.update({
                    where: { id: sub.userId },
                    data: { role: 'USER' },
                });
                expiredCount++;
            }
            catch (error) {
                console.error(`Error expiring subscription ${sub.id}:`, error);
            }
        }
        console.log(`Checked ${expiredSubscriptions.length} subscriptions, ${expiredCount} expired`);
        return { checked: expiredSubscriptions.length, expired: expiredCount };
    }
    finally {
        await prisma.$disconnect();
    }
}
/**
 * Manually trigger monthly Livra credits (for testing/admin)
 */
async function triggerMonthlyLivraCredits() {
    return await processMonthlyLivraCredits();
}
// Initialize asynchronously
(async () => {
    if (REDIS_ENABLED) {
        await initSubscriptionQueue();
        await initSubscriptionWorker();
        // Schedule jobs after queue is ready
        setTimeout(async () => {
            await scheduleMonthlyLivraCredits();
            await scheduleExpirationCheck();
        }, 1000);
    }
})();
