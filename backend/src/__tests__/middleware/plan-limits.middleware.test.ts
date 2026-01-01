/**
 * Unit Tests for Plan Limits Middleware
 * 
 * Run with: npx ts-node src/__tests__/middleware/plan-limits.middleware.test.ts
 */

import { Request, Response, NextFunction } from 'express';
import { SubscriptionPlan } from '@prisma/client';

// Import the middleware functions and config
import { 
  PLAN_LIMITS, 
  isPremiumOrAbove, 
  isPro, 
  getPlanLimits 
} from '../../middleware/plan-limits.middleware';

// Simple test runner
class TestRunner {
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      this.passed++;
    } catch (error: any) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      this.failed++;
    }
  }

  assertEqual(actual: any, expected: any, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
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

  summary() {
    console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

console.log('\n📋 Plan Limits Middleware Tests\n');

const runner = new TestRunner();

// Test PLAN_LIMITS configuration
runner.test('PLAN_LIMITS should have FREE plan with correct limits', () => {
  const freePlan = PLAN_LIMITS.FREE;
  runner.assertEqual(freePlan.maxBooks, 3, 'FREE should have 3 max books');
  runner.assertTrue(freePlan.canUseTTS, 'FREE should have basic TTS');
  runner.assertEqual(freePlan.monthlyLivras, 0, 'FREE should have 0 monthly Livras');
});

runner.test('PLAN_LIMITS should have PREMIUM plan with correct limits', () => {
  const premiumPlan = PLAN_LIMITS.PREMIUM;
  runner.assertEqual(premiumPlan.maxBooks, 10, 'PREMIUM should have 10 max books');
  runner.assertTrue(premiumPlan.canUseTTS, 'PREMIUM should have TTS');
  runner.assertEqual(premiumPlan.monthlyLivras, 100, 'PREMIUM should have 100 monthly Livras');
});

runner.test('PLAN_LIMITS should have PRO plan with unlimited books', () => {
  const proPlan = PLAN_LIMITS.PRO;
  runner.assertEqual(proPlan.maxBooks, -1, 'PRO should have unlimited (-1) books');
  runner.assertTrue(proPlan.canUseTTS, 'PRO should have TTS');
  runner.assertEqual(proPlan.monthlyLivras, 500, 'PRO should have 500 monthly Livras');
});

// Test helper functions
runner.test('isPremiumOrAbove should return false for FREE', () => {
  runner.assertFalse(isPremiumOrAbove('FREE'), 'FREE is not premium or above');
});

runner.test('isPremiumOrAbove should return true for PREMIUM', () => {
  runner.assertTrue(isPremiumOrAbove('PREMIUM'), 'PREMIUM is premium or above');
});

runner.test('isPremiumOrAbove should return true for PRO', () => {
  runner.assertTrue(isPremiumOrAbove('PRO'), 'PRO is premium or above');
});

runner.test('isPro should return false for FREE', () => {
  runner.assertFalse(isPro('FREE'), 'FREE is not PRO');
});

runner.test('isPro should return false for PREMIUM', () => {
  runner.assertFalse(isPro('PREMIUM'), 'PREMIUM is not PRO');
});

runner.test('isPro should return true for PRO', () => {
  runner.assertTrue(isPro('PRO'), 'PRO is PRO');
});

runner.test('getPlanLimits should return correct limits for each plan', () => {
  const freeLimits = getPlanLimits('FREE');
  const premiumLimits = getPlanLimits('PREMIUM');
  const proLimits = getPlanLimits('PRO');

  runner.assertEqual(freeLimits.maxBooks, 3);
  runner.assertEqual(premiumLimits.maxBooks, 10);
  runner.assertEqual(proLimits.maxBooks, -1);
});

// Test feature differences between plans
runner.test('TTS feature should be enabled for all plans', () => {
  runner.assertTrue(PLAN_LIMITS.FREE.canUseTTS, 'FREE should have basic TTS');
  runner.assertTrue(PLAN_LIMITS.PREMIUM.canUseTTS, 'PREMIUM should have TTS');
  runner.assertTrue(PLAN_LIMITS.PRO.canUseTTS, 'PRO should have TTS');
});

runner.test('Image generation should be disabled for FREE and enabled for paid plans', () => {
  runner.assertFalse(PLAN_LIMITS.FREE.canUseImageGen, 'FREE should not have ImageGen');
  runner.assertTrue(PLAN_LIMITS.PREMIUM.canUseImageGen, 'PREMIUM should have ImageGen');
  runner.assertTrue(PLAN_LIMITS.PRO.canUseImageGen, 'PRO should have ImageGen');
});

runner.test('Campaign creation should be disabled for FREE and enabled for paid plans', () => {
  runner.assertFalse(PLAN_LIMITS.FREE.canCreateCampaigns, 'FREE should not create campaigns');
  runner.assertTrue(PLAN_LIMITS.PREMIUM.canCreateCampaigns, 'PREMIUM should create campaigns');
  runner.assertTrue(PLAN_LIMITS.PRO.canCreateCampaigns, 'PRO should create campaigns');
});

const success = runner.summary();
process.exit(success ? 0 : 1);
