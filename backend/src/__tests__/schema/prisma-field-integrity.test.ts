/**
 * Prisma Schema & Field Integrity Tests
 *
 * Validates that all fields used by services, controllers, and frontend
 * are correctly defined in the Prisma schema and included in migrations.
 *
 * Run with: npx ts-node src/__tests__/schema/prisma-field-integrity.test.ts
 */

import { Prisma, AuditAction, AuditCategory, AuditSeverity, UserRole } from '@prisma/client';

// ============================================================
// Test Runner (same pattern as existing project tests)
// ============================================================
class TestRunner {
  private passed = 0;
  private failed = 0;
  private suiteName: string;

  constructor(suiteName: string) {
    this.suiteName = suiteName;
    console.log(`\n📋 ${suiteName}\n`);
  }

  test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      this.passed++;
    } catch (error: any) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      this.failed++;
    }
  }

  assertEqual(actual: any, expected: any, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  }

  assertTrue(value: boolean, message?: string) {
    if (!value) {
      throw new Error(message || `Expected true but got false`);
    }
  }

  assertContains(arr: string[], item: string, message?: string) {
    if (!arr.includes(item)) {
      throw new Error(message || `Array does not contain "${item}". Available: ${arr.join(', ')}`);
    }
  }

  assertType(value: any, type: string, message?: string) {
    if (typeof value !== type) {
      throw new Error(message || `Expected type ${type} but got ${typeof value}`);
    }
  }

  summary(): boolean {
    console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// ============================================================
// Helper: Get Prisma model field names from generated types
// ============================================================

// Speech scalar fields from Prisma generated types
const speechScalarFields = Object.values(Prisma.SpeechScalarFieldEnum);
const chapterScalarFields = Object.values(Prisma.ChapterScalarFieldEnum);
const bookScalarFields = Object.values(Prisma.BookScalarFieldEnum);
const narrationScalarFields = Object.values(Prisma.NarrationScalarFieldEnum);
const characterScalarFields = Object.values(Prisma.CharacterScalarFieldEnum);
const auditLogScalarFields = Object.values(Prisma.AuditLogScalarFieldEnum);
const userScalarFields = Object.values(Prisma.UserScalarFieldEnum);

// ============================================================
// Test Suite 1: Speech Model Fields
// ============================================================
const speechSuite = new TestRunner('Speech Model Field Integrity');

// Core fields that exist since initial migration
speechSuite.test('Speech has "id" field', () => {
  speechSuite.assertContains(speechScalarFields, 'id');
});

speechSuite.test('Speech has "chapterId" field', () => {
  speechSuite.assertContains(speechScalarFields, 'chapterId');
});

speechSuite.test('Speech has "characterId" field', () => {
  speechSuite.assertContains(speechScalarFields, 'characterId');
});

speechSuite.test('Speech has "text" field', () => {
  speechSuite.assertContains(speechScalarFields, 'text');
});

speechSuite.test('Speech has "ssmlText" field', () => {
  speechSuite.assertContains(speechScalarFields, 'ssmlText');
});

speechSuite.test('Speech has "orderIndex" field', () => {
  speechSuite.assertContains(speechScalarFields, 'orderIndex');
});

speechSuite.test('Speech has "audioUrl" field', () => {
  speechSuite.assertContains(speechScalarFields, 'audioUrl');
});

// NEW fields added in migration 20260213020000
speechSuite.test('Speech has "sceneImageUrl" field (used by media.controller, speeches.controller)', () => {
  speechSuite.assertContains(speechScalarFields, 'sceneImageUrl');
});

speechSuite.test('Speech has "ambientAudioUrl" field (used by media.controller, speeches.controller)', () => {
  speechSuite.assertContains(speechScalarFields, 'ambientAudioUrl');
});

speechSuite.test('Speech has "audioDurationMs" field (used by speeches.service update)', () => {
  speechSuite.assertContains(speechScalarFields, 'audioDurationMs');
});

speechSuite.test('Speech has "startTimeMs" field (timeline sync)', () => {
  speechSuite.assertContains(speechScalarFields, 'startTimeMs');
});

speechSuite.test('Speech has "endTimeMs" field (timeline sync)', () => {
  speechSuite.assertContains(speechScalarFields, 'endTimeMs');
});

const speechResult = speechSuite.summary();

// ============================================================
// Test Suite 2: Chapter Model Fields
// ============================================================
const chapterSuite = new TestRunner('Chapter Model Field Integrity');

chapterSuite.test('Chapter has "id" field', () => {
  chapterSuite.assertContains(chapterScalarFields, 'id');
});

chapterSuite.test('Chapter has "bookId" field', () => {
  chapterSuite.assertContains(chapterScalarFields, 'bookId');
});

chapterSuite.test('Chapter has "title" field', () => {
  chapterSuite.assertContains(chapterScalarFields, 'title');
});

chapterSuite.test('Chapter has "orderIndex" field', () => {
  chapterSuite.assertContains(chapterScalarFields, 'orderIndex');
});

chapterSuite.test('Chapter has "status" field', () => {
  chapterSuite.assertContains(chapterScalarFields, 'status');
});

chapterSuite.test('Chapter has "createdAt" field', () => {
  chapterSuite.assertContains(chapterScalarFields, 'createdAt');
});

chapterSuite.test('Chapter has "updatedAt" field', () => {
  chapterSuite.assertContains(chapterScalarFields, 'updatedAt');
});

// NEW fields added in migration 20260213020000
chapterSuite.test('Chapter has "soundtrackUrl" field (used by media.controller)', () => {
  chapterSuite.assertContains(chapterScalarFields, 'soundtrackUrl');
});

chapterSuite.test('Chapter has "soundtrackVolume" field (used by media.controller)', () => {
  chapterSuite.assertContains(chapterScalarFields, 'soundtrackVolume');
});

const chapterResult = chapterSuite.summary();

// ============================================================
// Test Suite 3: Book Model Fields
// ============================================================
const bookSuite = new TestRunner('Book Model Field Integrity');

bookSuite.test('Book has "id" field', () => {
  bookSuite.assertContains(bookScalarFields, 'id');
});

bookSuite.test('Book has "title" field', () => {
  bookSuite.assertContains(bookScalarFields, 'title');
});

bookSuite.test('Book has "author" field', () => {
  bookSuite.assertContains(bookScalarFields, 'author');
});

bookSuite.test('Book has "description" field', () => {
  bookSuite.assertContains(bookScalarFields, 'description');
});

bookSuite.test('Book has "coverUrl" field', () => {
  bookSuite.assertContains(bookScalarFields, 'coverUrl');
});

bookSuite.test('Book has "userId" field', () => {
  bookSuite.assertContains(bookScalarFields, 'userId');
});

bookSuite.test('Book has "createdAt" field', () => {
  bookSuite.assertContains(bookScalarFields, 'createdAt');
});

bookSuite.test('Book has "updatedAt" field', () => {
  bookSuite.assertContains(bookScalarFields, 'updatedAt');
});

const bookResult = bookSuite.summary();

// ============================================================
// Test Suite 4: Narration Model Fields
// ============================================================
const narrationSuite = new TestRunner('Narration Model Field Integrity');

narrationSuite.test('Narration has "id" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'id');
});

