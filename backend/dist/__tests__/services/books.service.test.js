"use strict";
/**
 * Integration Tests for Books Service
 *
 * Run with: npx ts-node src/__tests__/services/books.service.test.ts
 *
 * Tests book CRUD operations with database.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const books_service_1 = require("../../services/books.service");
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
    assertGreaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
        }
    }
    async run() {
        console.log('\n📋 Books Service Tests\n');
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
    let createdBookId;
    let testUserId1;
    let testUserId2;
    // Setup
    runner.addTest('Setup: Clean test data', async () => {
        // Clean up any existing test books
        await prisma_1.default.book.deleteMany({
            where: {
                title: { startsWith: 'Test Book' }
            }
        });
        // Create test users
        const user1 = await prisma_1.default.user.upsert({
            where: { email: 'testuser1@example.com' },
            update: {},
            create: {
                email: 'testuser1@example.com',
                username: 'testuser1',
                name: 'Test User 1',
                password: 'hashedpassword',
                role: 'WRITER'
            }
        });
        testUserId1 = user1.id;
        const user2 = await prisma_1.default.user.upsert({
            where: { email: 'testuser2@example.com' },
            update: {},
            create: {
                email: 'testuser2@example.com',
                username: 'testuser2',
                name: 'Test User 2',
                password: 'hashedpassword',
                role: 'WRITER'
            }
        });
        testUserId2 = user2.id;
    });
    // Test: Create book
    runner.addTest('create() should create a new book', async () => {
        const book = await books_service_1.booksService.create({
            title: 'Test Book Title',
            description: 'A test book description',
            author: 'Test Author',
            userId: testUserId1
        });
        createdBookId = book.id;
        runner.assertNotNull(book.id, 'Book should have an ID');
        runner.assertEqual(book.title, 'Test Book Title');
        runner.assertEqual(book.author, 'Test Author');
        runner.assertEqual(book.description, 'A test book description');
        runner.assertEqual(book.userId, testUserId1);
    });
    // Test: Create book with validation error (short title)
    runner.addTest('create() should fail for short title', async () => {
        try {
            await books_service_1.booksService.create({
                title: 'AB',
                author: 'Test Author'
            });
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('title') ||
                error.message.toLowerCase().includes('3'), 'Should mention title validation');
        }
    });
    // Test: Create book with validation error (missing author)
    runner.addTest('create() should fail for missing author', async () => {
        try {
            await books_service_1.booksService.create({
                title: 'Valid Title',
                author: ''
            });
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('author'), 'Should mention author is required');
        }
    });
    // Test: Get book by ID
    runner.addTest('getById() should return the book with chapters', async () => {
        const book = await books_service_1.booksService.getById(createdBookId);
        runner.assertNotNull(book, 'Book should exist');
        runner.assertEqual(book.id, createdBookId);
        runner.assertEqual(book.title, 'Test Book Title');
        runner.assertNotNull(book.chapters, 'Book should include chapters array');
        runner.assertNotNull(book.characters, 'Book should include characters array');
    });
    // Test: Get book by ID - not found
    runner.addTest('getById() should throw for non-existent book', async () => {
        try {
            await books_service_1.booksService.getById('non-existent-id');
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('not found'), 'Should mention book not found');
        }
    });
    // Test: Update book
    runner.addTest('update() should update book data when user is owner', async () => {
        const updated = await books_service_1.booksService.update(createdBookId, {
            title: 'Test Book Updated Title',
            description: 'Updated description'
        }, testUserId1);
        runner.assertEqual(updated.title, 'Test Book Updated Title');
        runner.assertEqual(updated.description, 'Updated description');
    });
    // Test: Update book - unauthorized
    runner.addTest('update() should fail when user is not owner', async () => {
        try {
            await books_service_1.booksService.update(createdBookId, {
                title: 'Unauthorized Update'
            }, testUserId2);
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('unauthorized') ||
                error.message.toLowerCase().includes('own'), 'Should mention unauthorized access');
        }
    });
    // Test: Get all books with pagination
    runner.addTest('getAll() should return paginated books for specific user', async () => {
        const result = await books_service_1.booksService.getAll(1, 10, undefined, undefined, testUserId1);
        runner.assertNotNull(result.data, 'Should return data array');
        runner.assertNotNull(result.total, 'Should return total count');
        runner.assertEqual(result.page, 1);
        runner.assertEqual(result.limit, 10);
        runner.assertNotNull(result.totalPages, 'Should return total pages');
        runner.assertGreaterThan(result.data.length, 0, 'Should find at least one book for user');
        runner.assertTrue(result.data.every((b) => b.userId === testUserId1), 'All books should belong to the user');
    });
    // Test: Get all books with title filter
    runner.addTest('getAll() should filter by title and userId', async () => {
        const result = await books_service_1.booksService.getAll(1, 10, 'Test Book Updated', undefined, testUserId1);
        runner.assertGreaterThan(result.data.length, 0, 'Should find at least one book');
        runner.assertTrue(result.data.some((b) => b.title.includes('Test Book')), 'Should find books with matching title');
        runner.assertTrue(result.data.every((b) => b.userId === testUserId1), 'All books should belong to the user');
    });
    // Test: Get all books for different user
    runner.addTest('getAll() should return empty for user with no books', async () => {
        const result = await books_service_1.booksService.getAll(1, 10, undefined, undefined, testUserId2);
        runner.assertEqual(result.data.length, 0, 'Should return empty array for user with no books');
        runner.assertEqual(result.total, 0, 'Total should be 0');
    });
    // Test: Get book stats
    runner.addTest('getStats() should return book statistics', async () => {
        const stats = await books_service_1.booksService.getStats(createdBookId);
        runner.assertNotNull(stats.totalChapters, 'Should have totalChapters');
        runner.assertNotNull(stats.totalSpeeches, 'Should have totalSpeeches');
        runner.assertNotNull(stats.totalCharacters, 'Should have totalCharacters');
        runner.assertEqual(stats.totalChapters, 0); // New book has no chapters
        runner.assertEqual(stats.totalSpeeches, 0);
        runner.assertEqual(stats.totalCharacters, 0);
    });
    // Test: Delete book - unauthorized
    runner.addTest('delete() should fail when user is not owner', async () => {
        try {
            await books_service_1.booksService.delete(createdBookId, testUserId2);
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('unauthorized') ||
                error.message.toLowerCase().includes('own'), 'Should mention unauthorized access');
        }
    });
    // Test: Delete book
    runner.addTest('delete() should remove the book when user is owner', async () => {
        const result = await books_service_1.booksService.delete(createdBookId, testUserId1);
        runner.assertNotNull(result.message, 'Should return success message');
        const deleted = await prisma_1.default.book.findUnique({
            where: { id: createdBookId }
        });
        runner.assertEqual(deleted, null, 'Book should be deleted');
    });
    // Test: Delete non-existent book
    runner.addTest('delete() should throw for non-existent book', async () => {
        try {
            await books_service_1.booksService.delete('non-existent-id', testUserId1);
            throw new Error('Should have thrown an error');
        }
        catch (error) {
            runner.assertTrue(error.message.toLowerCase().includes('not found'), 'Should mention book not found');
        }
    });
    // Cleanup
    runner.addTest('Cleanup: Remove remaining test data', async () => {
        await prisma_1.default.book.deleteMany({
            where: {
                title: { startsWith: 'Test Book' }
            }
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
