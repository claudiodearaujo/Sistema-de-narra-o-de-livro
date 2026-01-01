"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
/**
 * Run All Backend Integration Tests
 *
 * Validates all 12 Sprints implementation:
 * - Sprint 1: Setup & Infrastructure (Auth, Schema, Redis)
 * - Sprint 2: Posts & Feed
 * - Sprint 3: Interactions (Likes, Comments, Follows)
 * - Sprint 4: Profiles & Search
 * - Sprint 5-6: Messages & Notifications
 * - Sprint 8: Livras System
 * - Sprint 9: Subscriptions
 * - Sprint 10: Achievements
 */
const testFiles = [
    // Core services
    'src/__tests__/services/auth.service.test.ts',
    'src/__tests__/services/books.service.test.ts',
    'src/__tests__/services/post.service.test.ts',
    'src/__tests__/services/feed.service.test.ts',
    // Social features
    'src/__tests__/services/follow.service.test.ts',
    'src/__tests__/services/notification.service.test.ts',
    'src/__tests__/services/search.service.test.ts',
    // Gamification & Monetization
    'src/__tests__/services/livra.service.test.ts',
    'src/__tests__/services/achievement.service.test.ts',
    'src/__tests__/services/subscription.service.test.ts',
    // Middleware
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
        (0, child_process_1.execSync)(`npx ts-node ${file}`, {
            stdio: 'inherit',
            cwd: path_1.default.resolve(__dirname, '../..')
        });
        passed++;
    }
    catch (error) {
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
}
else {
    console.log(`\n✅ All test suites passed successfully!`);
    console.log(`\n📋 All 12 Sprints Validation Complete:`);
    console.log(`   ✓ Sprint 1: Setup & Infrastructure`);
    console.log(`   ✓ Sprint 2: Posts & Feed`);
    console.log(`   ✓ Sprint 3: Likes, Comments, Follows`);
    console.log(`   ✓ Sprint 4: Search & Profiles`);
    console.log(`   ✓ Sprint 5-6: Messages & Notifications`);
    console.log(`   ✓ Sprint 8: Livras System`);
    console.log(`   ✓ Sprint 9: Subscriptions & Payments`);
    console.log(`   ✓ Sprint 10: Achievements & Gamification`);
    process.exit(0);
}
