/**
 * Unit Tests for Notification Service
 * 
 * Run with: npx ts-node src/__tests__/services/notification.service.test.ts
 * 
 * Tests the notification system.
 */

import prisma from '../../lib/prisma';
import { notificationService } from '../../services/notification.service';
import { NotificationType } from '@prisma/client';

// Simple test runner
class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  addTest(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  assertEqual(actual: any, expected: any, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  }

  assertTrue(value: boolean, message?: string) {
    if (!value) {
      throw new Error(message || `Expected true but got false`);
    }
  }

  assertFalse(value: boolean, message?: string) {
    if (value) {
      throw new Error(message || `Expected false but got true`);
    }
  }

  assertNotNull(value: any, message?: string) {
    if (value === null || value === undefined) {
      throw new Error(message || `Expected non-null value`);
    }
  }

  assertGreaterOrEqual(actual: number, expected: number, message?: string) {
    if (actual < expected) {
      throw new Error(message || `Expected ${actual} to be >= ${expected}`);
    }
  }

  async run() {
    console.log('\n📋 Notification Service Tests\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`  ✅ ${test.name}`);
        this.passed++;
      } catch (error: any) {
        console.log(`  ❌ ${test.name}`);
        console.log(`     Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
    return this.failed === 0;
  }
}

// Test data
let testUser: any = null;
let actorUser: any = null;

async function setup() {
  console.log('🔧 Setting up test data...');
  
  const timestamp = Date.now();
  
  // Create test user (receiver)
  testUser = await prisma.user.create({
    data: {
      email: `notif-test-${timestamp}@test.com`,
      password: 'hashedpassword',
      name: 'Notification Test User',
      username: `notif_user_${timestamp}`,
    },
  });
  
  // Create actor user (sender)
  actorUser = await prisma.user.create({
    data: {
      email: `notif-actor-${timestamp}@test.com`,
      password: 'hashedpassword',
      name: 'Actor User',
      username: `actor_user_${timestamp}`,
    },
  });
  
  console.log('✅ Test users created');
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  const userIds = [testUser?.id, actorUser?.id].filter(Boolean);
  
  if (userIds.length > 0) {
    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: { in: userIds } },
    });
    
    // Delete users
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }
  
  console.log('✅ Cleanup complete');
}

async function runTests() {
  const runner = new TestRunner();

  // Test 1: Create notification using create()
  runner.addTest('create() creates notification', async () => {
    const notification = await notificationService.create({
      userId: testUser.id,
      type: NotificationType.LIKE,
      title: 'Test Like',
      message: 'Someone liked your post',
      data: { actorId: actorUser.id },
    });
    
    runner.assertNotNull(notification, 'Notification should be created');
    runner.assertEqual(notification.userId, testUser.id, 'UserId should match');
    runner.assertEqual(notification.type, NotificationType.LIKE, 'Type should match');
    runner.assertFalse(notification.isRead, 'Should be unread initially');
  });

  // Test 2: Get notifications using getByUser()
  runner.addTest('getByUser() returns user notifications', async () => {
    const result = await notificationService.getByUser(testUser.id);
    
    runner.assertNotNull(result, 'Result should not be null');
    runner.assertNotNull(result.notifications, 'Notifications array should exist');
    runner.assertGreaterOrEqual(result.notifications.length, 1, 'Should have at least 1 notification');
  });

  // Test 3: Get unread count
  runner.addTest('getUnreadCount() returns correct count', async () => {
    const count = await notificationService.getUnreadCount(testUser.id);
    
    runner.assertGreaterOrEqual(count, 1, 'Should have at least 1 unread');
  });

  // Test 4: Create another notification
  runner.addTest('can create multiple notifications', async () => {
    await notificationService.create({
      userId: testUser.id,
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      message: 'Someone followed you',
      data: { actorId: actorUser.id },
    });
    
    const count = await notificationService.getUnreadCount(testUser.id);
    runner.assertGreaterOrEqual(count, 2, 'Should have at least 2 unread');
  });

  // Test 5: Mark notification as read
  runner.addTest('markAsRead() marks notification as read', async () => {
    const result = await notificationService.getByUser(testUser.id);
    const notificationId = result.notifications[0].id;
    
    await notificationService.markAsRead(notificationId, testUser.id);
    
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    
    runner.assertTrue(notification?.isRead === true, 'Notification should be marked as read');
  });

  // Test 6: Get counts using getCounts()
  runner.addTest('getCounts() returns total and unread', async () => {
    const counts = await notificationService.getCounts(testUser.id);
    
    runner.assertNotNull(counts, 'Counts should not be null');
    runner.assertGreaterOrEqual(counts.total, 2, 'Should have at least 2 total');
    runner.assertGreaterOrEqual(counts.unread, 1, 'Should have at least 1 unread');
  });

  // Test 7: Mark all as read
  runner.addTest('markAllAsRead() marks all notifications as read', async () => {
    // Create a new unread notification first
    await notificationService.create({
      userId: testUser.id,
      type: NotificationType.COMMENT,
      title: 'New Comment',
      message: 'Someone commented on your post',
    });
    
    await notificationService.markAllAsRead(testUser.id);
    
    const count = await notificationService.getUnreadCount(testUser.id);
    runner.assertEqual(count, 0, 'All notifications should be read');
  });

  // Test 8: Get notifications with pagination
  runner.addTest('getByUser() respects pagination', async () => {
    const result = await notificationService.getByUser(testUser.id, 1, 2);
    
    runner.assertEqual(result.limit, 2, 'Limit should be 2');
    runner.assertEqual(result.page, 1, 'Page should be 1');
  });

  // Test 9: Filter by type
  runner.addTest('getByUser() can filter by type', async () => {
    const result = await notificationService.getByUser(testUser.id, 1, 10, NotificationType.LIKE);
    
    runner.assertNotNull(result, 'Result should exist');
    const allAreLikes = result.notifications.every(n => n.type === NotificationType.LIKE);
    runner.assertTrue(allAreLikes, 'All should be LIKE type');
  });

  // Test 10: Delete notification
  runner.addTest('delete() removes notification', async () => {
    const result = await notificationService.getByUser(testUser.id);
    const notificationId = result.notifications[0].id;
    
    await notificationService.delete(notificationId, testUser.id);
    
    const deleted = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    
    runner.assertTrue(deleted === null, 'Notification should be deleted');
  });

  return runner.run();
}

// Main execution
async function main() {
  try {
    await setup();
    const success = await runTests();
    await cleanup();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    await cleanup();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
