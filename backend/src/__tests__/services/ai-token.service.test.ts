/**
 * Unit Tests for AI Token Service
 *
 * Run with: npx ts-node src/__tests__/services/ai-token.service.test.ts
 *
 * Tests the AI token tracking system including usage logging, cost calculation,
 * Livra billing integration, and usage summaries.
 */

import prisma from '../../lib/prisma';
import { aiTokenService } from '../../services/ai-token.service';
import { livraService } from '../../services/livra.service';
import { AIOperationType, AIProviderName } from '@prisma/client';

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

    assertGreaterThan(actual: number, expected: number, message?: string) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
        }
    }

    assertGreaterOrEqual(actual: number, expected: number, message?: string) {
        if (actual < expected) {
            throw new Error(message || `Expected ${actual} to be >= ${expected}`);
        }
    }

    async run() {
        console.log('\n📋 AI Token Service Tests\n');

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

        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
        return this.failed === 0;
    }
}

// Test data
let testUser: any = null;

async function setup() {
    console.log('🔧 Setting up test data...');

    // Create test user
    testUser = await prisma.user.create({
        data: {
            email: `ai-token-test-${Date.now()}@test.com`,
            password: 'hashedpassword',
            name: 'AI Token Test User',
        },
    });

    // Initialize Livra balance with some credits
    await livraService.addLivras(testUser.id, {
        type: 'ADMIN_ADJUSTMENT',
        amount: 1000,
        metadata: { reason: 'Test setup' },
    });

    console.log(`   Created test user: ${testUser.id}`);
}

async function cleanup() {
    console.log('🧹 Cleaning up test data...');

    if (testUser) {
        // Delete AI usage logs
        await prisma.aIUsageLog.deleteMany({
            where: { userId: testUser.id },
        });

        // Delete Livra transactions
        await prisma.livraTransaction.deleteMany({
            where: { userId: testUser.id },
        });

        // Delete Livra balance
        await prisma.livraBalance.deleteMany({
            where: { userId: testUser.id },
        });

        // Delete user
        await prisma.user.delete({
            where: { id: testUser.id },
        });
    }

    await prisma.$disconnect();
}

// ========== Tests ==========

const runner = new TestRunner();

// Test: Track usage creates log entry
runner.addTest('trackUsage creates log entry', async () => {
    const result = await aiTokenService.trackUsage({
        userId: testUser.id,
        operation: 'TTS_GENERATE',
        provider: 'ELEVENLABS',
        inputChars: 500,
        outputBytes: 50000,
        durationMs: 2500,
        success: true,
        metadata: { voiceId: 'test-voice' },
    });

    runner.assertNotNull(result.usageLogId, 'Should return usageLogId');
    runner.assertGreaterOrEqual(result.livrasCost, 0, 'Should return livrasCost');

    // Verify log entry exists
    const log = await prisma.aIUsageLog.findUnique({
        where: { id: result.usageLogId },
    });

    runner.assertNotNull(log, 'Log entry should exist');
    runner.assertEqual(log?.operation, 'TTS_GENERATE', 'Operation should match');
    runner.assertEqual(log?.provider, 'ELEVENLABS', 'Provider should match');
    runner.assertEqual(log?.inputChars, 500, 'Input chars should match');
    runner.assertEqual(log?.outputBytes, 50000, 'Output bytes should match');
    runner.assertTrue(log?.success === true, 'Success should be true');
});

// Test: Track failed usage
runner.addTest('trackUsage logs failed operations', async () => {
    const result = await aiTokenService.trackUsage({
        userId: testUser.id,
        operation: 'TTS_GENERATE',
        provider: 'GEMINI',
        inputChars: 100,
        durationMs: 500,
        success: false,
        errorMessage: 'API rate limit exceeded',
    });

    const log = await prisma.aIUsageLog.findUnique({
        where: { id: result.usageLogId },
    });

    runner.assertFalse(log?.success === true, 'Success should be false');
    runner.assertEqual(log?.errorMessage, 'API rate limit exceeded', 'Error message should match');
    runner.assertEqual(result.livrasCost, 0, 'Failed operations should not cost Livras');
});

// Test: canExecute with sufficient balance
runner.addTest('canExecute returns true with sufficient balance', async () => {
    const result = await aiTokenService.canExecute(testUser.id, 'TTS_GENERATE');

    runner.assertTrue(result.allowed, 'Should be allowed with sufficient balance');
    runner.assertEqual(result.reason, undefined, 'Should not have a reason when allowed');
});

