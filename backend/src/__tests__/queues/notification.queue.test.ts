/**
 * Notification Queue & Worker Tests
 * Sprint 6.6: Background notification processing with BullMQ
 */

import { 
    notificationQueue, 
    NOTIFICATION_JOB_NAMES,
    queueNotification
} from '../../queues/notification.queue';
import { notificationWorker, closeNotificationWorker } from '../../queues/notification.worker';
import prisma from '../../lib/prisma';

// Test results tracking
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.log(`  ✗ ${message}`);
        failed++;
    }
}

async function runTests() {
    console.log('\n📧 Notification Queue Tests (Sprint 6.6)\n');
    
    // Setup: Create test user
    console.log('  ⚙️ Setup: Create test users');
    const testUser1 = await prisma.user.create({
        data: {
            email: `queue-test1-${Date.now()}@test.com`,
            name: 'Queue Test User 1',
            password: 'hashedpassword'
        }
    });

    const testUser2 = await prisma.user.create({
        data: {
            email: `queue-test2-${Date.now()}@test.com`,
            name: 'Queue Test User 2',
            password: 'hashedpassword'
        }
    });

    try {
        // Test 1: Queue should be available if Redis is enabled
        const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';
        if (REDIS_ENABLED) {
            assert(notificationQueue !== null, 'Notification queue should be initialized when Redis is enabled');
            assert(notificationWorker !== null, 'Notification worker should be initialized when Redis is enabled');
        } else {
            assert(notificationQueue === null, 'Notification queue should be null when Redis is disabled');
            console.log('  ℹ️ Redis disabled - skipping queue-specific tests');
        }

        // Test 2: Job names should be defined
        assert(NOTIFICATION_JOB_NAMES.LIKE === 'notify-like', 'LIKE job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.COMMENT === 'notify-comment', 'COMMENT job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.FOLLOW === 'notify-follow', 'FOLLOW job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.MENTION === 'notify-mention', 'MENTION job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.ACHIEVEMENT === 'notify-achievement', 'ACHIEVEMENT job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.LIVRA_EARNED === 'notify-livra-earned', 'LIVRA_EARNED job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.SYSTEM === 'notify-system', 'SYSTEM job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.MESSAGE === 'notify-message', 'MESSAGE job name should be defined');
        assert(NOTIFICATION_JOB_NAMES.BULK === 'notify-bulk', 'BULK job name should be defined');

        // Test 3: queueNotification should return false if queue is not available
        if (!notificationQueue) {
            const result = await queueNotification(NOTIFICATION_JOB_NAMES.SYSTEM, {
                userId: testUser1.id,
                title: 'Test',
                message: 'Test message'
            });
            assert(result === false, 'queueNotification should return false when queue is not available');
        }

        // Test 4: If queue is available, test adding a job
        if (notificationQueue) {
            const result = await queueNotification(NOTIFICATION_JOB_NAMES.SYSTEM, {
                userId: testUser1.id,
                title: 'Queue Test',
                message: 'This is a queued notification'
            });
            assert(result === true, 'queueNotification should return true when job is added');

            // Wait a bit for the worker to process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check if notification was created
            const notification = await prisma.notification.findFirst({
                where: {
                    userId: testUser1.id,
                    title: 'Queue Test'
                }
            });
            assert(notification !== null, 'Worker should process and create notification');
            assert(notification?.message === 'This is a queued notification', 'Notification message should match');

            // Clean up the test notification
            if (notification) {
                await prisma.notification.delete({ where: { id: notification.id } });
            }
        }

        // Test 5: Test follow notification queueing
        if (notificationQueue) {
            const result = await queueNotification(NOTIFICATION_JOB_NAMES.FOLLOW, {
                followingId: testUser1.id,
                followerId: testUser2.id
            });
            assert(result === true, 'Follow notification should be queued');

            // Wait for worker to process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check if follow notification was created
            const followNotification = await prisma.notification.findFirst({
                where: {
                    userId: testUser1.id,
                    type: 'FOLLOW'
                },
                orderBy: { createdAt: 'desc' }
            });
            assert(followNotification !== null, 'Follow notification should be created by worker');
            assert(
                followNotification?.message.includes(testUser2.name) === true, 
                'Follow notification should mention follower name'
            );

            // Clean up
            if (followNotification) {
                await prisma.notification.delete({ where: { id: followNotification.id } });
            }
        }

    } finally {
        // Cleanup
        console.log('     Cleanup completed');
        await prisma.notification.deleteMany({ where: { userId: { in: [testUser1.id, testUser2.id] } } });
        await prisma.user.deleteMany({ where: { id: { in: [testUser1.id, testUser2.id] } } });
    }

    console.log(`  ✓ Cleanup: Remove test data`);

    // Summary
    console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
    
    // Close worker gracefully
    if (notificationWorker) {
        await closeNotificationWorker();
        console.log('👋 Notification Worker: Closed gracefully');
    }

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
