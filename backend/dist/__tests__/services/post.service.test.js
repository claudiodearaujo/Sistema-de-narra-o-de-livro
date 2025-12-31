"use strict";
/**
 * Integration Tests for Post Service
 *
 * Run with: npx ts-node src/__tests__/services/post.service.test.ts
 *
 * Tests the post service with real database operations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const post_service_1 = require("../../services/post.service");
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
    async run() {
        console.log('\n📋 Post Service Tests\n');
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
    // Test user IDs - will be populated during setup
    let testUserId;
    let testUser2Id;
    let createdPostId;
    // Setup: Create test users
    runner.addTest('Setup: Create test users', async () => {
        // Clean up any existing test data
        await prisma_1.default.post.deleteMany({
            where: {
                user: {
                    email: { in: ['test-post@example.com', 'test-post2@example.com'] }
                }
            }
        });
        await prisma_1.default.follow.deleteMany({
            where: {
                OR: [
                    { follower: { email: 'test-post@example.com' } },
                    { following: { email: 'test-post@example.com' } },
                    { follower: { email: 'test-post2@example.com' } },
                    { following: { email: 'test-post2@example.com' } }
                ]
            }
        });
        await prisma_1.default.refreshToken.deleteMany({
            where: {
                user: { email: { in: ['test-post@example.com', 'test-post2@example.com'] } }
            }
        });
        await prisma_1.default.user.deleteMany({
            where: {
                email: { in: ['test-post@example.com', 'test-post2@example.com'] }
            }
        });
        // Create test users using prisma directly
        const user1 = await prisma_1.default.user.create({
            data: {
                email: 'test-post@example.com',
                username: 'testpostuser',
                name: 'Test Post User',
                password: 'hashedpassword123',
                role: 'USER'
            }
        });
        testUserId = user1.id;
        const user2 = await prisma_1.default.user.create({
            data: {
                email: 'test-post2@example.com',
                username: 'testpostuser2',
                name: 'Test Post User 2',
                password: 'hashedpassword123',
                role: 'USER'
            }
        });
        testUser2Id = user2.id;
        runner.assertNotNull(testUserId, 'User 1 should be created');
        runner.assertNotNull(testUser2Id, 'User 2 should be created');
    });
    // Test: Create a text post
    runner.addTest('create() should create a text post', async () => {
        const post = await post_service_1.postService.create(testUserId, {
            type: client_1.PostType.TEXT,
            content: 'This is a test post content'
        });
        createdPostId = post.id;
        runner.assertNotNull(post.id, 'Post should have an ID');
        runner.assertEqual(post.content, 'This is a test post content');
        runner.assertEqual(post.type, client_1.PostType.TEXT);
        runner.assertEqual(post.userId, testUserId);
        runner.assertEqual(post.likeCount, 0);
        runner.assertEqual(post.commentCount, 0);
    });
    // Test: Create post with validation error (empty content)
    runner.addTest('create() should fail for empty content', async () => {
        try {
            await post_service_1.postService.create(testUserId, {
                type: client_1.PostType.TEXT,
                content: ''
            });
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('obrigatório') ||
                error.message.toLowerCase().includes('required'), 'Should mention content is required');
        }
    });
    // Test: Create post with validation error (content too long)
    runner.addTest('create() should fail for content over 2000 chars', async () => {
        try {
            await post_service_1.postService.create(testUserId, {
                type: client_1.PostType.TEXT,
                content: 'x'.repeat(2001)
            });
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('2000') ||
                error.message.toLowerCase().includes('exceder'), 'Should mention character limit');
        }
    });
    // Test: Get post by ID
    runner.addTest('getById() should return the post with user data', async () => {
        const post = await post_service_1.postService.getById(createdPostId, testUserId);
        runner.assertNotNull(post, 'Post should exist');
        runner.assertEqual(post.id, createdPostId);
        runner.assertNotNull(post.user, 'Post should include user');
        runner.assertEqual(post.user.username, 'testpostuser');
    });
    // Test: Get post by ID - not found
    runner.addTest('getById() should throw for non-existent post', async () => {
        try {
            await post_service_1.postService.getById('non-existent-id');
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('não encontrado') ||
                error.message.toLowerCase().includes('not found'), 'Should mention post not found');
        }
    });
    // Test: Get user's posts
    runner.addTest('getByUser() should return user posts', async () => {
        const result = await post_service_1.postService.getByUser(testUserId, 1, 10);
        runner.assertGreaterThan(result.data.length, 0, 'Should have at least one post');
        runner.assertEqual(result.data[0].userId, testUserId);
        runner.assertNotNull(result.total, 'Should have total count');
        runner.assertNotNull(result.page, 'Should have page number');
    });
    // Test: Create post with media
    runner.addTest('create() should create a post with media URL', async () => {
        const post = await post_service_1.postService.create(testUserId, {
            type: client_1.PostType.IMAGE,
            content: 'Check out this image!',
            mediaUrl: 'https://example.com/image.jpg'
        });
        runner.assertEqual(post.type, client_1.PostType.IMAGE);
        runner.assertEqual(post.mediaUrl, 'https://example.com/image.jpg');
        // Clean up
        await prisma_1.default.post.delete({ where: { id: post.id } });
    });
    // Test: Follow and get feed
    runner.addTest('getFeed() should return posts from followed users', async () => {
        // User2 follows User1
        await prisma_1.default.follow.create({
            data: {
                followerId: testUser2Id,
                followingId: testUserId
            }
        });
        // Get User2's feed
        const feed = await post_service_1.postService.getFeed(testUser2Id, 1, 10);
        runner.assertGreaterThan(feed.data.length, 0, 'Feed should have posts');
        // Feed should contain posts from User1
        const hasUser1Posts = feed.data.some(p => p.userId === testUserId);
        runner.assertTrue(hasUser1Posts, 'Feed should contain posts from followed user');
    });
    // Test: Explore posts
    runner.addTest('getExplore() should return public posts', async () => {
        const explore = await post_service_1.postService.getExplore(1, 10, testUser2Id);
        runner.assertNotNull(explore.data, 'Explore should return data array');
        runner.assertTrue(explore.total >= 0, 'Should have total count');
    });
    // Test: Delete post (not owner - should fail)
    runner.addTest('delete() should fail for non-owner', async () => {
        try {
            await post_service_1.postService.delete(createdPostId, testUser2Id, false);
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.includes('permissão'), 'Should throw permission error');
        }
    });
    // Test: Delete post (owner)
    runner.addTest('delete() should work for owner', async () => {
        await post_service_1.postService.delete(createdPostId, testUserId, false);
        // Verify deletion
        const deleted = await prisma_1.default.post.findUnique({
            where: { id: createdPostId }
        });
        runner.assertEqual(deleted, null, 'Post should be deleted');
    });
    // Cleanup
    runner.addTest('Cleanup: Remove test data', async () => {
        // Delete all posts from test users
        await prisma_1.default.post.deleteMany({
            where: {
                userId: { in: [testUserId, testUser2Id] }
            }
        });
        // Delete follows
        await prisma_1.default.follow.deleteMany({
            where: {
                OR: [
                    { followerId: testUserId },
                    { followingId: testUserId },
                    { followerId: testUser2Id },
                    { followingId: testUser2Id }
                ]
            }
        });
        // Delete refresh tokens
        await prisma_1.default.refreshToken.deleteMany({
            where: {
                userId: { in: [testUserId, testUser2Id] }
            }
        });
        // Delete test users
        await prisma_1.default.user.deleteMany({
            where: {
                id: { in: [testUserId, testUser2Id] }
            }
        });
        console.log('     Cleanup completed');
    });
    // Run all tests
    const success = await runner.run();
    // Disconnect from database
    await prisma_1.default.$disconnect();
    process.exit(success ? 0 : 1);
}
runTests().catch(async (error) => {
    console.error('Fatal error:', error);
    await prisma_1.default.$disconnect();
    process.exit(1);
});
