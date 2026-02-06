/**
 * Integration Tests for AI API Routes
 *
 * Run with: npx ts-node src/__tests__/routes/ai-api.routes.test.ts
 *
 * Tests the /api/ai/* endpoints including authentication,
 * validation, and response structure.
 *
 * Note: These tests focus on route behavior without making actual AI API calls.
 */

import express from 'express';
import { createServer, Server } from 'http';
import prisma from '../../lib/prisma';
import { livraService } from '../../services/livra.service';
import jwt from 'jsonwebtoken';

// Simple HTTP client for testing
async function makeRequest(
    server: Server,
    method: string,
    path: string,
    options: {
        body?: any;
        token?: string;
        query?: Record<string, string>;
    } = {}
): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
        const address = server.address();
        if (!address || typeof address === 'string') {
            return reject(new Error('Server not started'));
        }

        const url = new URL(`http://localhost:${address.port}${path}`);
        if (options.query) {
            Object.entries(options.query).forEach(([k, v]) => url.searchParams.append(k, v));
        }

        const http = require('http');
        const reqOptions = {
            hostname: 'localhost',
            port: address.port,
            path: url.pathname + url.search,
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            },
        };

        const req = http.request(reqOptions, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : {},
                    });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

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

    assertNotNull(value: any, message?: string) {
        if (value === null || value === undefined) {
            throw new Error(message || `Expected non-null value`);
        }
    }

    async run() {
        console.log('\n📋 AI API Routes Integration Tests\n');

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
let testWriterUser: any = null;
let userToken: string = '';
let writerToken: string = '';
let app: express.Application;
let server: Server;

async function setup() {
    console.log('🔧 Setting up test server and data...');

    // Create Express app with routes
    app = express();
    app.use(express.json());

    // Import routes
    const aiApiRoutes = require('../../routes/ai-api.routes').default;
    const { authenticate, requireWriter, requireFeature } = require('../../middleware');

    // Mock middleware for testing
    app.use((req: any, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
                req.user = decoded;
            } catch {}
        }
        next();
    });

    app.use('/api/ai', aiApiRoutes);

    // Start server
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const address = server.address();
    console.log(`   Test server started on port ${typeof address === 'object' ? address?.port : 'unknown'}`);

    // Create test users
    testUser = await prisma.user.create({
        data: {
            email: `ai-routes-test-${Date.now()}@test.com`,
            password: 'hashedpassword',
            name: 'AI Routes Test User',
            role: 'USER',
        },
    });

    testWriterUser = await prisma.user.create({
        data: {
            email: `ai-routes-writer-${Date.now()}@test.com`,
            password: 'hashedpassword',
            name: 'AI Routes Writer User',
            role: 'WRITER',
        },
    });

    // Initialize Livra balance
    await livraService.addLivras(testWriterUser.id, {
        type: 'ADMIN_ADJUSTMENT',
        amount: 500,
        metadata: { reason: 'Test setup' },
    });

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'test-secret';
    userToken = jwt.sign({ userId: testUser.id, email: testUser.email, role: 'USER' }, secret, { expiresIn: '1h' });
    writerToken = jwt.sign(
        { userId: testWriterUser.id, email: testWriterUser.email, role: 'WRITER' },
        secret,
        { expiresIn: '1h' }
    );

    console.log(`   Created test user: ${testUser.id}`);
    console.log(`   Created writer user: ${testWriterUser.id}`);
}

async function cleanup() {
    console.log('🧹 Cleaning up...');

    // Close server
    if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    const userIds = [testUser?.id, testWriterUser?.id].filter(Boolean);

    for (const userId of userIds) {
        await prisma.aIUsageLog.deleteMany({ where: { userId } });
        await prisma.livraTransaction.deleteMany({ where: { userId } });
        await prisma.livraBalance.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
    }

    await prisma.$disconnect();
}

// ========== Tests ==========

const runner = new TestRunner();

// Test: GET /api/ai/providers returns provider info (public endpoint)
runner.addTest('GET /providers returns provider info', async () => {
    const res = await makeRequest(server, 'GET', '/api/ai/providers');

    runner.assertEqual(res.status, 200, 'Should return 200');
    runner.assertNotNull(res.body.text, 'Should have text provider info');
    runner.assertNotNull(res.body.image, 'Should have image provider info');
    runner.assertNotNull(res.body.tts, 'Should have tts provider info');
});

// Test: GET /api/ai/costs returns cost info (public endpoint)
runner.addTest('GET /costs returns cost info', async () => {
    const res = await makeRequest(server, 'GET', '/api/ai/costs');

    runner.assertEqual(res.status, 200, 'Should return 200');
    runner.assertNotNull(res.body.costs, 'Should have costs object');
});

