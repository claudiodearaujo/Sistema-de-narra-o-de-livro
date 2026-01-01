"use strict";
/**
 * Unit Tests for Search Service
 *
 * Run with: npx ts-node src/__tests__/services/search.service.test.ts
 *
 * Tests the global search functionality with Full-Text Search.
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
const searchService = __importStar(require("../../services/search.service"));
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
    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || `Expected non-null value`);
        }
    }
    assertGreaterOrEqual(actual, expected, message) {
        if (actual < expected) {
            throw new Error(message || `Expected ${actual} to be >= ${expected}`);
        }
    }
    async run() {
        console.log('\n📋 Search Service Tests\n');
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
        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
        return this.failed === 0;
    }
}
// Test data
let testUser = null;
let testBook = null;
let testPost = null;
const uniqueId = Date.now();
async function setup() {
    console.log('🔧 Setting up test data...');
    // Create test user with unique searchable name
    testUser = await prisma_1.default.user.create({
        data: {
            email: `search-test-${uniqueId}@test.com`,
            password: 'hashedpassword',
            name: `SearchTestUser${uniqueId}`,
            username: `searchtester${uniqueId}`,
            bio: 'Searchable bio for testing purposes',
        },
    });
    // Create test book
    testBook = await prisma_1.default.book.create({
        data: {
            title: `SearchableBook${uniqueId}`,
            description: 'A book for testing search functionality',
            author: 'Test Author',
            userId: testUser.id,
        },
    });
    // Create test post
    testPost = await prisma_1.default.post.create({
        data: {
            userId: testUser.id,
            content: `SearchablePost${uniqueId} - This is a test post for search`,
            type: 'TEXT',
        },
    });
    console.log('✅ Test data created');
}
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    if (testPost) {
        await prisma_1.default.post.delete({ where: { id: testPost.id } }).catch(() => { });
    }
    if (testBook) {
        await prisma_1.default.book.delete({ where: { id: testBook.id } }).catch(() => { });
    }
    if (testUser) {
        await prisma_1.default.user.delete({ where: { id: testUser.id } }).catch(() => { });
    }
    console.log('✅ Cleanup complete');
}
async function runTests() {
    const runner = new TestRunner();
    // Test 1: Search returns structure
    runner.addTest('search returns correct structure', async () => {
        const result = await searchService.search('test');
        runner.assertNotNull(result, 'Result should not be null');
        runner.assertNotNull(result.results, 'Results object should exist');
        runner.assertNotNull(result.results.users, 'Users array should exist');
        runner.assertNotNull(result.results.books, 'Books array should exist');
        runner.assertNotNull(result.results.posts, 'Posts array should exist');
        runner.assertNotNull(result.totals, 'Totals should exist');
        runner.assertNotNull(result.pagination, 'Pagination should exist');
    });
    // Test 2: Search finds user by name
    runner.addTest('search finds user by name', async () => {
        const result = await searchService.search(`SearchTestUser${uniqueId}`);
        const foundUser = result.results.users.find(u => u.id === testUser.id);
        runner.assertNotNull(foundUser, 'Should find test user');
        runner.assertEqual(foundUser?.name, testUser.name, 'Name should match');
    });
    // Test 3: Search finds user by username
    runner.addTest('search finds user by username', async () => {
        const result = await searchService.search(`searchtester${uniqueId}`);
        const foundUser = result.results.users.find(u => u.id === testUser.id);
        runner.assertNotNull(foundUser, 'Should find user by username');
    });
    // Test 4: Search finds book by title
    runner.addTest('search finds book by title', async () => {
        const result = await searchService.search(`SearchableBook${uniqueId}`);
        const foundBook = result.results.books.find(b => b.id === testBook.id);
        runner.assertNotNull(foundBook, 'Should find test book');
        runner.assertEqual(foundBook?.title, testBook.title, 'Title should match');
    });
    // Test 5: Search finds post by content
    runner.addTest('search finds post by content', async () => {
        const result = await searchService.search(`SearchablePost${uniqueId}`);
        const foundPost = result.results.posts.find(p => p.id === testPost.id);
        runner.assertNotNull(foundPost, 'Should find test post');
    });
    // Test 6: Search with type filter
    runner.addTest('search respects type filter', async () => {
        const result = await searchService.search(`${uniqueId}`, { type: 'user' });
        // Should only search users
        runner.assertEqual(result.results.books.length, 0, 'Should not return books when filtering by user');
        runner.assertEqual(result.results.posts.length, 0, 'Should not return posts when filtering by user');
    });
    // Test 7: Search with pagination
    runner.addTest('search respects pagination', async () => {
        const result = await searchService.search('test', { limit: 5, page: 1 });
        runner.assertEqual(result.pagination.limit, 5, 'Limit should be respected');
        runner.assertEqual(result.pagination.page, 1, 'Page should be 1');
    });
    // Test 8: Search with short query returns empty
    runner.addTest('search with short query returns empty', async () => {
        const result = await searchService.search('a');
        runner.assertEqual(result.results.users.length, 0, 'Should return empty for short query');
        runner.assertEqual(result.results.books.length, 0, 'Should return empty for short query');
        runner.assertEqual(result.results.posts.length, 0, 'Should return empty for short query');
    });
    // Test 9: Get suggestions
    runner.addTest('getSuggestions returns suggestions', async () => {
        const suggestions = await searchService.getSuggestions(`SearchTest`);
        runner.assertNotNull(suggestions, 'Suggestions should not be null');
        runner.assertNotNull(suggestions.users, 'Users suggestions should exist');
        runner.assertNotNull(suggestions.books, 'Books suggestions should exist');
    });
    // Test 10: Get trending searches
    runner.addTest('getTrendingSearches returns array', async () => {
        const trending = await searchService.getTrendingSearches();
        runner.assertNotNull(trending, 'Trending should not be null');
        runner.assertTrue(Array.isArray(trending), 'Should be an array');
        runner.assertGreaterOrEqual(trending.length, 1, 'Should have at least 1 trending');
    });
    // Test 11: Search returns searchMethod
    runner.addTest('search returns searchMethod field', async () => {
        const result = await searchService.search('test');
        runner.assertNotNull(result.searchMethod, 'searchMethod should exist');
        runner.assertTrue(result.searchMethod === 'fts' || result.searchMethod === 'like', 'searchMethod should be fts or like');
    });
    // Test 12: Search with multiple types filter
    runner.addTest('search works with multiple type filters', async () => {
        const result = await searchService.search(`${uniqueId}`, {
            type: ['user', 'book']
        });
        // Should search users and books but not posts
        runner.assertEqual(result.results.posts.length, 0, 'Should not return posts');
    });
    return runner.run();
}
// Main execution
async function main() {
    try {
        await setup();
        const success = await runTests();
        await cleanup();
        process.exit(success ? 0 : 1);
    }
    catch (error) {
        console.error('❌ Test execution failed:', error);
        await cleanup();
        process.exit(1);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
}
main();