narrationSuite.test('Narration has "chapterId" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'chapterId');
});

narrationSuite.test('Narration has "status" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'status');
});

narrationSuite.test('Narration has "outputUrl" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'outputUrl');
});

narrationSuite.test('Narration has "driveFileId" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'driveFileId');
});

// NEW fields added in migration 20260213020000
narrationSuite.test('Narration has "totalDurationMs" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'totalDurationMs');
});

narrationSuite.test('Narration has "totalSpeeches" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'totalSpeeches');
});

narrationSuite.test('Narration has "completedSpeeches" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'completedSpeeches');
});

narrationSuite.test('Narration has "failedSpeeches" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'failedSpeeches');
});

narrationSuite.test('Narration has "timelineJson" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'timelineJson');
});

narrationSuite.test('Narration has "provider" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'provider');
});

narrationSuite.test('Narration has "errorMessage" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'errorMessage');
});

narrationSuite.test('Narration has "createdAt" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'createdAt');
});

narrationSuite.test('Narration has "updatedAt" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'updatedAt');
});

narrationSuite.test('Narration has "startedAt" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'startedAt');
});

narrationSuite.test('Narration has "completedAt" field', () => {
  narrationSuite.assertContains(narrationScalarFields, 'completedAt');
});

const narrationResult = narrationSuite.summary();

// ============================================================
// Test Suite 5: AuditLog Model Fields
// ============================================================
const auditSuite = new TestRunner('AuditLog Model Field Integrity');

auditSuite.test('AuditLog has "id" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'id');
});

auditSuite.test('AuditLog has "userId" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'userId');
});

auditSuite.test('AuditLog has "userEmail" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'userEmail');
});

auditSuite.test('AuditLog has "userRole" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'userRole');
});

