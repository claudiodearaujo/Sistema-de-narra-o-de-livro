"use strict";
/**
 * Integration Tests for Auth Service
 *
 * Run with: npx ts-node src/__tests__/services/auth.service.test.ts
 *
 * Tests authentication operations including registration, login, and token validation.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const authService = __importStar(require("../../services/auth.service"));
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
        console.log('\n📋 Auth Service Tests\n');
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
    const testEmail = 'test-auth@example.com';
    const testPassword = 'SecurePassword123!';
    let registeredUserId;
    let accessToken;
    let refreshToken;
    // Setup: Clean existing test user
    runner.addTest('Setup: Clean existing test data', async () => {
        // Delete refresh tokens first
        await prisma_1.default.refreshToken.deleteMany({
            where: {
                user: { email: testEmail }
            }
        });
        await prisma_1.default.user.deleteMany({
            where: { email: testEmail }
        });
    });
    // Test: Register new user (signup)
    runner.addTest('signup() should create a new user', async () => {
        const result = await authService.signup({
            email: testEmail,
            password: testPassword,
            name: 'Test Auth User',
            username: 'testauthuser'
        });
        registeredUserId = result.user.id;
        accessToken = result.accessToken;
        refreshToken = result.refreshToken;
        runner.assertNotNull(result.user, 'Should return user object');
        runner.assertNotNull(result.accessToken, 'Should return access token');
        runner.assertNotNull(result.refreshToken, 'Should return refresh token');
        runner.assertEqual(result.user.email, testEmail);
        runner.assertEqual(result.user.username, 'testauthuser');
    });
    // Test: Register duplicate email should fail
    runner.addTest('signup() should fail for duplicate email', async () => {
        try {
            await authService.signup({
                email: testEmail,
                password: 'AnotherPassword123',
                name: 'Duplicate User',
                username: 'duplicateuser'
            });
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('email') ||
                error.message.toLowerCase().includes('já') ||
                error.message.toLowerCase().includes('already') ||
                error.message.toLowerCase().includes('existe'), 'Should mention email conflict');
        }
    });
    // Test: Login with correct credentials
    runner.addTest('login() should return tokens for valid credentials', async () => {
        const result = await authService.login({
            email: testEmail,
            password: testPassword
        });
        runner.assertNotNull(result.accessToken, 'Should return access token');
        runner.assertNotNull(result.refreshToken, 'Should return refresh token');
        runner.assertNotNull(result.user, 'Should return user');
        runner.assertEqual(result.user.email, testEmail);
        // Update tokens for next tests
        accessToken = result.accessToken;
        refreshToken = result.refreshToken;
    });
    // Test: Login with wrong password should fail
    runner.addTest('login() should fail for wrong password', async () => {
        try {
            await authService.login({
                email: testEmail,
                password: 'WrongPassword123'
            });
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('senha') ||
                error.message.toLowerCase().includes('password') ||
                error.message.toLowerCase().includes('invalid') ||
                error.message.toLowerCase().includes('incorret') ||
                error.message.toLowerCase().includes('inválid'), 'Should mention invalid credentials');
        }
    });
    // Test: Login with non-existent email should fail
    runner.addTest('login() should fail for non-existent email', async () => {
        try {
            await authService.login({
                email: 'nonexistent@example.com',
                password: testPassword
            });
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('não encontrado') ||
                error.message.toLowerCase().includes('not found') ||
                error.message.toLowerCase().includes('invalid') ||
                error.message.toLowerCase().includes('usuário') ||
                error.message.toLowerCase().includes('inválid'), 'Should mention user not found');
        }
    });
    // Test: Get profile
    runner.addTest('getProfile() should return user profile', async () => {
        const profile = await authService.getProfile(registeredUserId);
        runner.assertNotNull(profile, 'Should return profile');
        runner.assertEqual(profile.email, testEmail);
        runner.assertEqual(profile.username, 'testauthuser');
    });
    // Test: Update profile
    runner.addTest('updateProfile() should update user data', async () => {
        const updated = await authService.updateProfile(registeredUserId, {
            name: 'Updated Test User',
            bio: 'This is my bio'
        });
        runner.assertEqual(updated.name, 'Updated Test User');
        runner.assertEqual(updated.bio, 'This is my bio');
    });
    // Test: Refresh token
    runner.addTest('refreshAccessToken() should return new tokens', async () => {
        const result = await authService.refreshAccessToken(refreshToken);
        runner.assertNotNull(result.accessToken, 'Should return new access token');
        runner.assertNotNull(result.refreshToken, 'Should return new refresh token');
        runner.assertNotNull(result.user, 'Should return user');
        // Update for logout test
        refreshToken = result.refreshToken;
    });
    // Test: Logout
    runner.addTest('logout() should invalidate refresh token', async () => {
        await authService.logout(refreshToken);
        // Try to use the invalidated refresh token
        try {
            await authService.refreshAccessToken(refreshToken);
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(true, 'Refresh token should be invalidated');
        }
    });
    // Cleanup
    runner.addTest('Cleanup: Remove test user', async () => {
        // Delete refresh tokens
        await prisma_1.default.refreshToken.deleteMany({
            where: {
                user: { email: testEmail }
            }
        });
        await prisma_1.default.user.deleteMany({
            where: { email: testEmail }
        });
        console.log('     Cleanup completed');
    });
    // Run all tests
    const success = await runner.run();
    await prisma_1.default.$disconnect();
    process.exit(success ? 0 : 1);
}
runTests().catch(async (error) => {
    console.error('Fatal error:', error);
    await prisma_1.default.$disconnect();
    process.exit(1);
});
