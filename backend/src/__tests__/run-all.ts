
import { execSync } from 'child_process';
import path from 'path';

const testFiles = [
  'src/__tests__/services/auth.service.test.ts',
  'src/__tests__/services/books.service.test.ts',
  'src/__tests__/services/post.service.test.ts'
];

console.log('🚀 Starting All Backend Integration Tests...\n');

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
  process.exit(0);
}