auditSuite.test('AuditLog has "action" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'action');
});

auditSuite.test('AuditLog has "category" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'category');
});

auditSuite.test('AuditLog has "severity" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'severity');
});

auditSuite.test('AuditLog has "resource" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'resource');
});

auditSuite.test('AuditLog has "resourceId" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'resourceId');
});

auditSuite.test('AuditLog has "method" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'method');
});

auditSuite.test('AuditLog has "endpoint" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'endpoint');
});

auditSuite.test('AuditLog has "statusCode" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'statusCode');
});

auditSuite.test('AuditLog has "metadata" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'metadata');
});

auditSuite.test('AuditLog has "description" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'description');
});

auditSuite.test('AuditLog has "ipAddress" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'ipAddress');
});

auditSuite.test('AuditLog has "userAgent" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'userAgent');
});

auditSuite.test('AuditLog has "sessionId" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'sessionId');
});

auditSuite.test('AuditLog has "success" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'success');
});

auditSuite.test('AuditLog has "errorMessage" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'errorMessage');
});

auditSuite.test('AuditLog has "duration" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'duration');
});

auditSuite.test('AuditLog has "createdAt" field', () => {
  auditSuite.assertContains(auditLogScalarFields, 'createdAt');
});

const auditResult = auditSuite.summary();

// ============================================================
// Test Suite 6: Character Model Fields
// ============================================================
const characterSuite = new TestRunner('Character Model Field Integrity');

characterSuite.test('Character has "id" field', () => {
  characterSuite.assertContains(characterScalarFields, 'id');
});

characterSuite.test('Character has "bookId" field', () => {
  characterSuite.assertContains(characterScalarFields, 'bookId');
});

characterSuite.test('Character has "name" field', () => {
  characterSuite.assertContains(characterScalarFields, 'name');
});

characterSuite.test('Character has "voiceId" field', () => {
  characterSuite.assertContains(characterScalarFields, 'voiceId');
});

characterSuite.test('Character has "voiceDescription" field', () => {
  characterSuite.assertContains(characterScalarFields, 'voiceDescription');
});

characterSuite.test('Character has "previewAudioUrl" field', () => {
  characterSuite.assertContains(characterScalarFields, 'previewAudioUrl');
});

const characterResult = characterSuite.summary();

// ============================================================
// Test Suite 7: Frontend-Backend Field Mapping
// ============================================================
const mappingSuite = new TestRunner('Frontend-Backend Field Mapping Integrity');

// These fields are what the frontend Writer expects from the backend API
const frontendSpeechFields = [
  'id', 'chapterId', 'characterId', 'text', 'ssmlText',
  'orderIndex', 'audioUrl', 'sceneImageUrl', 'ambientAudioUrl',
  'audioDurationMs', 'startTimeMs', 'endTimeMs'
];

for (const field of frontendSpeechFields) {
  mappingSuite.test(`Frontend Speech.${field} exists in Prisma schema`, () => {
    mappingSuite.assertContains(speechScalarFields, field,
      `Frontend expects Speech.${field} but it's not in the Prisma schema`);
  });
}

const frontendChapterFields = [
  'id', 'bookId', 'title', 'orderIndex', 'status',
  'soundtrackUrl', 'soundtrackVolume', 'createdAt', 'updatedAt'
];

for (const field of frontendChapterFields) {
  mappingSuite.test(`Frontend Chapter.${field} exists in Prisma schema`, () => {
    mappingSuite.assertContains(chapterScalarFields, field,
      `Frontend expects Chapter.${field} but it's not in the Prisma schema`);
  });
}

const frontendBookFields = [
  'id', 'title', 'author', 'description', 'coverUrl',
  'userId', 'createdAt', 'updatedAt'
];

for (const field of frontendBookFields) {
  mappingSuite.test(`Frontend Book.${field} exists in Prisma schema`, () => {
    mappingSuite.assertContains(bookScalarFields, field,
      `Frontend expects Book.${field} but it's not in the Prisma schema`);
  });
}

const mappingResult = mappingSuite.summary();

// ============================================================
// Test Suite 8: Enum Existence Validation
// ============================================================
const enumSuite = new TestRunner('Prisma Enum Integrity');

enumSuite.test('AuditAction enum exists with AUTH_LOGIN', () => {
  enumSuite.assertEqual(AuditAction.AUTH_LOGIN, 'AUTH_LOGIN', 'AuditAction.AUTH_LOGIN should exist');
});

