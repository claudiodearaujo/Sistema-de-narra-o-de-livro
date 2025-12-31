"use strict";
/**
 * Subscription Worker
 * Handles scheduled tasks for subscriptions
 * Sprint 9: Planos e Pagamentos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSubscriptionQueue = initSubscriptionQueue;
exports.initSubscriptionWorker = initSubscriptionWorker;
exports.scheduleMonthlyLivraCredits = scheduleMonthlyLivraCredits;
exports.scheduleExpirationCheck = scheduleExpirationCheck;
exports.triggerMonthlyLivraCredits = triggerMonthlyLivraCredits;
const bullmq_1 = require("bullmq");
const subscription_service_1 = require("../services/subscription.service");
const redis_1 = require("../lib/redis");
const QUEUE_NAME = 'subscription-tasks';
// Check if Redis is available
const isRedisAvailable = async () => {
    try {
        const client = await redis_1.redis.getClient();
        return client !== null;
    }
    catch {
        return false;
    }
};
// Initialize queue if Redis is enabled
let subscriptionQueue = null;
async function initSubscriptionQueue() {
    if (!await isRedisAvailable()) {
        console.log('⚠️ Redis disabled - Subscription queue not initialized');
        return null;
    }
    const client = await redis_1.redis.getClient();
    if (!client) {
        console.log('⚠️ Redis client not available - Subscription queue not initialized');
        return null;
    }
    subscriptionQueue = new bullmq_1.Queue(QUEUE_NAME, {
        connection: client,
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
    if (!await isRedisAvailable()) {
        console.log('⚠️ Redis disabled - Subscription worker not initialized');
        return null;
    }
    const client = await redis_1.redis.getClient();
    if (!client) {
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
        connection: client,
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
    if (await isRedisAvailable()) {
        await initSubscriptionQueue();
        await initSubscriptionWorker();
        // Schedule jobs after queue is ready
        setTimeout(async () => {
            await scheduleMonthlyLivraCredits();
            await scheduleExpirationCheck();
        }, 1000);
    }
})();