// Test: GET /api/ai/usage requires authentication
runner.addTest('GET /usage requires authentication', async () => {
    const res = await makeRequest(server, 'GET', '/api/ai/usage');

    runner.assertTrue(res.status === 401 || res.status === 403, 'Should require auth');
});

// Test: GET /api/ai/usage works with valid token
runner.addTest('GET /usage works with valid token', async () => {
    const res = await makeRequest(server, 'GET', '/api/ai/usage', {
        token: userToken,
    });

    runner.assertEqual(res.status, 200, 'Should return 200');
    runner.assertNotNull(res.body.period, 'Should have period');
    runner.assertNotNull(res.body.totalOperations !== undefined, 'Should have totalOperations');
});

// Test: GET /api/ai/usage accepts period parameter
runner.addTest('GET /usage accepts period parameter', async () => {
    const res = await makeRequest(server, 'GET', '/api/ai/usage', {
        token: userToken,
        query: { period: 'week' },
    });

    runner.assertEqual(res.status, 200, 'Should return 200');
    runner.assertEqual(res.body.period, 'week', 'Should use week period');
});

// Test: GET /api/ai/tts/voices requires authentication
runner.addTest('GET /tts/voices requires authentication', async () => {
    const res = await makeRequest(server, 'GET', '/api/ai/tts/voices');

    runner.assertTrue(res.status === 401 || res.status === 403, 'Should require auth');
});

// Test: POST /api/ai/tts/generate requires writer role
runner.addTest('POST /tts/generate requires writer role', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/tts/generate', {
        token: userToken, // USER role, not WRITER
        body: { text: 'Hello', voiceId: 'test' },
    });

    runner.assertTrue(res.status === 401 || res.status === 403, 'Should require writer role');
});

// Test: POST /api/ai/tts/generate validates text
runner.addTest('POST /tts/generate validates text parameter', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/tts/generate', {
        token: writerToken,
        body: { text: '', voiceId: 'test' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty text');
    runner.assertNotNull(res.body.error, 'Should have error message');
});

// Test: POST /api/ai/tts/generate validates voiceId
runner.addTest('POST /tts/generate validates voiceId parameter', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/tts/generate', {
        token: writerToken,
        body: { text: 'Hello world', voiceId: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty voiceId');
    runner.assertNotNull(res.body.error, 'Should have error message');
});

// Test: POST /api/ai/tts/preview validates voiceId
runner.addTest('POST /tts/preview validates voiceId parameter', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/tts/preview', {
        token: writerToken,
        body: { voiceId: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty voiceId');
});

// Test: POST /api/ai/tts/narrate-chapter validates chapterId
runner.addTest('POST /tts/narrate-chapter validates chapterId', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/tts/narrate-chapter', {
        token: writerToken,
        body: { chapterId: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty chapterId');
});

// Test: POST /api/ai/text/spellcheck requires auth
runner.addTest('POST /text/spellcheck requires authentication', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/text/spellcheck', {
        body: { text: 'Hello world' },
    });

    runner.assertTrue(res.status === 401 || res.status === 403, 'Should require auth');
});

// Test: POST /api/ai/text/spellcheck validates text
runner.addTest('POST /text/spellcheck validates text parameter', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/text/spellcheck', {
        token: userToken,
        body: { text: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty text');
});

// Test: POST /api/ai/text/suggest validates text
runner.addTest('POST /text/suggest validates text parameter', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/text/suggest', {
        token: userToken,
        body: { text: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty text');
});

// Test: POST /api/ai/text/enrich requires writer role
runner.addTest('POST /text/enrich requires writer role', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/text/enrich', {
        token: userToken, // USER role
        body: { characterId: 'test' },
    });

    runner.assertTrue(res.status === 401 || res.status === 403, 'Should require writer role');
});

// Test: POST /api/ai/text/enrich validates characterId
runner.addTest('POST /text/enrich validates characterId', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/text/enrich', {
        token: writerToken,
        body: { characterId: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty characterId');
});

// Test: POST /api/ai/image/generate validates prompt
runner.addTest('POST /image/generate validates prompt', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/image/generate', {
        token: writerToken,
        body: { prompt: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty prompt');
});

// Test: POST /api/ai/image/emotion validates text
runner.addTest('POST /image/emotion validates text', async () => {
    const res = await makeRequest(server, 'POST', '/api/ai/image/emotion', {
        token: writerToken,
        body: { text: '' },
    });

    runner.assertEqual(res.status, 400, 'Should return 400 for empty text');
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