enumSuite.test('AuditAction enum has BOOK_CREATE', () => {
  enumSuite.assertEqual(AuditAction.BOOK_CREATE, 'BOOK_CREATE', 'AuditAction.BOOK_CREATE should exist');
});

enumSuite.test('AuditAction enum has SPEECH_CREATE', () => {
  enumSuite.assertEqual(AuditAction.SPEECH_CREATE, 'SPEECH_CREATE', 'AuditAction.SPEECH_CREATE should exist');
});

enumSuite.test('AuditAction enum has NARRATION_START', () => {
  enumSuite.assertEqual(AuditAction.NARRATION_START, 'NARRATION_START', 'AuditAction.NARRATION_START should exist');
});

enumSuite.test('AuditCategory enum exists with AUTH', () => {
  enumSuite.assertEqual(AuditCategory.AUTH, 'AUTH', 'AuditCategory.AUTH should exist');
});

enumSuite.test('AuditCategory enum has SPEECH', () => {
  enumSuite.assertEqual(AuditCategory.SPEECH, 'SPEECH', 'AuditCategory.SPEECH should exist');
});

enumSuite.test('AuditSeverity enum exists with LOW', () => {
  enumSuite.assertEqual(AuditSeverity.LOW, 'LOW', 'AuditSeverity.LOW should exist');
});

enumSuite.test('AuditSeverity enum has CRITICAL', () => {
  enumSuite.assertEqual(AuditSeverity.CRITICAL, 'CRITICAL', 'AuditSeverity.CRITICAL should exist');
});

enumSuite.test('UserRole enum has ADMIN', () => {
  enumSuite.assertEqual(UserRole.ADMIN, 'ADMIN', 'UserRole.ADMIN should exist');
});

enumSuite.test('UserRole enum has WRITER', () => {
  enumSuite.assertEqual(UserRole.WRITER, 'WRITER', 'UserRole.WRITER should exist');
});

enumSuite.test('UserRole enum has PRO', () => {
  enumSuite.assertEqual(UserRole.PRO, 'PRO', 'UserRole.PRO should exist');
});

const enumResult = enumSuite.summary();

// ============================================================
// Test Suite 9: OAuth Models
// ============================================================
const oauthSuite = new TestRunner('OAuth Model Field Integrity');

const oauthClientFields = Object.values(Prisma.OAuthClientScalarFieldEnum);
const oauthCodeFields = Object.values(Prisma.OAuthAuthorizationCodeScalarFieldEnum);

oauthSuite.test('OAuthClient has "id" field', () => {
  oauthSuite.assertContains(oauthClientFields, 'id');
});

oauthSuite.test('OAuthClient has "clientId" field', () => {
  oauthSuite.assertContains(oauthClientFields, 'clientId');
});

oauthSuite.test('OAuthClient has "name" field', () => {
  oauthSuite.assertContains(oauthClientFields, 'name');
});

oauthSuite.test('OAuthClient has "isActive" field', () => {
  oauthSuite.assertContains(oauthClientFields, 'isActive');
});

oauthSuite.test('OAuthAuthorizationCode has "id" field', () => {
  oauthSuite.assertContains(oauthCodeFields, 'id');
});

oauthSuite.test('OAuthAuthorizationCode has "code" field', () => {
  oauthSuite.assertContains(oauthCodeFields, 'code');
});

oauthSuite.test('OAuthAuthorizationCode has "codeChallenge" field (PKCE)', () => {
  oauthSuite.assertContains(oauthCodeFields, 'codeChallenge');
});

const oauthResult = oauthSuite.summary();

// ============================================================
// Final Summary
// ============================================================
console.log('\n===================================================');
console.log('📊 Final Summary - Prisma Field Integrity Tests');
console.log('===================================================');

const allResults = [
  { name: 'Speech Model', passed: speechResult },
  { name: 'Chapter Model', passed: chapterResult },
  { name: 'Book Model', passed: bookResult },
  { name: 'Narration Model', passed: narrationResult },
  { name: 'AuditLog Model', passed: auditResult },
  { name: 'Character Model', passed: characterResult },
  { name: 'Frontend-Backend Mapping', passed: mappingResult },
  { name: 'Prisma Enums', passed: enumResult },
  { name: 'OAuth Models', passed: oauthResult },
];

for (const result of allResults) {
  console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}`);
}

const allPassed = allResults.every(r => r.passed);
console.log(`\n${allPassed ? '✅ All test suites passed!' : '❌ Some test suites failed.'}`);
process.exit(allPassed ? 0 : 1);
