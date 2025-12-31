"use strict";
/**
 * Notification Queue & Worker Tests
 * Sprint 6.6: Background notification processing with BullMQ
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_queue_1 = require("../../queues/notification.queue");
const notification_worker_1 = require("../../queues/notification.worker");
const prisma_1 = __importDefault(require("../../lib/prisma"));
// Test results tracking
let passed = 0;
let failed = 0;
function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    }
    else {
        console.log(`  ✗ ${message}`);
        failed++;
    }
}
async function runTests() {
    console.log('\n📧 Notification Queue Tests (Sprint 6.6)\n');
    // Setup: Create test user
    console.log('  ⚙️ Setup: Create test users');
    const testUser1 = await prisma_1.default.user.create({
        data: {
            email: `queue-test1-${Date.now()}@test.com`,
            name: 'Queue Test User 1',
            password: 'hashedpassword'
        }
    });
    const testUser2 = await prisma_1.default.user.create({
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
            assert(notification_queue_1.notificationQueue !== null, 'Notification queue should be initialized when Redis is enabled');
            assert(notification_worker_1.notificationWorker !== null, 'Notification worker should be initialized when Redis is enabled');
        }
        else {
            assert(notification_queue_1.notificationQueue === null, 'Notification queue should be null when Redis is disabled');
            console.log('  ℹ️ Redis disabled - skipping queue-specific tests');
        }
        // Test 2: Job names should be defined
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.LIKE === 'notify-like', 'LIKE job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.COMMENT === 'notify-comment', 'COMMENT job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.FOLLOW === 'notify-follow', 'FOLLOW job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.MENTION === 'notify-mention', 'MENTION job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.ACHIEVEMENT === 'notify-achievement', 'ACHIEVEMENT job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.LIVRA_EARNED === 'notify-livra-earned', 'LIVRA_EARNED job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.SYSTEM === 'notify-system', 'SYSTEM job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.MESSAGE === 'notify-message', 'MESSAGE job name should be defined');
        assert(notification_queue_1.NOTIFICATION_JOB_NAMES.BULK === 'notify-bulk', 'BULK job name should be defined');
        // Test 3: queueNotification should return false if queue is not available
        if (!notification_queue_1.notificationQueue) {
            const result = await (0, notification_queue_1.queueNotification)(notification_queue_1.NOTIFICATION_JOB_NAMES.SYSTEM, {
                userId: testUser1.id,
                title: 'Test',
                message: 'Test message'
            });
            assert(result === false, 'queueNotification should return false when queue is not available');
        }
        // Test 4: If queue is available, test adding a job
        if (notification_queue_1.notificationQueue) {
            const result = await (0, notification_queue_1.queueNotification)(notification_queue_1.NOTIFICATION_JOB_NAMES.SYSTEM, {
                userId: testUser1.id,
                title: 'Queue Test',
                message: 'This is a queued notification'
            });
            assert(result === true, 'queueNotification should return true when job is added');
            // Wait a bit for the worker to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Check if notification was created
            const notification = await prisma_1.default.notification.findFirst({
                where: {
                    userId: testUser1.id,
                    title: 'Queue Test'
                }
            });
            assert(notification !== null, 'Worker should process and create notification');
            assert(notification?.message === 'This is a queued notification', 'Notification message should match');
            // Clean up the test notification
            if (notification) {
                await prisma_1.default.notification.delete({ where: { id: notification.id } });
            }
        }
        // Test 5: Test follow notification queueing
        if (notification_queue_1.notificationQueue) {
            const result = await (0, notification_queue_1.queueNotification)(notification_queue_1.NOTIFICATION_JOB_NAMES.FOLLOW, {
                followingId: testUser1.id,
                followerId: testUser2.id
            });
            assert(result === true, 'Follow notification should be queued');
            // Wait for worker to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Check if follow notification was created
            const followNotification = await prisma_1.default.notification.findFirst({
                where: {
                    userId: testUser1.id,
                    type: 'FOLLOW'
                },
                orderBy: { createdAt: 'desc' }
            });
            assert(followNotification !== null, 'Follow notification should be created by worker');
            assert(followNotification?.message.includes(testUser2.name) === true, 'Follow notification should mention follower name');
            // Clean up
            if (followNotification) {
                await prisma_1.default.notification.delete({ where: { id: followNotification.id } });
            }
        }
    }
    finally {
        // Cleanup
        console.log('     Cleanup completed');
        await prisma_1.default.notification.deleteMany({ where: { userId: { in: [testUser1.id, testUser2.id] } } });
        await prisma_1.default.user.deleteMany({ where: { id: { in: [testUser1.id, testUser2.id] } } });
    }
    console.log(`  ✓ Cleanup: Remove test data`);
    // Summary
    console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
    // Close worker gracefully
    if (notification_worker_1.notificationWorker) {
        await (0, notification_worker_1.closeNotificationWorker)();
        console.log('👋 Notification Worker: Closed gracefully');
    }
    if (failed > 0) {
        process.exit(1);
    }
}
runTests().catch(console.error);
