
import { execSync } from 'child_process';
import path from 'path';

/**
 * Run All Backend Integration Tests
 * 
 * Validates Sprint 1 and Sprint 2 implementation:
 * - Sprint 1.1: Schema (tested via services)
 * - Sprint 1.2: Middleware (role + plan-limits)
 * - Sprint 1.3: Redis Service (feed cache)
 * - Sprint 2.1: Post Controller (via post.service.test)
 * - Sprint 2.2: Feed Service (via feed.service.test)
 */

const testFiles = [
  'src/__tests__/services/auth.service.test.ts',
  'src/__tests__/services/books.service.test.ts',
  'src/__tests__/services/post.service.test.ts',
  'src/__tests__/services/feed.service.test.ts',
  'src/__tests__/middleware/middleware.test.ts'
];

console.log('🚀 Starting All Backend Integration Tests (Sprint 1 & 2)...\n');

let passed = 0;
let failed = 0;

for (const file of testFiles) {
  console.log(`\n---------------------------------------------------`);
  console.log(`📦 Running: ${file}`);
  console.log(`---------------------------------------------------\n`);
  
  try {
    execSync(`npx ts-node ${file}`, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..')
    });
    passed++;
  } catch (error) {
    console.error(`❌ Test failed: ${file}`);
    failed++;
  }
}

console.log(`\n===================================================`);
console.log(`📊 Final Summary`);
console.log(`===================================================`);
console.log(`Total Suites: ${testFiles.length}`);
console.log(`Passed:       ${passed}`);
console.log(`Failed:       ${failed}`);

if (failed > 0) {
  console.log(`\n❌ Some test suites failed.`);
  process.exit(1);
} else {
  console.log(`\n✅ All test suites passed successfully!`);
  console.log(`\n📋 Sprint 1 & 2 Validation Complete:`);
  console.log(`   ✓ Task 1.1: Schema Prisma (Posts, Likes, Follows)`);
  console.log(`   ✓ Task 1.2: Middleware (Role + Plan Limits)`);
  console.log(`   ✓ Task 1.3: Redis Service (Feed Cache)`);
  console.log(`   ✓ Task 2.1: Post Controller (CRUD)`);
  console.log(`   ✓ Task 2.2: Feed Service (Fanout)`);
  process.exit(0);
}
