"use strict";
/**
 * Unit Tests for Role Middleware
 *
 * Run with: npx ts-node src/__tests__/middleware/role.middleware.test.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Import the middleware functions
const role_middleware_1 = require("../../middleware/role.middleware");
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
    summary() {
        console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}
// Mock function helper
const mockFn = () => {
    const fn = (...args) => fn.calls.push(args);
    fn.calls = [];
    fn.mockReturnValue = (val) => {
        const newFn = (...args) => {
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
    const middleware = (0, role_middleware_1.requireRole)('ADMIN');
    const req = { user: { userId: '123', role: 'ADMIN' } };
    const res = {
        status: mockFn().mockReturnValue({ json: mockFn() }),
        json: mockFn()
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    middleware(req, res, next);
    runner.assertTrue(nextCalled, 'next() should be called');
});
// Test 2: requireRole should fail for disallowed role
runner.test('requireRole should return 403 for disallowed role', () => {
    const middleware = (0, role_middleware_1.requireRole)('ADMIN');
    const req = { user: { userId: '123', role: 'USER' } };
    let statusCode;
    const res = {
        status: (code) => {
            statusCode = code;
            return { json: () => { } };
        }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    middleware(req, res, next);
    runner.assertEqual(statusCode, 403, 'Should return 403');
    runner.assertTrue(!nextCalled, 'next() should NOT be called');
});
// Test 3: requireRole should fail if no user
runner.test('requireRole should return 401 if no user', () => {
    const middleware = (0, role_middleware_1.requireRole)('ADMIN');
    const req = {};
    let statusCode;
    const res = {
        status: (code) => {
            statusCode = code;
            return { json: () => { } };
        }
    };
    const next = () => { };
    middleware(req, res, next);
    runner.assertEqual(statusCode, 401, 'Should return 401');
});
// Test 4: requireRole should allow multiple roles
runner.test('requireRole should pass for any of multiple allowed roles', () => {
    const middleware = (0, role_middleware_1.requireRole)('WRITER', 'PRO', 'ADMIN');
    const req = { user: { userId: '123', role: 'WRITER' } };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    middleware(req, res, next);
    runner.assertTrue(nextCalled, 'next() should be called for WRITER');
});
// Test 5: requireMinimumRole should pass for higher role
runner.test('requireMinimumRole should pass for higher role in hierarchy', () => {
    const middleware = (0, role_middleware_1.requireMinimumRole)('WRITER');
    const req = { user: { userId: '123', role: 'ADMIN' } };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    middleware(req, res, next);
    runner.assertTrue(nextCalled, 'ADMIN should pass WRITER minimum check');
});
// Test 6: requireMinimumRole should fail for lower role
runner.test('requireMinimumRole should fail for lower role in hierarchy', () => {
    const middleware = (0, role_middleware_1.requireMinimumRole)('WRITER');
    const req = { user: { userId: '123', role: 'USER' } };
    let statusCode;
    const res = {
        status: (code) => {
            statusCode = code;
            return { json: () => { } };
        }
    };
    const next = () => { };
    middleware(req, res, next);
    runner.assertEqual(statusCode, 403, 'USER should fail WRITER minimum check');
});
const success = runner.summary();
process.exit(success ? 0 : 1);
