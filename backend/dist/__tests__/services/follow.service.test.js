"use strict";
/**
 * Unit Tests for Follow Service
 *
 * Run with: npx ts-node src/__tests__/services/follow.service.test.ts
 *
 * Tests the follow/unfollow functionality.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const follow_service_1 = require("../../services/follow.service");
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
    assertGreaterOrEqual(actual, expected, message) {
        if (actual < expected) {
            throw new Error(message || `Expected ${actual} to be >= ${expected}`);
        }
    }
    async run() {
        console.log('\n📋 Follow Service Tests\n');
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
        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
        return this.failed === 0;
    }
}
// Test data
let userA = null;
let userB = null;
let userC = null;
async function setup() {
    console.log('🔧 Setting up test data...');
    const timestamp = Date.now();
    // Create test users
    userA = await prisma_1.default.user.create({
        data: {
            email: `follow-test-a-${timestamp}@test.com`,
            password: 'hashedpassword',
            name: 'User A',
            username: `user_a_${timestamp}`,
        },
    });
    userB = await prisma_1.default.user.create({
        data: {
            email: `follow-test-b-${timestamp}@test.com`,
            password: 'hashedpassword',
            name: 'User B',
            username: `user_b_${timestamp}`,
        },
    });
    userC = await prisma_1.default.user.create({
        data: {
            email: `follow-test-c-${timestamp}@test.com`,
            password: 'hashedpassword',
            name: 'User C',
            username: `user_c_${timestamp}`,
        },
    });
    console.log('✅ Test users created');
}
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    const userIds = [userA?.id, userB?.id, userC?.id].filter(Boolean);
    if (userIds.length > 0) {
        // Delete follows
        await prisma_1.default.follow.deleteMany({
            where: {
                OR: [
                    { followerId: { in: userIds } },
                    { followingId: { in: userIds } },
                ],
            },
        });
        // Delete notifications
        await prisma_1.default.notification.deleteMany({
            where: { userId: { in: userIds } },
        });
        // Delete livra data
        await prisma_1.default.livraTransaction.deleteMany({
            where: { userId: { in: userIds } },
        });
        await prisma_1.default.livraBalance.deleteMany({
            where: { userId: { in: userIds } },
        });
        // Delete users
        await prisma_1.default.user.deleteMany({
            where: { id: { in: userIds } },
        });
    }
    console.log('✅ Cleanup complete');
}
async function runTests() {
    const runner = new TestRunner();
    // Test 1: Toggle follow (creates follow)
    runner.addTest('toggleFollow() creates follow relationship', async () => {
        const result = await follow_service_1.followService.toggleFollow(userA.id, userB.id);
        runner.assertNotNull(result, 'Follow result should exist');
        runner.assertTrue(result.following, 'Should now be following');
        runner.assertGreaterOrEqual(result.followerCount, 1, 'Follower count should be >= 1');
    });
    // Test 2: Check follow status
    runner.addTest('getFollowStatus() returns correct status', async () => {
        const status = await follow_service_1.followService.getFollowStatus(userA.id, userB.id);
        runner.assertTrue(status.isFollowing, 'userA should be following userB');
        runner.assertFalse(status.isFollowedBy, 'userB should not be following userA');
    });
    // Test 3: Get followers
    runner.addTest('getFollowers() returns correct followers', async () => {
        const result = await follow_service_1.followService.getFollowers(userB.id);
        runner.assertNotNull(result, 'Followers should not be null');
        runner.assertGreaterOrEqual(result.users.length, 1, 'Should have at least 1 follower');
        const hasUserA = result.users.some((f) => f.id === userA.id);
        runner.assertTrue(hasUserA, 'userA should be in followers list');
    });
    // Test 4: Get following
    runner.addTest('getFollowing() returns correct following', async () => {
        const result = await follow_service_1.followService.getFollowing(userA.id);
        runner.assertNotNull(result, 'Following should not be null');
        runner.assertGreaterOrEqual(result.users.length, 1, 'Should have at least 1 following');
        const hasUserB = result.users.some((f) => f.id === userB.id);
        runner.assertTrue(hasUserB, 'userB should be in following list');
    });
    // Test 5: Follow another user
    runner.addTest('can follow multiple users', async () => {
        await follow_service_1.followService.toggleFollow(userA.id, userC.id);
        const result = await follow_service_1.followService.getFollowing(userA.id);
        runner.assertGreaterOrEqual(result.users.length, 2, 'Should have 2 following');
    });
    // Test 6: Cannot follow self
    runner.addTest('toggleFollow() prevents self-follow', async () => {
        let errorThrown = false;
        try {
            await follow_service_1.followService.toggleFollow(userA.id, userA.id);
        }
        catch (error) {
            errorThrown = true;
        }
        runner.assertTrue(errorThrown, 'Should throw error for self-follow');
    });
    // Test 7: Toggle unfollow
    runner.addTest('toggleFollow() can unfollow user', async () => {
        const result = await follow_service_1.followService.toggleFollow(userA.id, userC.id);
        runner.assertFalse(result.following, 'Should not be following after toggle');
    });
    // Test 8: Follow status - not following
    runner.addTest('getFollowStatus() shows not following after unfollow', async () => {
        const status = await follow_service_1.followService.getFollowStatus(userA.id, userC.id);
        runner.assertFalse(status.isFollowing, 'userA should not be following userC');
    });
    // Test 9: Mutual follow
    runner.addTest('mutual follow is detected correctly', async () => {
        // userB follows userA back
        await follow_service_1.followService.toggleFollow(userB.id, userA.id);
        const statusA = await follow_service_1.followService.getFollowStatus(userA.id, userB.id);
        runner.assertTrue(statusA.isFollowing, 'userA should be following userB');
        runner.assertTrue(statusA.isFollowedBy, 'userB should be following userA');
    });
    // Test 10: Pagination in followers
    runner.addTest('getFollowers() supports pagination', async () => {
        const result = await follow_service_1.followService.getFollowers(userA.id, 1, 10);
        runner.assertNotNull(result, 'Result should exist');
        runner.assertNotNull(result.total, 'Total should exist');
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
    }
    catch (error) {
        console.error('❌ Test execution failed:', error);
        await cleanup();
        process.exit(1);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
}
main();
