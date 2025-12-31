/**
 * Unit Tests for Role Middleware
 * 
 * Run with: npx ts-node src/__tests__/middleware/role.middleware.test.ts
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// Import the middleware functions
import { requireRole, requireMinimumRole } from '../../middleware/role.middleware';

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

  summary() {
    console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Mock function helper
const mockFn = () => {
  const fn: any = (...args: any[]) => fn.calls.push(args);
  fn.calls = [] as any[];
  fn.mockReturnValue = (val: any) => {
    const newFn: any = (...args: any[]) => {
      newFn.calls.push(args);
      return val;
    };
    newFn.calls = fn.calls;
    newFn.mockReturnValue = fn.mockReturnValue;
    return newFn;
  };
  return fn;
};

console.log('\n📋 Role Middleware Tests\n');

const runner = new TestRunner();

// Test 1: requireRole should pass for allowed role
runner.test('requireRole should call next() for allowed role', () => {
  const middleware = requireRole('ADMIN');
  const req = { user: { userId: '123', role: 'ADMIN' } } as any;
  const res = {
    status: mockFn().mockReturnValue({ json: mockFn() }),
    json: mockFn()
  } as any;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  middleware(req, res, next);

  runner.assertTrue(nextCalled, 'next() should be called');
});

// Test 2: requireRole should fail for disallowed role
runner.test('requireRole should return 403 for disallowed role', () => {
  const middleware = requireRole('ADMIN');
  const req = { user: { userId: '123', role: 'USER' } } as any;
  let statusCode: number | undefined;
  const res = {
    status: (code: number) => {
      statusCode = code;
      return { json: () => {} };
    }
  } as any;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  middleware(req, res, next);

  runner.assertEqual(statusCode, 403, 'Should return 403');
  runner.assertTrue(!nextCalled, 'next() should NOT be called');
});

// Test 3: requireRole should fail if no user
runner.test('requireRole should return 401 if no user', () => {
  const middleware = requireRole('ADMIN');
  const req = {} as any;
  let statusCode: number | undefined;
  const res = {
    status: (code: number) => {
      statusCode = code;
      return { json: () => {} };
    }
  } as any;
  const next = () => {};

  middleware(req, res, next);

  runner.assertEqual(statusCode, 401, 'Should return 401');
});

// Test 4: requireRole should allow multiple roles
runner.test('requireRole should pass for any of multiple allowed roles', () => {
  const middleware = requireRole('WRITER', 'PRO', 'ADMIN');
  const req = { user: { userId: '123', role: 'WRITER' } } as any;
  const res = {} as any;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  middleware(req, res, next);

  runner.assertTrue(nextCalled, 'next() should be called for WRITER');
});

// Test 5: requireMinimumRole should pass for higher role
runner.test('requireMinimumRole should pass for higher role in hierarchy', () => {
  const middleware = requireMinimumRole('WRITER');
  const req = { user: { userId: '123', role: 'ADMIN' } } as any;
  const res = {} as any;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  middleware(req, res, next);

  runner.assertTrue(nextCalled, 'ADMIN should pass WRITER minimum check');
});

// Test 6: requireMinimumRole should fail for lower role
runner.test('requireMinimumRole should fail for lower role in hierarchy', () => {
  const middleware = requireMinimumRole('WRITER');
  const req = { user: { userId: '123', role: 'USER' } } as any;
  let statusCode: number | undefined;
  const res = {
    status: (code: number) => {
      statusCode = code;
      return { json: () => {} };
    }
  } as any;
  const next = () => {};

  middleware(req, res, next);

  runner.assertEqual(statusCode, 403, 'USER should fail WRITER minimum check');
});

const success = runner.summary();
process.exit(success ? 0 : 1);
