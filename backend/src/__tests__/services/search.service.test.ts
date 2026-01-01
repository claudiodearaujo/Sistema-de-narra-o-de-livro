/**
 * Unit Tests for Search Service
 * 
 * Run with: npx ts-node src/__tests__/services/search.service.test.ts
 * 
 * Tests the global search functionality with Full-Text Search.
 */

import prisma from '../../lib/prisma';
import * as searchService from '../../services/search.service';

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

  assertGreaterOrEqual(actual: number, expected: number, message?: string) {
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
let testBook: any = null;
let testPost: any = null;
const uniqueId = Date.now();

async function setup() {
  console.log('🔧 Setting up test data...');
  
  // Create test user with unique searchable name
  testUser = await prisma.user.create({
    data: {
      email: `search-test-${uniqueId}@test.com`,
      password: 'hashedpassword',
      name: `SearchTestUser${uniqueId}`,
      username: `searchtester${uniqueId}`,
      bio: 'Searchable bio for testing purposes',
    },
  });
  
  // Create test book
  testBook = await prisma.book.create({
    data: {
      title: `SearchableBook${uniqueId}`,
      description: 'A book for testing search functionality',
      author: 'Test Author',
      userId: testUser.id,
    },
  });
  
  // Create test post
  testPost = await prisma.post.create({
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
    await prisma.post.delete({ where: { id: testPost.id } }).catch(() => {});
  }
  
  if (testBook) {
    await prisma.book.delete({ where: { id: testBook.id } }).catch(() => {});
  }
  
  if (testUser) {
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
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
    runner.assertTrue(
      result.searchMethod === 'fts' || result.searchMethod === 'like',
      'searchMethod should be fts or like'
    );
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
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    await cleanup();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
