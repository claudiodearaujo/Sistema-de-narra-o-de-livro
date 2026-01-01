"use strict";
/**
 * Unit Tests for Plan Limits Middleware
 *
 * Run with: npx ts-node src/__tests__/middleware/plan-limits.middleware.test.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Import the middleware functions and config
const plan_limits_middleware_1 = require("../../middleware/plan-limits.middleware");
// Simple test runner
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
    }
    test(name, fn) {
        try {
            fn();
            console.log(`  ✅ ${name}`);
            this.passed++;
        }
        catch (error) {
            console.log(`  ❌ ${name}`);
            console.log(`     Error: ${error.message}`);
            this.failed++;
        }
    }
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected} but got ${actual}`);
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
    summary() {
        console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}
console.log('\n📋 Plan Limits Middleware Tests\n');
const runner = new TestRunner();
// Test PLAN_LIMITS configuration
runner.test('PLAN_LIMITS should have FREE plan with correct limits', () => {
    const freePlan = plan_limits_middleware_1.PLAN_LIMITS.FREE;
    runner.assertEqual(freePlan.maxBooks, 3, 'FREE should have 3 max books');
    runner.assertTrue(freePlan.canUseTTS, 'FREE should have basic TTS');
    runner.assertEqual(freePlan.monthlyLivras, 0, 'FREE should have 0 monthly Livras');
});
runner.test('PLAN_LIMITS should have PREMIUM plan with correct limits', () => {
    const premiumPlan = plan_limits_middleware_1.PLAN_LIMITS.PREMIUM;
    runner.assertEqual(premiumPlan.maxBooks, 10, 'PREMIUM should have 10 max books');
    runner.assertTrue(premiumPlan.canUseTTS, 'PREMIUM should have TTS');
    runner.assertEqual(premiumPlan.monthlyLivras, 100, 'PREMIUM should have 100 monthly Livras');
});
runner.test('PLAN_LIMITS should have PRO plan with unlimited books', () => {
    const proPlan = plan_limits_middleware_1.PLAN_LIMITS.PRO;
    runner.assertEqual(proPlan.maxBooks, -1, 'PRO should have unlimited (-1) books');
    runner.assertTrue(proPlan.canUseTTS, 'PRO should have TTS');
    runner.assertEqual(proPlan.monthlyLivras, 500, 'PRO should have 500 monthly Livras');
});
// Test helper functions
runner.test('isPremiumOrAbove should return false for FREE', () => {
    runner.assertFalse((0, plan_limits_middleware_1.isPremiumOrAbove)('FREE'), 'FREE is not premium or above');
});
runner.test('isPremiumOrAbove should return true for PREMIUM', () => {
    runner.assertTrue((0, plan_limits_middleware_1.isPremiumOrAbove)('PREMIUM'), 'PREMIUM is premium or above');
});
runner.test('isPremiumOrAbove should return true for PRO', () => {
    runner.assertTrue((0, plan_limits_middleware_1.isPremiumOrAbove)('PRO'), 'PRO is premium or above');
});
runner.test('isPro should return false for FREE', () => {
    runner.assertFalse((0, plan_limits_middleware_1.isPro)('FREE'), 'FREE is not PRO');
});
runner.test('isPro should return false for PREMIUM', () => {
    runner.assertFalse((0, plan_limits_middleware_1.isPro)('PREMIUM'), 'PREMIUM is not PRO');
});
runner.test('isPro should return true for PRO', () => {
    runner.assertTrue((0, plan_limits_middleware_1.isPro)('PRO'), 'PRO is PRO');
});
runner.test('getPlanLimits should return correct limits for each plan', () => {
    const freeLimits = (0, plan_limits_middleware_1.getPlanLimits)('FREE');
    const premiumLimits = (0, plan_limits_middleware_1.getPlanLimits)('PREMIUM');
    const proLimits = (0, plan_limits_middleware_1.getPlanLimits)('PRO');
    runner.assertEqual(freeLimits.maxBooks, 3);
    runner.assertEqual(premiumLimits.maxBooks, 10);
    runner.assertEqual(proLimits.maxBooks, -1);
});
// Test feature differences between plans
runner.test('TTS feature should be enabled for all plans', () => {
    runner.assertTrue(plan_limits_middleware_1.PLAN_LIMITS.FREE.canUseTTS, 'FREE should have basic TTS');
    runner.assertTrue(plan_limits_middleware_1.PLAN_LIMITS.PREMIUM.canUseTTS, 'PREMIUM should have TTS');
    runner.assertTrue(plan_limits_middleware_1.PLAN_LIMITS.PRO.canUseTTS, 'PRO should have TTS');
});
runner.test('Image generation should be disabled for FREE and enabled for paid plans', () => {
    runner.assertFalse(plan_limits_middleware_1.PLAN_LIMITS.FREE.canUseImageGen, 'FREE should not have ImageGen');
    runner.assertTrue(plan_limits_middleware_1.PLAN_LIMITS.PREMIUM.canUseImageGen, 'PREMIUM should have ImageGen');
    runner.assertTrue(plan_limits_middleware_1.PLAN_LIMITS.PRO.canUseImageGen, 'PRO should have ImageGen');
});
runner.test('Campaign creation should be disabled for FREE and enabled for paid plans', () => {
    runner.assertFalse(plan_limits_middleware_1.PLAN_LIMITS.FREE.canCreateCampaigns, 'FREE should not create campaigns');
    runner.assertTrue(plan_limits_middleware_1.PLAN_LIMITS.PREMIUM.canCreateCampaigns, 'PREMIUM should create campaigns');
    runner.assertTrue(plan_limits_middleware_1.PLAN_LIMITS.PRO.canCreateCampaigns, 'PRO should create campaigns');
});
const success = runner.summary();
process.exit(success ? 0 : 1);
