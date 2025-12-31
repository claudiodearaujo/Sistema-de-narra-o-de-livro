/**
 * Integration Tests for Feed Service
 * 
 * Run with: npx ts-node src/__tests__/services/feed.service.test.ts
 * 
 * Tests the feed service with Redis and database operations.
 */

import prisma from '../../lib/prisma';
import { feedService } from '../../services/feed.service';
import { redisService } from '../../lib/redis';
import { PostType } from '@prisma/client';

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

  assertGreaterThan(actual: number, expected: number, message?: string) {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  }

  assertIncludes(array: any[], item: any, message?: string) {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to include ${item}`);
    }
  }

  async run() {
    console.log('\n📋 Feed Service Tests\n');

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

    console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

async function runTests() {
  const runner = new TestRunner();
  
  // Test data
  let authorId: string;
  let followerId: string;
  let postIds: string[] = [];

  // Setup
  runner.addTest('Setup: Create test users and posts', async () => {
    // Clean up
    await prisma.post.deleteMany({
      where: {
        user: {
          email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] }
        }
      }
    });
    
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { follower: { email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] } } },
          { following: { email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] } } }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] }
      }
    });

    // Create author
    const author = await prisma.user.create({
      data: {
        email: 'test-feed-author@example.com',
        username: 'testfeedauthor',
        name: 'Test Feed Author',
        passwordHash: 'hashedpassword123',
        role: 'USER'
      }
    });
    authorId = author.id;

    // Create follower
    const follower = await prisma.user.create({
      data: {
        email: 'test-feed-follower@example.com',
        username: 'testfeedfollower',
        name: 'Test Feed Follower',
        passwordHash: 'hashedpassword123',
        role: 'USER'
      }
    });
    followerId = follower.id;

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: followerId,
        followingId: authorId
      }
    });

    // Create posts
    for (let i = 0; i < 3; i++) {
      const post = await prisma.post.create({
        data: {
          userId: authorId,
          type: PostType.TEXT,
          content: `Test post ${i + 1}`
        }
      });
      postIds.push(post.id);
    }

    // Clear Redis feed cache for test user
    await redisService.del(`feed:${followerId}`);

    runner.assertNotNull(authorId);
    runner.assertNotNull(followerId);
    runner.assertEqual(postIds.length, 3);
  });

  // Test: Add post to follower feeds (fanout)
  runner.addTest('addPostToFollowerFeeds() should add post to follower feed in Redis', async () => {
    const newPost = await prisma.post.create({
      data: {
        userId: authorId,
        type: PostType.TEXT,
        content: 'Fanout test post'
      }
    });
    postIds.push(newPost.id);

    await feedService.addPostToFollowerFeeds(newPost.id, authorId, newPost.createdAt);

    // Check Redis for follower's feed
    const feedIds = await redisService.getFeed(followerId, 1, 10);
    
    runner.assertIncludes(feedIds, newPost.id, 'Feed should contain the new post');
  });

  // Test: Get user feed
  runner.addTest('getUserFeed() should return post IDs', async () => {
    const result = await feedService.getUserFeed(followerId, 1, 10);

    runner.assertNotNull(result.postIds, 'Should return postIds array');
    runner.assertGreaterThan(result.postIds.length, 0, 'Feed should have posts');
  });

  // Test: Rebuild user feed
  runner.addTest('rebuildUserFeed() should populate Redis cache', async () => {
    // Clear existing cache
    await redisService.del(`feed:${followerId}`);

    // Rebuild
    await feedService.rebuildUserFeed(followerId);

    // Check cache
    const feedIds = await redisService.getFeed(followerId, 1, 10);
    
    runner.assertGreaterThan(feedIds.length, 0, 'Rebuilt feed should have posts');
  });

  // Test: Remove post from feeds
  runner.addTest('removePostFromFeeds() should remove post from Redis', async () => {
    const postToRemove = postIds[0];
    
    // First ensure it's in the feed
    await feedService.rebuildUserFeed(followerId);
    
    // Remove
    await feedService.removePostFromFeeds(postToRemove, authorId);

    // Check it's removed
    const feedIds = await redisService.getFeed(followerId, 1, 100);
    
    runner.assertFalse(feedIds.includes(postToRemove), 'Post should be removed from feed');
  });

  // Test: Get feed size
  runner.addTest('Redis getFeedSize() should return correct count', async () => {
    // Rebuild to get accurate count
    await feedService.rebuildUserFeed(followerId);
    
    const size = await redisService.getFeedSize(followerId);
    
    runner.assertGreaterThan(size, 0, 'Feed size should be greater than 0');
  });

  // Cleanup
  runner.addTest('Cleanup: Remove test data', async () => {
    // Clear Redis
    await redisService.del(`feed:${followerId}`);
    await redisService.del(`feed:${authorId}`);

    // Delete posts
    await prisma.post.deleteMany({
      where: { id: { in: postIds } }
    });

    // Delete follows
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: followerId },
          { followingId: authorId }
        ]
      }
    });

    // Delete users
    await prisma.user.deleteMany({
      where: {
        id: { in: [authorId, followerId] }
      }
    });

    console.log('     Cleanup completed');
  });

  // Run all tests
  const success = await runner.run();
  
  // Disconnect
  await prisma.$disconnect();
  await redisService.quit();
  
  process.exit(success ? 0 : 1);
}

runTests().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