// Test: canExecute with insufficient balance
runner.addTest('canExecute returns false with insufficient balance', async () => {
    // Create a user with no balance
    const poorUser = await prisma.user.create({
        data: {
            email: `ai-token-poor-${Date.now()}@test.com`,
            password: 'hashedpassword',
            name: 'Poor Test User',
        },
    });

    try {
        const result = await aiTokenService.canExecute(poorUser.id, 'TTS_GENERATE');

        runner.assertFalse(result.allowed, 'Should not be allowed without balance');
        runner.assertNotNull(result.reason, 'Should have a reason when not allowed');
    } finally {
        await prisma.user.delete({ where: { id: poorUser.id } });
    }
});

// Test: getUsageSummary
runner.addTest('getUsageSummary returns correct totals', async () => {
    // Create some usage logs
    await aiTokenService.trackUsage({
        userId: testUser.id,
        operation: 'TEXT_SPELLCHECK',
        provider: 'GEMINI',
        inputChars: 200,
        durationMs: 100,
        success: true,
    });

    await aiTokenService.trackUsage({
        userId: testUser.id,
        operation: 'IMAGE_GENERATE',
        provider: 'GEMINI',
        inputChars: 50,
        outputBytes: 100000,
        durationMs: 3000,
        success: true,
    });

    const summary = await aiTokenService.getUsageSummary(testUser.id, 'day');

    runner.assertGreaterThan(summary.totalOperations, 0, 'Should have operations');
    runner.assertNotNull(summary.byOperation, 'Should have byOperation breakdown');
    runner.assertNotNull(summary.byProvider, 'Should have byProvider breakdown');
});

// Test: getLivraCost returns valid cost
runner.addTest('getLivraCost returns valid cost for TTS', async () => {
    const cost = await aiTokenService.getLivraCost('TTS_GENERATE');

    runner.assertGreaterOrEqual(cost, 0, 'Cost should be non-negative');
});

// Test: getAllCosts returns all operations
runner.addTest('getAllCosts returns costs for all operations', async () => {
    const costs = await aiTokenService.getAllCosts();

    runner.assertNotNull(costs, 'Should return costs object');
    runner.assertNotNull(costs['TTS_GENERATE'], 'Should have TTS_GENERATE cost');
    runner.assertNotNull(costs['IMAGE_GENERATE'], 'Should have IMAGE_GENERATE cost');
    runner.assertNotNull(costs['TEXT_SPELLCHECK'], 'Should have TEXT_SPELLCHECK cost');
});

// Test: Track usage with resource info
runner.addTest('trackUsage stores resource type and id', async () => {
    const result = await aiTokenService.trackUsage({
        userId: testUser.id,
        operation: 'NARRATION_CHAPTER',
        provider: 'ELEVENLABS',
        resourceType: 'Chapter',
        resourceId: 'chapter-123',
        inputChars: 5000,
        outputBytes: 500000,
        durationMs: 30000,
        success: true,
    });

    const log = await prisma.aIUsageLog.findUnique({
        where: { id: result.usageLogId },
    });

    runner.assertEqual(log?.resourceType, 'Chapter', 'Resource type should match');
    runner.assertEqual(log?.resourceId, 'chapter-123', 'Resource id should match');
});

// Test: Estimated cost calculation
runner.addTest('trackUsage calculates estimated cost', async () => {
    const result = await aiTokenService.trackUsage({
        userId: testUser.id,
        operation: 'TTS_GENERATE',
        provider: 'ELEVENLABS',
        inputChars: 1000, // 1000 chars
        outputBytes: 100000,
        durationMs: 5000,
        success: true,
    });

    const log = await prisma.aIUsageLog.findUnique({
        where: { id: result.usageLogId },
    });

    // ElevenLabs TTS cost is ~$0.30 per 1000 chars
    runner.assertGreaterThan(log?.estimatedCost || 0, 0, 'Should calculate estimated cost');
});

// Test: Usage summary by period
runner.addTest('getUsageSummary filters by period correctly', async () => {
    const daySummary = await aiTokenService.getUsageSummary(testUser.id, 'day');
    const weekSummary = await aiTokenService.getUsageSummary(testUser.id, 'week');
    const monthSummary = await aiTokenService.getUsageSummary(testUser.id, 'month');

    // Month should have >= week, week should have >= day
    runner.assertTrue(
        monthSummary.totalOperations >= weekSummary.totalOperations,
        'Month should have >= week operations'
    );
    runner.assertTrue(
        weekSummary.totalOperations >= daySummary.totalOperations,
        'Week should have >= day operations'
    );
});

// ========== Run Tests ==========

async function main() {
    try {
        await setup();
        const success = await runner.run();
        await cleanup();
        process.exit(success ? 0 : 1);
    } catch (error: any) {
        console.error('❌ Test setup/cleanup failed:', error.message);
        await cleanup();
        process.exit(1);
    }
}

main();
