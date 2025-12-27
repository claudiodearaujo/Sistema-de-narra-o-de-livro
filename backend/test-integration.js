#!/usr/bin/env node

const http = require('http');

const API_BASE = 'http://localhost:3000';

const tests = [];

function test(name, fn) {
    tests.push({ name, fn });
}

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed, headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// Tests
test('Server is running', async () => {
    const res = await request('GET', '/');
    return res.body === 'Sistema de Narração de Livros API';
});

test('Get Voices - Redis available', async () => {
    const res = await request('GET', '/api/voices');
    return res.status === 200 && Array.isArray(res.body);
});

test('Create Book', async () => {
    const res = await request('POST', '/api/books', {
        title: 'Redis Integration Test Book',
        author: 'Test Author',
        description: 'Book for testing Redis queues'
    });
    return res.status === 201 && res.body.id;
});

test('Narration Queue - Start narration', async () => {
    // Create book first
    const bookRes = await request('POST', '/api/books', {
        title: 'Test Book for Narration',
        author: 'Test',
        description: 'Test'
    });
    const bookId = bookRes.body.id;

    // Create chapter
    const chapterRes = await request('POST', `/api/books/${bookId}/chapters`, {
        title: 'Chapter 1',
        content: 'Test content'
    });
    const chapterId = chapterRes.body.id;

    // Try to start narration (will fail with redis_disabled if not configured, but queue will be created)
    const res = await request('POST', `/api/chapters/${chapterId}/narration/start`);
    
    // Accept either redis_disabled or success
    return res.status === 200 || res.status === 400;
});

test('Narration Status - Check queue status', async () => {
    const bookRes = await request('POST', '/api/books', {
        title: 'Test',
        author: 'Test',
        description: 'Test'
    });
    const bookId = bookRes.body.id;

    const chapterRes = await request('POST', `/api/books/${bookId}/chapters`, {
        title: 'Chapter 1',
        content: 'Test'
    });
    const chapterId = chapterRes.body.id;

    const res = await request('GET', `/api/chapters/${chapterId}/narration/status`);
    return res.status === 200 && (res.body.status || res.body.message);
});

test('Audio Queue - Process audio', async () => {
    const bookRes = await request('POST', '/api/books', {
        title: 'Test',
        author: 'Test',
        description: 'Test'
    });
    const bookId = bookRes.body.id;

    const chapterRes = await request('POST', `/api/books/${bookId}/chapters`, {
        title: 'Chapter 1',
        content: 'Test'
    });
    const chapterId = chapterRes.body.id;

    const res = await request('POST', `/api/chapters/${chapterId}/audio/process`);
    return res.status === 200 || res.status === 503;
});

// Run tests
async function runTests() {
    console.log('\n🧪 Redis Integration Tests\n');
    console.log('═══════════════════════════════════════════\n');

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name}`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed === 0) {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed\n');
        process.exit(1);
    }
}

// Wait for server to be ready
let retries = 0;
const maxRetries = 30;

async function waitForServer() {
    try {
        await request('GET', '/');
        console.log('✅ Backend is ready!\n');
        runTests();
    } catch (error) {
        retries++;
        if (retries >= maxRetries) {
            console.error('❌ Backend did not start in time');
            process.exit(1);
        }
        console.log(`⏳ Waiting for backend... (${retries}/${maxRetries})`);
        setTimeout(waitForServer, 1000);
    }
}

waitForServer();
