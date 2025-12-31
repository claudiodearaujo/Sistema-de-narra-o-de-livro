"use strict";
/**
 * Unit Tests for Redis Service
 *
 * Run with: npx ts-node src/__tests__/lib/redis.test.ts
 *
 * Note: These tests require a running Redis instance.
 * Set REDIS_HOST, REDIS_PORT, REDIS_PASSWORD env vars if needed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../../lib/redis");
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
    async run() {
        console.log('\n📋 Redis Service Tests\n');
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
    const testPrefix = 'test:livria:';
    // Test: Redis singleton
    runner.addTest('RedisService should be a singleton', async () => {
        const instance1 = redis_1.RedisService.getInstance();
        const instance2 = redis_1.RedisService.getInstance();
        runner.assertTrue(instance1 === instance2, 'Should return same instance');
    });
    // Test: Basic set/get
    runner.addTest('set and get should work correctly', async () => {
        const key = `${testPrefix}basic`;
        const value = 'hello world';
        await redis_1.redis.set(key, value);
        const result = await redis_1.redis.get(key);
        runner.assertEqual(result, value);
        // Cleanup
        await redis_1.redis.del(key);
    });
    // Test: Set with TTL
    runner.addTest('set with TTL should expire', async () => {
        const key = `${testPrefix}ttl`;
        const value = 'temporary';
        await redis_1.redis.set(key, value, 1); // 1 second TTL
        // Should exist immediately
        let result = await redis_1.redis.get(key);
        runner.assertEqual(result, value);
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 1100));
        result = await redis_1.redis.get(key);
        runner.assertEqual(result, null, 'Key should be expired');
    });
    // Test: Delete
    runner.addTest('del should remove key', async () => {
        const key = `${testPrefix}delete`;
        await redis_1.redis.set(key, 'to be deleted');
        await redis_1.redis.del(key);
        const result = await redis_1.redis.get(key);
        runner.assertEqual(result, null);
    });
    // Test: Increment
    runner.addTest('incr should increment value', async () => {
        const key = `${testPrefix}counter`;
        await redis_1.redis.del(key); // Ensure clean state
        const result1 = await redis_1.redis.incr(key);
        runner.assertEqual(result1, 1);
        const result2 = await redis_1.redis.incr(key);
        runner.assertEqual(result2, 2);
        // Cleanup
        await redis_1.redis.del(key);
    });
    // Test: Feed operations - addToFeed
    runner.addTest('addToFeed should add post to user feed', async () => {
        const userId = `${testPrefix}user1`;
        const postId = 'post123';
        const timestamp = Date.now();
        await redis_1.redis.invalidateFeed(userId); // Clean state
        await redis_1.redis.addToFeed(userId, postId, timestamp);
        const feed = await redis_1.redis.getFeed(userId, 1, 10);
        runner.assertTrue(feed.includes(postId), 'Feed should contain the post');
        // Cleanup
        await redis_1.redis.invalidateFeed(userId);
    });
    // Test: Feed operations - getFeed with pagination
    runner.addTest('getFeed should return posts in correct order', async () => {
        const userId = `${testPrefix}user2`;
        await redis_1.redis.invalidateFeed(userId); // Clean state
        // Add posts with different timestamps
        const now = Date.now();
        await redis_1.redis.addToFeed(userId, 'post1', now - 3000);
        await redis_1.redis.addToFeed(userId, 'post2', now - 2000);
        await redis_1.redis.addToFeed(userId, 'post3', now - 1000);
        await redis_1.redis.addToFeed(userId, 'post4', now);
        // Get first page
        const feed = await redis_1.redis.getFeed(userId, 1, 2);
        runner.assertEqual(feed.length, 2);
        runner.assertEqual(feed[0], 'post4', 'Most recent should be first');
        runner.assertEqual(feed[1], 'post3');
        // Get second page
        const feed2 = await redis_1.redis.getFeed(userId, 2, 2);
        runner.assertEqual(feed2.length, 2);
        runner.assertEqual(feed2[0], 'post2');
        runner.assertEqual(feed2[1], 'post1');
        // Cleanup
        await redis_1.redis.invalidateFeed(userId);
    });
    // Test: Feed operations - removeFromFeed
    runner.addTest('removeFromFeed should remove post from feed', async () => {
        const userId = `${testPrefix}user3`;
        const postId = 'post_to_remove';
        await redis_1.redis.invalidateFeed(userId);
        await redis_1.redis.addToFeed(userId, postId, Date.now());
        await redis_1.redis.addToFeed(userId, 'other_post', Date.now() + 1);
        await redis_1.redis.removeFromFeed(userId, postId);
        const feed = await redis_1.redis.getFeed(userId, 1, 10);
        runner.assertFalse(feed.includes(postId), 'Post should be removed');
        runner.assertTrue(feed.includes('other_post'), 'Other post should remain');
        // Cleanup
        await redis_1.redis.invalidateFeed(userId);
    });
    // Test: Feed operations - invalidateFeed
    runner.addTest('invalidateFeed should clear entire feed', async () => {
        const userId = `${testPrefix}user4`;
        await redis_1.redis.addToFeed(userId, 'post1', Date.now());
        await redis_1.redis.addToFeed(userId, 'post2', Date.now());
        await redis_1.redis.invalidateFeed(userId);
        const feed = await redis_1.redis.getFeed(userId, 1, 10);
        runner.assertEqual(feed.length, 0, 'Feed should be empty');
    });
    // Test: isFeedCached
    runner.addTest('isFeedCached should return correct status', async () => {
        const userId = `${testPrefix}user5`;
        await redis_1.redis.invalidateFeed(userId);
        const notCached = await redis_1.redis.isFeedCached(userId);
        runner.assertFalse(notCached, 'Should not be cached initially');
        await redis_1.redis.addToFeed(userId, 'post1', Date.now());
        const isCached = await redis_1.redis.isFeedCached(userId);
        runner.assertTrue(isCached, 'Should be cached after adding post');
        // Cleanup
        await redis_1.redis.invalidateFeed(userId);
    });
    // Test: JSON operations
    runner.addTest('setJSON and getJSON should handle objects', async () => {
        const key = `${testPrefix}json`;
        const data = { name: 'Test', count: 42, active: true };
        await redis_1.redis.setJSON(key, data);
        const result = await redis_1.redis.getJSON(key);
        runner.assertEqual(result, data);
        // Cleanup
        await redis_1.redis.del(key);
    });
    // Test: Health check
    runner.addTest('healthCheck should return connected status', async () => {
        const health = await redis_1.redis.healthCheck();
        runner.assertTrue(health.connected, 'Should be connected');
        runner.assertNotNull(health.latency, 'Should have latency');
    });
    // Run all tests
    try {
        const success = await runner.run();
        // Disconnect after tests
        await redis_1.redis.disconnect();
        process.exit(success ? 0 : 1);
    }
    catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        await redis_1.redis.disconnect();
        process.exit(1);
    }
}
// Run tests
runTests().catch(console.error);
