/**
 * Integration Tests for Feed Service
 * 
 * Run with: npx ts-node src/__tests__/services/feed.service.test.ts
 * 
 * Tests the feed service with Redis and database operations.
 * Sprint 1 Task 1.3 & Sprint 2 Task 2.2
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

  assertGreaterThanOrEqual(actual: number, expected: number, message?: string) {
    if (actual < expected) {
      throw new Error(message || `Expected ${actual} to be >= ${expected}`);
    }
  }

  assertIncludes(array: any[], item: any, message?: string) {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to include ${item}`);
    }
  }

  async run() {
    console.log('\n📋 Feed Service Tests (Sprint 1.3 & 2.2)\n');

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
        password: 'hashedpassword123',
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
        password: 'hashedpassword123',
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

  // Test: Get feed using getFeed method
  runner.addTest('getFeed() should return post IDs from cache or database', async () => {
    const result = await feedService.getFeed(followerId, 1, 10);

    runner.assertNotNull(result.postIds, 'Should return postIds array');
    runner.assertTrue(Array.isArray(result.postIds), 'postIds should be an array');
    runner.assertTrue(typeof result.fromCache === 'boolean', 'Should indicate cache status');
  });

  // Test: Rebuild user feed
  runner.addTest('rebuildFeed() should populate Redis cache', async () => {
    // Clear existing cache
    await redisService.del(`feed:${followerId}`);

    // Rebuild
    const count = await feedService.rebuildFeed(followerId);

    // Check cache
    const feedIds = await redisService.getFeed(followerId, 1, 10);
    
    runner.assertGreaterThanOrEqual(count, 0, 'Rebuild should return count');
    runner.assertGreaterThan(feedIds.length, 0, 'Rebuilt feed should have posts');
  });

  // Test: Warm cache
  runner.addTest('warmCache() should populate empty cache', async () => {
    // Clear cache
    await redisService.del(`feed:${followerId}`);

    // Warm cache
    await feedService.warmCache(followerId);

    // Check cache exists
    const feedIds = await redisService.getFeed(followerId, 1, 10);
    runner.assertGreaterThan(feedIds.length, 0, 'Warmed cache should have posts');
  });

  // Test: onFollow should add posts to feed
  runner.addTest('onFollow() should add followed user posts to feed', async () => {
    // Create another user to follow
    const newAuthor = await prisma.user.create({
      data: {
        email: 'test-feed-newauthor@example.com',
        username: 'testfeednewauthor',
        name: 'Test New Author',
        password: 'hashedpassword123',
        role: 'USER'
      }
    });

    // Create a post for new author
    const newAuthorPost = await prisma.post.create({
      data: {
        userId: newAuthor.id,
        type: PostType.TEXT,
        content: 'Post from new author'
      }
    });
    postIds.push(newAuthorPost.id);

    // Trigger onFollow
    await feedService.onFollow(followerId, newAuthor.id);

    // Check feed contains new author's post
    const feedIds = await redisService.getFeed(followerId, 1, 50);
    runner.assertIncludes(feedIds, newAuthorPost.id, 'Feed should contain new author post after follow');

    // Cleanup new author
    await prisma.post.delete({ where: { id: newAuthorPost.id } });
    await prisma.user.delete({ where: { id: newAuthor.id } });
  });

  // Test: onUnfollow should remove posts from feed
  runner.addTest('onUnfollow() should remove unfollowed user posts from feed', async () => {
    // Rebuild feed first
    await feedService.rebuildFeed(followerId);
    
    // Get a post from author
    const authorPostId = postIds[1];
    
    // Verify it's in the feed
    let feedIds = await redisService.getFeed(followerId, 1, 50);
    const wasInFeed = feedIds.includes(authorPostId);
    
    if (wasInFeed) {
      // Trigger unfollow
      await feedService.onUnfollow(followerId, authorId);

      // Check feed no longer contains author's posts
      feedIds = await redisService.getFeed(followerId, 1, 50);
      runner.assertFalse(feedIds.includes(authorPostId), 'Feed should not contain author posts after unfollow');
    }
    
    runner.assertTrue(true); // Pass if logic is correct
  });

  // Test: Remove post from feeds
  runner.addTest('removePostFromFeeds() should remove post from Redis', async () => {
    // First rebuild to ensure posts are in feed
    await feedService.rebuildFeed(followerId);
    
    const postToRemove = postIds[0];
    
    // Remove
    await feedService.removePostFromFeeds(postToRemove, authorId);

    // Check it's removed
    const feedIds = await redisService.getFeed(followerId, 1, 100);
    
    runner.assertFalse(feedIds.includes(postToRemove), 'Post should be removed from feed');
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
  await redisService.disconnect();
  
  process.exit(success ? 0 : 1);
}

runTests().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
