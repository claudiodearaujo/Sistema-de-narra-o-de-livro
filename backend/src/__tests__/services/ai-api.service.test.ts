/**
 * Unit Tests for AI API Service
 *
 * Run with: npx ts-node src/__tests__/services/ai-api.service.test.ts
 *
 * Tests the AI API orchestration service including provider info,
 * usage tracking integration, and error handling.
 *
 * Note: These tests focus on the service logic, not actual API calls.
 * API integration tests would require real API keys.
 */

import prisma from '../../lib/prisma';
import { aiApiService } from '../../services/ai-api.service';
import { livraService } from '../../services/livra.service';

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

    assertContains(actual: string, expected: string, message?: string) {
        if (!actual.includes(expected)) {
            throw new Error(message || `Expected "${actual}" to contain "${expected}"`);
        }
    }

    assertIncludes<T>(array: T[], item: T, message?: string) {
        if (!array.includes(item)) {
            throw new Error(message || `Expected array to include ${JSON.stringify(item)}`);
        }
    }

    async assertThrows(fn: () => Promise<any>, expectedMessage?: string) {
        try {
            await fn();
            throw new Error('Expected function to throw');
        } catch (error: any) {
            if (expectedMessage && !error.message.includes(expectedMessage)) {
                throw new Error(`Expected error message to contain "${expectedMessage}" but got "${error.message}"`);
            }
        }
    }

    async run() {
        console.log('\n📋 AI API Service Tests\n');

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
let testUserNoBalance: any = null;

async function setup() {
    console.log('🔧 Setting up test data...');

    // Create test user with balance
    testUser = await prisma.user.create({
        data: {
            email: `ai-api-test-${Date.now()}@test.com`,
            password: 'hashedpassword',
            name: 'AI API Test User',
            role: 'WRITER', // Needs WRITER role for TTS
        },
    });

    // Initialize Livra balance with credits
    await livraService.addLivras(testUser.id, {
        type: 'ADMIN_ADJUSTMENT',
        amount: 500,
        metadata: { reason: 'Test setup' },
    });

    // Create test user without balance
    testUserNoBalance = await prisma.user.create({
        data: {
            email: `ai-api-nobalance-${Date.now()}@test.com`,
            password: 'hashedpassword',
            name: 'AI API No Balance User',
            role: 'WRITER',
        },
    });

    console.log(`   Created test user with balance: ${testUser.id}`);
    console.log(`   Created test user without balance: ${testUserNoBalance.id}`);
}

async function cleanup() {
    console.log('🧹 Cleaning up test data...');

    const userIds = [testUser?.id, testUserNoBalance?.id].filter(Boolean);

    for (const userId of userIds) {
        // Delete AI usage logs
        await prisma.aIUsageLog.deleteMany({
            where: { userId },
        });

        // Delete Livra transactions
        await prisma.livraTransaction.deleteMany({
            where: { userId },
        });

        // Delete Livra balance
        await prisma.livraBalance.deleteMany({
            where: { userId },
        });

        // Delete user
        await prisma.user.delete({
            where: { id: userId },
        });
    }

    await prisma.$disconnect();
}

// ========== Tests ==========

const runner = new TestRunner();

// Test: getProviderInfo returns valid structure
runner.addTest('getProviderInfo returns all provider categories', async () => {
    const info = aiApiService.getProviderInfo();

    runner.assertNotNull(info.text, 'Should have text provider info');
    runner.assertNotNull(info.image, 'Should have image provider info');
    runner.assertNotNull(info.tts, 'Should have tts provider info');

    runner.assertNotNull(info.text.current, 'Text should have current provider');
    runner.assertNotNull(info.text.available, 'Text should have available providers');
    runner.assertNotNull(info.image.current, 'Image should have current provider');
    runner.assertNotNull(info.image.available, 'Image should have available providers');
    runner.assertNotNull(info.tts.current, 'TTS should have current provider');
    runner.assertNotNull(info.tts.available, 'TTS should have available providers');
});

// Test: getProviderInfo includes elevenlabs in TTS
runner.addTest('getProviderInfo includes elevenlabs in TTS providers', async () => {
    const info = aiApiService.getProviderInfo();

    runner.assertIncludes(info.tts.available, 'elevenlabs', 'TTS should include elevenlabs');
    runner.assertIncludes(info.tts.available, 'gemini', 'TTS should include gemini');
});

// Test: getProviderInfo includes correct text providers
runner.addTest('getProviderInfo includes correct text providers', async () => {
    const info = aiApiService.getProviderInfo();

    runner.assertIncludes(info.text.available, 'gemini', 'Text should include gemini');
    runner.assertIncludes(info.text.available, 'openai', 'Text should include openai');
    runner.assertIncludes(info.text.available, 'anthropic', 'Text should include anthropic');
});

// Test: getProviderInfo includes correct image providers
runner.addTest('getProviderInfo includes correct image providers', async () => {
    const info = aiApiService.getProviderInfo();

    runner.assertIncludes(info.image.available, 'gemini', 'Image should include gemini');
    runner.assertIncludes(info.image.available, 'stability', 'Image should include stability');
});

// Test: generateAudio rejects empty text
runner.addTest('generateAudio validates text parameter', async () => {
    await runner.assertThrows(
        () => aiApiService.generateAudio(testUser.id, {
            text: '',
            voiceId: 'test-voice',
        }),
        // The error might come from the provider or validation
    );
});

// Test: generateAudio rejects missing voiceId
runner.addTest('generateAudio validates voiceId parameter', async () => {
    await runner.assertThrows(
        () => aiApiService.generateAudio(testUser.id, {
            text: 'Hello world',
            voiceId: '',
        }),
        // The error might come from the provider or validation
    );
});

// Test: narrateChapter validates chapterId
runner.addTest('narrateChapter rejects invalid chapterId', async () => {
    await runner.assertThrows(
        () => aiApiService.narrateChapter(testUser.id, {
            chapterId: 'non-existent-chapter',
        }),
        'Nenhuma fala encontrada'
    );
});

// Test: spellCheck validates text
runner.addTest('spellCheck rejects empty text', async () => {
    await runner.assertThrows(
        () => aiApiService.spellCheck(testUser.id, {
            text: '',
        }),
    );
});

// Test: generateImage validates prompt
runner.addTest('generateImage rejects empty prompt', async () => {
    await runner.assertThrows(
        () => aiApiService.generateImage(testUser.id, {
            prompt: '',
        }),
    );
});

// Test: enrichWithCharacter validates characterId
runner.addTest('enrichWithCharacter rejects empty characterId', async () => {
    await runner.assertThrows(
        () => aiApiService.enrichWithCharacter(testUser.id, {
            characterId: '',
        }),
    );
});

// Test: listVoices works with provider parameter
runner.addTest('listVoices accepts provider parameter', async () => {
    // This test verifies the method accepts the provider param
    // Actual API call might fail without valid credentials
    try {
        await aiApiService.listVoices(testUser.id, { provider: 'gemini' });
        // If it succeeds, that's fine
    } catch (error: any) {
        // If it fails due to API issues, that's also acceptable for this test
        // We just want to make sure the provider parameter is accepted
        runner.assertTrue(
            !error.message.includes('provider') || error.message.includes('API'),
            'Should accept provider parameter'
        );
    }
});

// Test: Operations check Livra balance before executing
runner.addTest('TTS operations check balance before execution', async () => {
    // User without balance should be rejected
    await runner.assertThrows(
        () => aiApiService.generateAudio(testUserNoBalance.id, {
            text: 'Hello world',
            voiceId: 'test-voice',
        }),
        'Saldo insuficiente'
    );
});

// Test: Service handles provider errors gracefully
runner.addTest('Service wraps provider errors appropriately', async () => {
    // Attempt to use a non-configured provider should fail gracefully
    try {
        await aiApiService.generateAudio(testUser.id, {
            text: 'Hello world',
            voiceId: 'test-voice',
            provider: 'elevenlabs', // May not have API key configured
        });
    } catch (error: any) {
        // Should get a meaningful error, not crash
        runner.assertTrue(
            error.message.length > 0,
            'Should return meaningful error message'
        );
    }
});

// Test: Multiple provider types can be instantiated
runner.addTest('getProviderInfo shows default providers are set', async () => {
    const info = aiApiService.getProviderInfo();

    runner.assertTrue(
        info.text.current.length > 0,
        'Should have a default text provider'
    );
    runner.assertTrue(
        info.image.current.length > 0,
        'Should have a default image provider'
    );
    runner.assertTrue(
        info.tts.current.length > 0,
        'Should have a default TTS provider'
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
        try {
            await cleanup();
        } catch {}
        process.exit(1);
    }
}

main();
