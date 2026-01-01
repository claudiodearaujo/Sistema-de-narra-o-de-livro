/**
 * Unit Tests for Livra Service
 * 
 * Run with: npx ts-node src/__tests__/services/livra.service.test.ts
 * 
 * Tests the Livra (virtual currency) system including balance, transactions, and spending.
 */

import prisma from '../../lib/prisma';
import { livraService } from '../../services/livra.service';
import { LivraTransactionType } from '@prisma/client';

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
    console.log('\n📋 Livra Service Tests\n');

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
let testUser2: any = null;

async function setup() {
  console.log('🔧 Setting up test data...');
  
  // Create test user
  testUser = await prisma.user.create({
    data: {
      email: `livra-test-${Date.now()}@test.com`,
      password: 'hashedpassword',
      name: 'Livra Test User',
    },
  });
  
  testUser2 = await prisma.user.create({
    data: {
      email: `livra-test2-${Date.now()}@test.com`,
      password: 'hashedpassword',
      name: 'Livra Test User 2',
    },
  });
  
  console.log('✅ Test users created');
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  const userIds = [testUser?.id, testUser2?.id].filter(Boolean);
  
  if (userIds.length > 0) {
    // Delete transactions first
    await prisma.livraTransaction.deleteMany({
      where: { userId: { in: userIds } },
    });
    
    // Delete balance
    await prisma.livraBalance.deleteMany({
      where: { userId: { in: userIds } },
    });
    
    // Delete users
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }
  
  console.log('✅ Cleanup complete');
}

async function runTests() {
  const runner = new TestRunner();

  // Test 1: Get balance for new user (should be 0)
  runner.addTest('getBalance returns 0 for new user', async () => {
    const balance = await livraService.getBalance(testUser.id);
    
    runner.assertNotNull(balance, 'Balance should not be null');
    runner.assertEqual(balance.balance, 0, 'Initial balance should be 0');
    runner.assertEqual(balance.lifetime, 0, 'Lifetime should be 0');
    runner.assertEqual(balance.spent, 0, 'Spent should be 0');
  });

  // Test 2: Add Livras (using correct enum)
  runner.addTest('addLivras increases balance', async () => {
    const result = await livraService.addLivras(testUser.id, {
      type: LivraTransactionType.EARNED_LIKE,
      amount: 10,
      metadata: { test: true },
    });
    
    runner.assertNotNull(result, 'Transaction should be created');
    runner.assertEqual(result.amount, 10, 'Amount should be 10');
    runner.assertEqual(result.balance, 10, 'New balance should be 10');
    
    // Verify balance
    const balance = await livraService.getBalance(testUser.id);
    runner.assertEqual(balance.balance, 10, 'Balance should reflect added Livras');
  });

  // Test 3: Add more Livras (accumulate)
  runner.addTest('addLivras accumulates balance', async () => {
    await livraService.addLivras(testUser.id, {
      type: LivraTransactionType.EARNED_FOLLOW,
      amount: 5,
    });
    
    const balance = await livraService.getBalance(testUser.id);
    runner.assertEqual(balance.balance, 15, 'Balance should accumulate');
    runner.assertEqual(balance.lifetime, 15, 'Lifetime should accumulate');
  });

  // Test 4: Check sufficient balance
  runner.addTest('hasSufficientBalance returns correct result', async () => {
    const hasEnough = await livraService.hasSufficientBalance(testUser.id, 10);
    runner.assertTrue(hasEnough, 'Should have sufficient balance for 10');
    
    const notEnough = await livraService.hasSufficientBalance(testUser.id, 100);
    runner.assertFalse(notEnough, 'Should not have sufficient balance for 100');
  });

  // Test 5: Spend Livras
  runner.addTest('spendLivras decreases balance', async () => {
    const result = await livraService.spendLivras(testUser.id, {
      type: LivraTransactionType.SPENT_TTS,
      amount: 5,
      metadata: { action: 'test' },
    });
    
    runner.assertNotNull(result, 'Transaction should be created');
    runner.assertEqual(result.amount, -5, 'Spent amount should be negative');
    
    const balance = await livraService.getBalance(testUser.id);
    runner.assertEqual(balance.balance, 10, 'Balance should be reduced');
    runner.assertEqual(balance.spent, 5, 'Spent should be tracked');
  });

  // Test 6: Spend more than balance should fail
  runner.addTest('spendLivras fails with insufficient balance', async () => {
    let errorThrown = false;
    
    try {
      await livraService.spendLivras(testUser.id, {
        type: LivraTransactionType.SPENT_TTS,
        amount: 1000,
      });
    } catch (error: any) {
      errorThrown = true;
      runner.assertTrue(
        error.message.includes('Insufficient') || error.message.includes('saldo') || error.message.includes('insuficiente'),
        'Should throw insufficient balance error'
      );
    }
    
    runner.assertTrue(errorThrown, 'Should throw error for insufficient balance');
  });

  // Test 7: Get transaction history
  runner.addTest('getTransactionHistory returns transactions', async () => {
    const history = await livraService.getTransactionHistory(testUser.id, 1, 10);
    
    runner.assertNotNull(history, 'History should not be null');
    runner.assertGreaterOrEqual(history.transactions.length, 3, 'Should have at least 3 transactions');
    runner.assertGreaterOrEqual(history.total, 3, 'Total should be at least 3');
  });

  // Test 8: Filter transactions by type
  runner.addTest('getTransactionHistory filters by type', async () => {
    const history = await livraService.getTransactionHistory(
      testUser.id, 
      1, 
      10, 
      { type: LivraTransactionType.EARNED_LIKE }
    );
    
    runner.assertNotNull(history, 'History should not be null');
    runner.assertGreaterOrEqual(history.transactions.length, 1, 'Should have EARNED_LIKE transaction');
    
    // All transactions should be of the filtered type
    for (const tx of history.transactions) {
      runner.assertEqual(tx.type, LivraTransactionType.EARNED_LIKE, 'Type should match filter');
    }
  });

  // Test 9: Get config value
  runner.addTest('getConfigValue returns default values', async () => {
    const likeReward = await livraService.getConfigValue('LIKE_RECEIVED');
    runner.assertGreaterThan(likeReward, 0, 'LIKE_RECEIVED should be positive');
    
    const ttsCost = await livraService.getConfigValue('TTS_COST');
    runner.assertGreaterThan(ttsCost, 0, 'TTS_COST should be positive');
  });

  // Test 10: Award for action (like received) - with all required params
  runner.addTest('awardForLikeReceived adds correct amount', async () => {
    const balanceBefore = await livraService.getBalance(testUser.id);
    
    await livraService.awardForLikeReceived(testUser.id, 'test-post-id', testUser2.id);
    
    const balanceAfter = await livraService.getBalance(testUser.id);
    runner.assertGreaterThan(balanceAfter.balance, balanceBefore.balance, 'Balance should increase');
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
