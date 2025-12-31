/**
 * Integration Tests for Middleware
 * 
 * Run with: npx ts-node src/__tests__/middleware/middleware.test.ts
 * 
 * Tests Role Middleware (Sprint 1 Task 1.2) and Plan Limits Middleware.
 */

import { Request, Response, NextFunction } from 'express';
// Import auth.middleware first to ensure Express.Request extension is loaded
import '../../middleware/auth.middleware';
import { requireRole, requireMinimumRole } from '../../middleware/role.middleware';
import { requireFeature, loadPlanInfo, PLAN_LIMITS } from '../../middleware/plan-limits.middleware';
import prisma from '../../lib/prisma';
import { UserRole, SubscriptionPlan } from '@prisma/client';

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

  async run() {
    console.log('\n📋 Middleware Tests (Sprint 1.2)\n');

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

// Mock Request/Response/Next
function createMockReq(user?: any): any {
  return { user };
}

function createMockRes(): { res: any; state: { statusCode: number; jsonData: any } } {
  const state = { statusCode: 200, jsonData: null as any };
  
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(data: any) {
      state.jsonData = data;
      return res;
    }
  };
  
  return { res, state };
}

async function runTests() {
  const runner = new TestRunner();
  
  // Test data
  let testUserId: string;

  // Setup
  runner.addTest('Setup: Create test user', async () => {
    // Clean up
    await prisma.subscription.deleteMany({
      where: { user: { email: 'test-middleware@example.com' } }
    });
    await prisma.user.deleteMany({
      where: { email: 'test-middleware@example.com' }
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'test-middleware@example.com',
        username: 'testmiddleware',
        name: 'Test Middleware User',
        password: 'hashedpassword123',
        role: 'WRITER'
      }
    });
    testUserId = user.id;

    runner.assertNotNull(testUserId);
  });

  // === ROLE MIDDLEWARE TESTS ===

  runner.addTest('requireRole() should allow matching role', async () => {
    const middleware = requireRole('WRITER');
    const req = createMockReq({ id: testUserId, role: 'WRITER' });
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    middleware(req as Request, res as Response, next);

    runner.assertTrue(nextCalled, 'next() should be called');
    runner.assertEqual(state.statusCode, 200, 'Status should remain 200');
  });

  runner.addTest('requireRole() should allow multiple roles', async () => {
    const middleware = requireRole('WRITER', 'PRO', 'ADMIN');
    const req = createMockReq({ id: testUserId, role: 'WRITER' });
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    middleware(req as Request, res as Response, next);

    runner.assertTrue(nextCalled, 'next() should be called for matching role');
  });

  runner.addTest('requireRole() should deny non-matching role', async () => {
    const middleware = requireRole('ADMIN');
    const req = createMockReq({ id: testUserId, role: 'USER' });
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    middleware(req as Request, res as Response, next);

    runner.assertFalse(nextCalled, 'next() should not be called');
    runner.assertEqual(state.statusCode, 403, 'Status should be 403');
    runner.assertEqual(state.jsonData.code, 'INSUFFICIENT_ROLE', 'Should return correct error code');
  });

  runner.addTest('requireRole() should return 401 for unauthenticated user', async () => {
    const middleware = requireRole('USER');
    const req = createMockReq(); // No user
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    middleware(req as Request, res as Response, next);

    runner.assertFalse(nextCalled, 'next() should not be called');
    runner.assertEqual(state.statusCode, 401, 'Status should be 401');
    runner.assertEqual(state.jsonData.code, 'NOT_AUTHENTICATED', 'Should return auth error code');
  });

  runner.addTest('requireMinimumRole() should allow equal or higher role', async () => {
    const middleware = requireMinimumRole('WRITER');
    const req = createMockReq({ id: testUserId, role: 'PRO' });
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    middleware(req as Request, res as Response, next);

    runner.assertTrue(nextCalled, 'next() should be called for higher role');
  });

  runner.addTest('requireMinimumRole() should deny lower role', async () => {
    const middleware = requireMinimumRole('ADMIN');
    const req = createMockReq({ id: testUserId, role: 'WRITER' });
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    middleware(req as Request, res as Response, next);

    runner.assertFalse(nextCalled, 'next() should not be called');
    runner.assertEqual(state.statusCode, 403, 'Status should be 403');
  });

  // === PLAN LIMITS TESTS ===

  runner.addTest('PLAN_LIMITS should have correct structure for FREE plan', async () => {
    const freeLimits = PLAN_LIMITS.FREE;
    
    runner.assertEqual(freeLimits.maxBooks, 0, 'FREE should have 0 maxBooks');
    runner.assertFalse(freeLimits.canUseTTS, 'FREE should not have TTS');
    runner.assertFalse(freeLimits.canUseImageGen, 'FREE should not have image gen');
    runner.assertEqual(freeLimits.monthlyLivras, 0, 'FREE should have 0 monthly Livras');
  });

  runner.addTest('PLAN_LIMITS should have correct structure for PREMIUM plan', async () => {
    const premiumLimits = PLAN_LIMITS.PREMIUM;
    
    runner.assertEqual(premiumLimits.maxBooks, 10, 'PREMIUM should have 10 maxBooks');
    runner.assertTrue(premiumLimits.canUseTTS, 'PREMIUM should have TTS');
    runner.assertTrue(premiumLimits.canUseImageGen, 'PREMIUM should have image gen');
    runner.assertEqual(premiumLimits.monthlyLivras, 100, 'PREMIUM should have 100 monthly Livras');
  });

  runner.addTest('PLAN_LIMITS should have correct structure for PRO plan', async () => {
    const proLimits = PLAN_LIMITS.PRO;
    
    runner.assertEqual(proLimits.maxBooks, -1, 'PRO should have unlimited maxBooks');
    runner.assertTrue(proLimits.canUseTTS, 'PRO should have TTS');
    runner.assertTrue(proLimits.canUseImageGen, 'PRO should have image gen');
    runner.assertEqual(proLimits.monthlyLivras, 500, 'PRO should have 500 monthly Livras');
  });

  runner.addTest('loadPlanInfo() should set FREE plan for user without subscription', async () => {
    const req = createMockReq({ userId: testUserId, role: 'USER' }) as Request;
    const { res } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    await loadPlanInfo(req, res as Response, next);

    runner.assertTrue(nextCalled, 'next() should be called');
    runner.assertNotNull(req.subscription, 'subscription should be set');
    runner.assertEqual(req.subscription?.plan, 'FREE', 'Plan should be FREE');
  });

  runner.addTest('loadPlanInfo() should set correct plan for subscribed user', async () => {
    // Create subscription for test user
    await prisma.subscription.create({
      data: {
        userId: testUserId,
        plan: SubscriptionPlan.PREMIUM,
        status: 'ACTIVE'
      }
    });

    const req = createMockReq({ userId: testUserId, role: 'USER' }) as Request;
    const { res } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    await loadPlanInfo(req, res as Response, next);

    runner.assertTrue(nextCalled, 'next() should be called');
    runner.assertEqual(req.subscription?.plan, 'PREMIUM', 'Plan should be PREMIUM');
    runner.assertTrue(req.subscription?.limits.canUseTTS === true, 'PREMIUM should have TTS');

    // Cleanup subscription
    await prisma.subscription.delete({ where: { userId: testUserId } });
  });

  runner.addTest('requireFeature() should allow feature for eligible plan', async () => {
    // Create PREMIUM subscription
    await prisma.subscription.create({
      data: {
        userId: testUserId,
        plan: SubscriptionPlan.PREMIUM,
        status: 'ACTIVE'
      }
    });

    const middleware = requireFeature('canUseTTS');
    const req = createMockReq({ userId: testUserId, role: 'USER' }) as Request;
    
    // First load plan info
    await loadPlanInfo(req, {} as Response, () => {});
    
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    await middleware(req, res as Response, next);

    runner.assertTrue(nextCalled, 'next() should be called for PREMIUM TTS');

    // Cleanup
    await prisma.subscription.delete({ where: { userId: testUserId } });
  });

  runner.addTest('requireFeature() should deny feature for ineligible plan', async () => {
    const middleware = requireFeature('canUseTTS');
    const req = createMockReq({ userId: testUserId, role: 'USER' }) as Request;
    
    // Load plan info (should be FREE since no subscription)
    await loadPlanInfo(req, {} as Response, () => {});
    
    const { res, state } = createMockRes();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    await middleware(req, res as Response, next);

    runner.assertFalse(nextCalled, 'next() should not be called for FREE TTS');
    runner.assertEqual(state.statusCode, 403, 'Status should be 403');
    runner.assertEqual(state.jsonData.code, 'FEATURE_NOT_AVAILABLE', 'Should return feature error code');
  });

  // Cleanup
  runner.addTest('Cleanup: Remove test data', async () => {
    await prisma.subscription.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.delete({
      where: { id: testUserId }
    });
    console.log('     Cleanup completed');
  });

  // Run all tests
  const success = await runner.run();
  
  // Disconnect
  await prisma.$disconnect();
  
  process.exit(success ? 0 : 1);
}

runTests().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
