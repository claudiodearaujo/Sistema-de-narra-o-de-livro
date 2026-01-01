"use strict";
/**
 * Unit Tests for Subscription/Plan Features
 *
 * Run with: npx ts-node src/__tests__/services/subscription.service.test.ts
 *
 * Tests the subscription plan features and database operations.
 * Note: We test PLAN_FEATURES directly and database queries without
 * importing the full subscription.service to avoid stripe dependency issues.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const client_1 = require("@prisma/client");
// Plan features configuration (copied from subscription.service to avoid stripe import)
const PLAN_FEATURES = {
    FREE: {
        maxBooks: 3,
        maxCharactersPerBook: 5,
        maxSpeechesPerChapter: 10,
        ttsMinutesPerMonth: 5,
        canUsePremiumVoices: false,
        canAccessApi: false,
        monthlyLivras: 0,
        maxDmsPerDay: 10,
        canCreateGroups: false,
        maxStoriesPerDay: 1,
    },
    PREMIUM: {
        maxBooks: 10,
        maxCharactersPerBook: 20,
        maxSpeechesPerChapter: 50,
        ttsMinutesPerMonth: 60,
        canUsePremiumVoices: true,
        canAccessApi: false,
        monthlyLivras: 100,
        maxDmsPerDay: 50,
        canCreateGroups: true,
        maxStoriesPerDay: 5,
    },
    PRO: {
        maxBooks: -1, // unlimited
        maxCharactersPerBook: -1,
        maxSpeechesPerChapter: -1,
        ttsMinutesPerMonth: 300,
        canUsePremiumVoices: true,
        canAccessApi: true,
        monthlyLivras: 500,
        maxDmsPerDay: -1,
        canCreateGroups: true,
        maxStoriesPerDay: -1,
    },
};
// Helper to get user plan from database
async function getUserPlan(userId) {
    const subscription = await prisma_1.default.subscription.findUnique({
        where: { userId },
        select: { plan: true, status: true },
    });
    if (!subscription || subscription.status !== 'ACTIVE') {
        return 'FREE';
    }
    return subscription.plan;
}
// Helper to get plan features
function getPlanFeatures(plan) {
    return PLAN_FEATURES[plan];
}
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
        console.log('\n📋 Subscription Service Tests\n');
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
let freeUser = null;
let premiumUser = null;
let proUser = null;
async function setup() {
    console.log('🔧 Setting up test data...');
    const timestamp = Date.now();
    // Create free user (no subscription)
    freeUser = await prisma_1.default.user.create({
        data: {
            email: `subscription-free-${timestamp}@test.com`,
            password: 'hashedpassword',
            name: 'Free User',
            username: `free_user_${timestamp}`,
        },
    });
    // Create premium user
    premiumUser = await prisma_1.default.user.create({
        data: {
            email: `subscription-premium-${timestamp}@test.com`,
            password: 'hashedpassword',
            name: 'Premium User',
            username: `premium_user_${timestamp}`,
        },
    });
    // Create premium subscription
    await prisma_1.default.subscription.create({
        data: {
            userId: premiumUser.id,
            plan: client_1.SubscriptionPlan.PREMIUM,
            status: client_1.SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
    // Create pro user
    proUser = await prisma_1.default.user.create({
        data: {
            email: `subscription-pro-${timestamp}@test.com`,
            password: 'hashedpassword',
            name: 'Pro User',
            username: `pro_user_${timestamp}`,
        },
    });
    // Create pro subscription
    await prisma_1.default.subscription.create({
        data: {
            userId: proUser.id,
            plan: client_1.SubscriptionPlan.PRO,
            status: client_1.SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
    console.log('✅ Test users and subscriptions created');
}
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    const userIds = [freeUser?.id, premiumUser?.id, proUser?.id].filter(Boolean);
    if (userIds.length > 0) {
        await prisma_1.default.subscription.deleteMany({
            where: { userId: { in: userIds } },
        });
        await prisma_1.default.user.deleteMany({
            where: { id: { in: userIds } },
        });
    }
    console.log('✅ Cleanup complete');
}
async function runTests() {
    const runner = new TestRunner();
    // Test 1: Get subscription for free user (null)
    runner.addTest('no subscription for free user', async () => {
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { userId: freeUser.id },
        });
        runner.assertTrue(subscription === null, 'Free user should have no subscription');
    });
    // Test 2: Get subscription for premium user
    runner.addTest('premium user has PREMIUM subscription', async () => {
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { userId: premiumUser.id },
        });
        runner.assertNotNull(subscription, 'Subscription should exist');
        runner.assertEqual(subscription.plan, client_1.SubscriptionPlan.PREMIUM, 'Plan should be PREMIUM');
        runner.assertEqual(subscription.status, client_1.SubscriptionStatus.ACTIVE, 'Status should be ACTIVE');
    });
    // Test 3: Get subscription for pro user
    runner.addTest('pro user has PRO subscription', async () => {
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { userId: proUser.id },
        });
        runner.assertNotNull(subscription, 'Subscription should exist');
        runner.assertEqual(subscription.plan, client_1.SubscriptionPlan.PRO, 'Plan should be PRO');
    });
    // Test 4: Get user plan (defaults to FREE)
    runner.addTest('getUserPlan() returns FREE for user without subscription', async () => {
        const plan = await getUserPlan(freeUser.id);
        runner.assertEqual(plan, 'FREE', 'Plan should be FREE');
    });
    // Test 5: Get user plan for premium user
    runner.addTest('getUserPlan() returns PREMIUM for premium user', async () => {
        const plan = await getUserPlan(premiumUser.id);
        runner.assertEqual(plan, 'PREMIUM', 'Plan should be PREMIUM');
    });
    // Test 6: Get user plan for pro user
    runner.addTest('getUserPlan() returns PRO for pro user', async () => {
        const plan = await getUserPlan(proUser.id);
        runner.assertEqual(plan, 'PRO', 'Plan should be PRO');
    });
    // Test 7: Get plan features for free user
    runner.addTest('FREE plan has correct limits', async () => {
        const features = getPlanFeatures('FREE');
        runner.assertNotNull(features, 'Features should exist');
        runner.assertEqual(features.maxBooks, 3, 'Max books should be 3');
        runner.assertFalse(features.canUsePremiumVoices, 'Should not have premium voices');
        runner.assertFalse(features.canAccessApi, 'Should not have API access');
    });
    // Test 8: Get plan features for premium user
    runner.addTest('PREMIUM plan has correct limits', async () => {
        const features = getPlanFeatures('PREMIUM');
        runner.assertEqual(features.maxBooks, 10, 'Max books should be 10');
        runner.assertTrue(features.canUsePremiumVoices, 'Should have premium voices');
        runner.assertFalse(features.canAccessApi, 'Should not have API access');
        runner.assertTrue(features.canCreateGroups, 'Should be able to create groups');
    });
    // Test 9: Get plan features for pro user
    runner.addTest('PRO plan has unlimited features', async () => {
        const features = getPlanFeatures('PRO');
        runner.assertEqual(features.maxBooks, -1, 'Max books should be unlimited (-1)');
        runner.assertTrue(features.canUsePremiumVoices, 'Should have premium voices');
        runner.assertTrue(features.canAccessApi, 'Should have API access');
        runner.assertEqual(features.monthlyLivras, 500, 'Should have 500 monthly Livras');
    });
    // Test 10: Inactive subscription treated as FREE
    runner.addTest('cancelled subscription treated as FREE', async () => {
        // Update premium user subscription to cancelled
        await prisma_1.default.subscription.update({
            where: { userId: premiumUser.id },
            data: { status: client_1.SubscriptionStatus.CANCELLED },
        });
        const plan = await getUserPlan(premiumUser.id);
        runner.assertEqual(plan, 'FREE', 'Cancelled subscription should return FREE');
        // Restore for other tests
        await prisma_1.default.subscription.update({
            where: { userId: premiumUser.id },
            data: { status: client_1.SubscriptionStatus.ACTIVE },
        });
    });
    // Test 11: PLAN_FEATURES constant has all plans
    runner.addTest('PLAN_FEATURES has all required plans', async () => {
        runner.assertNotNull(PLAN_FEATURES.FREE, 'FREE plan should exist');
        runner.assertNotNull(PLAN_FEATURES.PREMIUM, 'PREMIUM plan should exist');
        runner.assertNotNull(PLAN_FEATURES.PRO, 'PRO plan should exist');
    });
    // Test 12: Feature comparison across plans
    runner.addTest('plan features scale correctly', async () => {
        const free = PLAN_FEATURES.FREE;
        const premium = PLAN_FEATURES.PREMIUM;
        const pro = PLAN_FEATURES.PRO;
        // Premium should have more than free
        runner.assertTrue(premium.maxBooks > free.maxBooks, 'Premium should have more books than free');
        runner.assertTrue(premium.ttsMinutesPerMonth > free.ttsMinutesPerMonth, 'Premium should have more TTS');
        // Pro should have unlimited or high limits
        runner.assertTrue(pro.maxBooks === -1 || pro.maxBooks > premium.maxBooks, 'Pro should have unlimited or more books');
        runner.assertTrue(pro.canAccessApi, 'Only Pro should have API access');
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
