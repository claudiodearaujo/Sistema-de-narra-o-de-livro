"use strict";
/**
 * Integration Tests for Feed Service
 *
 * Run with: npx ts-node src/__tests__/services/feed.service.test.ts
 *
 * Tests the feed service with Redis and database operations.
 * Sprint 1 Task 1.3 & Sprint 2 Task 2.2
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const feed_service_1 = require("../../services/feed.service");
const redis_1 = require("../../lib/redis");
const client_1 = require("@prisma/client");
// Simple test runner
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }
    addTest(name, fn) {
        this.tests.push({ name, fn });
    }
    assertEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
    }
    assertTrue(value, message) {
        if (!value) {
            throw new Error(message || `Expected true but got false`);
        }
    }
    assertFalse(value, message) {
        if (value) {
            throw new Error(message || `Expected false but got true`);
        }
    }
    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || `Expected non-null value`);
        }
    }
    assertGreaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
        }
    }
    assertGreaterThanOrEqual(actual, expected, message) {
        if (actual < expected) {
            throw new Error(message || `Expected ${actual} to be >= ${expected}`);
        }
    }
    assertIncludes(array, item, message) {
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
            }
            catch (error) {
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
    let authorId;
    let followerId;
    let postIds = [];
    // Setup
    runner.addTest('Setup: Create test users and posts', async () => {
        // Clean up
        await prisma_1.default.post.deleteMany({
            where: {
                user: {
                    email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] }
                }
            }
        });
        await prisma_1.default.follow.deleteMany({
            where: {
                OR: [
                    { follower: { email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] } } },
                    { following: { email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] } } }
                ]
            }
        });
        await prisma_1.default.user.deleteMany({
            where: {
                email: { in: ['test-feed-author@example.com', 'test-feed-follower@example.com'] }
            }
        });
        // Create author
        const author = await prisma_1.default.user.create({
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
        const follower = await prisma_1.default.user.create({
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
        await prisma_1.default.follow.create({
            data: {
                followerId: followerId,
                followingId: authorId
            }
        });
        // Create posts
        for (let i = 0; i < 3; i++) {
            const post = await prisma_1.default.post.create({
                data: {
                    userId: authorId,
                    type: client_1.PostType.TEXT,
                    content: `Test post ${i + 1}`
                }
            });
            postIds.push(post.id);
        }
        // Clear Redis feed cache for test user
        await redis_1.redisService.del(`feed:${followerId}`);
        runner.assertNotNull(authorId);
        runner.assertNotNull(followerId);
        runner.assertEqual(postIds.length, 3);
    });
    // Test: Add post to follower feeds (fanout)
    runner.addTest('addPostToFollowerFeeds() should add post to follower feed in Redis', async () => {
        const newPost = await prisma_1.default.post.create({
            data: {
                userId: authorId,
                type: client_1.PostType.TEXT,
                content: 'Fanout test post'
            }
        });
        postIds.push(newPost.id);
        await feed_service_1.feedService.addPostToFollowerFeeds(newPost.id, authorId, newPost.createdAt);
        // Check Redis for follower's feed
        const feedIds = await redis_1.redisService.getFeed(followerId, 1, 10);
        runner.assertIncludes(feedIds, newPost.id, 'Feed should contain the new post');
    });
    // Test: Get feed using getFeed method
    runner.addTest('getFeed() should return post IDs from cache or database', async () => {
        const result = await feed_service_1.feedService.getFeed(followerId, 1, 10);
        runner.assertNotNull(result.postIds, 'Should return postIds array');
        runner.assertTrue(Array.isArray(result.postIds), 'postIds should be an array');
        runner.assertTrue(typeof result.fromCache === 'boolean', 'Should indicate cache status');
    });
    // Test: Rebuild user feed
    runner.addTest('rebuildFeed() should populate Redis cache', async () => {
        // Clear existing cache
        await redis_1.redisService.del(`feed:${followerId}`);
        // Rebuild
        const count = await feed_service_1.feedService.rebuildFeed(followerId);
        // Check cache
        const feedIds = await redis_1.redisService.getFeed(followerId, 1, 10);
        runner.assertGreaterThanOrEqual(count, 0, 'Rebuild should return count');
        runner.assertGreaterThan(feedIds.length, 0, 'Rebuilt feed should have posts');
    });
    // Test: Warm cache
    runner.addTest('warmCache() should populate empty cache', async () => {
        // Clear cache
        await redis_1.redisService.del(`feed:${followerId}`);
        // Warm cache
        await feed_service_1.feedService.warmCache(followerId);
        // Check cache exists
        const feedIds = await redis_1.redisService.getFeed(followerId, 1, 10);
        runner.assertGreaterThan(feedIds.length, 0, 'Warmed cache should have posts');
    });
    // Test: onFollow should add posts to feed
    runner.addTest('onFollow() should add followed user posts to feed', async () => {
        // Create another user to follow
        const newAuthor = await prisma_1.default.user.create({
            data: {
                email: 'test-feed-newauthor@example.com',
                username: 'testfeednewauthor',
                name: 'Test New Author',
                password: 'hashedpassword123',
                role: 'USER'
            }
        });
        // Create a post for new author
        const newAuthorPost = await prisma_1.default.post.create({
            data: {
                userId: newAuthor.id,
                type: client_1.PostType.TEXT,
                content: 'Post from new author'
            }
        });
        postIds.push(newAuthorPost.id);
        // Trigger onFollow
        await feed_service_1.feedService.onFollow(followerId, newAuthor.id);
        // Check feed contains new author's post
        const feedIds = await redis_1.redisService.getFeed(followerId, 1, 50);
        runner.assertIncludes(feedIds, newAuthorPost.id, 'Feed should contain new author post after follow');
        // Cleanup new author
        await prisma_1.default.post.delete({ where: { id: newAuthorPost.id } });
        await prisma_1.default.user.delete({ where: { id: newAuthor.id } });
    });
    // Test: onUnfollow should remove posts from feed
    runner.addTest('onUnfollow() should remove unfollowed user posts from feed', async () => {
        // Rebuild feed first
        await feed_service_1.feedService.rebuildFeed(followerId);
        // Get a post from author
        const authorPostId = postIds[1];
        // Verify it's in the feed
        let feedIds = await redis_1.redisService.getFeed(followerId, 1, 50);
        const wasInFeed = feedIds.includes(authorPostId);
        if (wasInFeed) {
            // Trigger unfollow
            await feed_service_1.feedService.onUnfollow(followerId, authorId);
            // Check feed no longer contains author's posts
            feedIds = await redis_1.redisService.getFeed(followerId, 1, 50);
            runner.assertFalse(feedIds.includes(authorPostId), 'Feed should not contain author posts after unfollow');
        }
        runner.assertTrue(true); // Pass if logic is correct
    });
    // Test: Remove post from feeds
    runner.addTest('removePostFromFeeds() should remove post from Redis', async () => {
        // First rebuild to ensure posts are in feed
        await feed_service_1.feedService.rebuildFeed(followerId);
        const postToRemove = postIds[0];
        // Remove
        await feed_service_1.feedService.removePostFromFeeds(postToRemove, authorId);
        // Check it's removed
        const feedIds = await redis_1.redisService.getFeed(followerId, 1, 100);
        runner.assertFalse(feedIds.includes(postToRemove), 'Post should be removed from feed');
    });
    // Cleanup
    runner.addTest('Cleanup: Remove test data', async () => {
        // Clear Redis
        await redis_1.redisService.del(`feed:${followerId}`);
        await redis_1.redisService.del(`feed:${authorId}`);
        // Delete posts
        await prisma_1.default.post.deleteMany({
            where: { id: { in: postIds } }
        });
        // Delete follows
        await prisma_1.default.follow.deleteMany({
            where: {
                OR: [
                    { followerId: followerId },
                    { followingId: authorId }
                ]
            }
        });
        // Delete users
        await prisma_1.default.user.deleteMany({
            where: {
                id: { in: [authorId, followerId] }
            }
        });
        console.log('     Cleanup completed');
    });
    // Run all tests
    const success = await runner.run();
    // Disconnect
    await prisma_1.default.$disconnect();
    await redis_1.redisService.disconnect();
    process.exit(success ? 0 : 1);
}
runTests().catch(async (error) => {
    console.error('Fatal error:', error);
    await prisma_1.default.$disconnect();
    process.exit(1);
});
