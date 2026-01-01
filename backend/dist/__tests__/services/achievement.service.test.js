"use strict";
/**
 * Unit Tests for Achievement Service
 *
 * Run with: npx ts-node src/__tests__/services/achievement.service.test.ts
 *
 * Tests the achievement/gamification system.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const achievement_service_1 = require("../../services/achievement.service");
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
    assertGreaterOrEqual(actual, expected, message) {
        if (actual < expected) {
            throw new Error(message || `Expected ${actual} to be >= ${expected}`);
        }
    }
    async run() {
        console.log('\n📋 Achievement Service Tests\n');
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
let testUser = null;
let testAchievement = null;
async function setup() {
    console.log('🔧 Setting up test data...');
    const timestamp = Date.now();
    // Create test user
    testUser = await prisma_1.default.user.create({
        data: {
            email: `achievement-test-${timestamp}@test.com`,
            password: 'hashedpassword',
            name: 'Test User',
            username: `achievement_user_${timestamp}`,
        },
    });
    // Create test achievement
    testAchievement = await prisma_1.default.achievement.create({
        data: {
            key: `test_achievement_${timestamp}`,
            category: client_1.AchievementCategory.SOCIAL,
            name: 'Test Achievement',
            description: 'A test achievement for testing',
            icon: '🏆',
            livraReward: 10,
            requirement: { type: 'posts_count', target: 1 },
            isHidden: false,
        },
    });
    console.log('✅ Test data created');
}
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    if (testUser) {
        // Delete user achievements
        await prisma_1.default.userAchievement.deleteMany({
            where: { userId: testUser.id },
        });
        // Delete notifications
        await prisma_1.default.notification.deleteMany({
            where: { userId: testUser.id },
        });
        // Delete livra data
        await prisma_1.default.livraTransaction.deleteMany({
            where: { userId: testUser.id },
        });
        await prisma_1.default.livraBalance.deleteMany({
            where: { userId: testUser.id },
        });
        // Delete user
        await prisma_1.default.user.delete({ where: { id: testUser.id } }).catch(() => { });
    }
    if (testAchievement) {
        await prisma_1.default.achievement.delete({ where: { id: testAchievement.id } }).catch(() => { });
    }
    console.log('✅ Cleanup complete');
}
async function runTests() {
    const runner = new TestRunner();
    // Test 1: Get all achievements
    runner.addTest('getAllAchievements() returns achievements list', async () => {
        const achievements = await achievement_service_1.achievementService.getAllAchievements();
        runner.assertNotNull(achievements, 'Achievements should exist');
        runner.assertGreaterOrEqual(achievements.length, 1, 'Should have at least 1 achievement');
    });
    // Test 2: Get user achievements (initially empty)
    runner.addTest('getUserAchievements() returns user achievement status', async () => {
        const userAchievements = await achievement_service_1.achievementService.getUserAchievements(testUser.id);
        runner.assertNotNull(userAchievements, 'User achievements should exist');
        // All should be locked initially
        const allLocked = userAchievements.every(a => !a.unlockedAt);
        runner.assertTrue(allLocked, 'All should be locked initially');
    });
    // Test 3: Get achievement stats
    runner.addTest('getAchievementStats() returns correct stats', async () => {
        const stats = await achievement_service_1.achievementService.getAchievementStats(testUser.id);
        runner.assertNotNull(stats, 'Stats should exist');
        runner.assertGreaterOrEqual(stats.total, 1, 'Should have at least 1 total');
        runner.assertEqual(stats.unlocked, 0, 'Should have 0 unlocked');
        runner.assertEqual(stats.percentage, 0, 'Percentage should be 0');
    });
    // Test 4: Unlock achievement manually (returns void)
    runner.addTest('unlockAchievement() unlocks for user', async () => {
        // Directly unlock the test achievement (returns void)
        await achievement_service_1.achievementService.unlockAchievement(testUser.id, testAchievement);
        // Check if unlocked
        const userAchievements = await prisma_1.default.userAchievement.findMany({
            where: { userId: testUser.id },
        });
        const hasUnlocked = userAchievements.some(ua => ua.achievementId === testAchievement.id);
        runner.assertTrue(hasUnlocked, 'Achievement should be unlocked');
    });
    // Test 5: Get achievements by user ID (public view)
    runner.addTest('getAchievementsByUserId() returns unlocked achievements', async () => {
        const achievements = await achievement_service_1.achievementService.getAchievementsByUserId(testUser.id);
        runner.assertNotNull(achievements, 'Achievements should exist');
        runner.assertGreaterOrEqual(achievements.length, 1, 'Should have at least 1 unlocked');
    });
    // Test 6: Stats updated after unlock
    runner.addTest('stats update after unlock', async () => {
        const stats = await achievement_service_1.achievementService.getAchievementStats(testUser.id);
        runner.assertGreaterOrEqual(stats.unlocked, 1, 'Should have at least 1 unlocked');
        runner.assertGreaterOrEqual(stats.percentage, 0, 'Percentage should be >= 0');
    });
    // Test 7: Livra reward is granted
    runner.addTest('livra reward is granted on unlock', async () => {
        const balance = await prisma_1.default.livraBalance.findUnique({
            where: { userId: testUser.id },
        });
        runner.assertNotNull(balance, 'Balance should exist');
        runner.assertGreaterOrEqual(balance.balance, testAchievement.livraReward, 'Balance should include reward');
    });
    // Test 8: Check and unlock by action type
    runner.addTest('checkAndUnlock() checks achievements by action type', async () => {
        // Create a post for the user to trigger the check
        const post = await prisma_1.default.post.create({
            data: {
                userId: testUser.id,
                content: 'Test post for achievement',
            },
        });
        try {
            // Check for unlocks
            const unlockedList = await achievement_service_1.achievementService.checkAndUnlock(testUser.id, 'posts_count');
            // Should return an array (may or may not have unlocked something)
            runner.assertNotNull(unlockedList, 'Unlocked list should exist');
            runner.assertTrue(Array.isArray(unlockedList), 'Should be an array');
        }
        finally {
            // Clean up post
            await prisma_1.default.post.delete({ where: { id: post.id } });
        }
    });
    // Test 9: Recent unlocks in stats
    runner.addTest('recent unlocks are included in stats', async () => {
        const stats = await achievement_service_1.achievementService.getAchievementStats(testUser.id);
        runner.assertNotNull(stats.recentUnlocks, 'Recent unlocks should exist');
        runner.assertGreaterOrEqual(stats.recentUnlocks.length, 1, 'Should have at least 1 recent unlock');
    });
    // Test 10: Notification created on unlock
    runner.addTest('notification is created on achievement unlock', async () => {
        const notifications = await prisma_1.default.notification.findMany({
            where: {
                userId: testUser.id,
                type: 'ACHIEVEMENT',
            },
        });
        runner.assertGreaterOrEqual(notifications.length, 1, 'Should have at least 1 achievement notification');
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
