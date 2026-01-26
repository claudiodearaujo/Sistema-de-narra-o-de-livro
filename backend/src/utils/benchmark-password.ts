
import { hashPassword, comparePassword } from './password.utils';

async function benchmark() {
  const password = 'TestPassword123!';
  const rounds = 10; // Current setting
  
  console.log('--- Starting Benchmark (Current: 10 rounds) ---');
  
  const startHash = performance.now();
  const hash = await hashPassword(password);
  const endHash = performance.now();
  console.log(`Hashing took: ${(endHash - startHash).toFixed(2)}ms`);
  
  const startCompare = performance.now();
  await comparePassword(password, hash);
  const endCompare = performance.now();
  console.log(`Comparison took: ${(endCompare - startCompare).toFixed(2)}ms`);

  console.log('--- Done ---');
}

benchmark().catch(console.error);
