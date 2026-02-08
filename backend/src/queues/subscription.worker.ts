/**
 * Subscription Worker
 * Handles scheduled tasks for subscriptions
 * Sprint 9: Planos e Pagamentos
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma';
import { subscriptionService } from '../services/subscription.service';
import dotenv from 'dotenv';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';

dotenv.config();

const QUEUE_NAME = 'subscription-tasks';

let connection: IORedis | null = null;

const createConnection = (): IORedis | null => {
  if (!isRedisEnabled()) return null;

  try {
    return new IORedis(getRedisConfig());
  } catch {
    return null;
  }
};

// Initialize queue if Redis is enabled
let subscriptionQueue: Queue | null = null;

export async function initSubscriptionQueue(): Promise<Queue | null> {
  if (!isRedisEnabled()) {
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

  subscriptionQueue = new Queue(QUEUE_NAME, {
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
export async function initSubscriptionWorker(): Promise<Worker | null> {
  if (!isRedisEnabled()) {
    console.log('⚠️ Redis disabled - Subscription worker not initialized');
    return null;
  }

  // Create a separate connection for the worker
  const workerConnection = createConnection();
  
  if (!workerConnection) {
    console.log('⚠️ Redis client not available - Subscription worker not initialized');
    return null;
  }

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      console.log(`Processing subscription job: ${job.name}`);

      switch (job.name) {
        case 'monthly-livra-credits':
          return await processMonthlyLivraCredits();
        
        case 'check-expired-subscriptions':
          return await checkExpiredSubscriptions();
        
        default:
          console.warn(`Unknown job type: ${job.name}`);
      }
    },
    {
      connection: workerConnection,
      concurrency: 1,
    }
  );

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
export async function scheduleMonthlyLivraCredits(): Promise<void> {
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
  await subscriptionQueue.add(
    'monthly-livra-credits',
    {},
    {
      repeat: {
        pattern: '5 0 1 * *', // At 00:05 on day 1 of every month
      },
    }
  );

  console.log('✅ Monthly Livra credits job scheduled');
}

/**
 * Schedule subscription expiration check
 * Runs daily at 01:00
 */
export async function scheduleExpirationCheck(): Promise<void> {
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
  await subscriptionQueue.add(
    'check-expired-subscriptions',
    {},
    {
      repeat: {
        pattern: '0 1 * * *', // At 01:00 every day
      },
    }
  );

  console.log('✅ Subscription expiration check job scheduled');
}

/**
 * Process monthly Livra credits for all active paid subscriptions
 */
async function processMonthlyLivraCredits(): Promise<{ processed: number; errors: number }> {
  console.log('Starting monthly Livra credits processing...');
  
  const result = await subscriptionService.processMonthlyLivraCredits();
  
  console.log(`Monthly Livra credits completed: ${result.processed} processed, ${result.errors} errors`);
  
  return result;
}

/**
 * Check for expired subscriptions and update their status
 */
async function checkExpiredSubscriptions(): Promise<{ checked: number; expired: number }> {
  console.log('Checking for expired subscriptions...');
  
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
    } catch (error) {
      console.error(`Error expiring subscription ${sub.id}:`, error);
    }
  }

  console.log(`Checked ${expiredSubscriptions.length} subscriptions, ${expiredCount} expired`);

  return { checked: expiredSubscriptions.length, expired: expiredCount };
}

/**
 * Manually trigger monthly Livra credits (for testing/admin)
 */
export async function triggerMonthlyLivraCredits(): Promise<{ processed: number; errors: number }> {
  return await processMonthlyLivraCredits();
}

// Initialize asynchronously
(async () => {
  if (isRedisEnabled()) {
    await initSubscriptionQueue();
    await initSubscriptionWorker();
    
    // Schedule jobs after queue is ready
    setTimeout(async () => {
      await scheduleMonthlyLivraCredits();
      await scheduleExpirationCheck();
    }, 1000);
  }
})();
