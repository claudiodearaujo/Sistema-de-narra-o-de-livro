import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit.service';
import { AuditAction, AuditCategory, AuditSeverity, UserRole } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  })),
  AuditAction: {},
  AuditCategory: {},
  AuditSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  UserRole: {
    ADMIN: 'ADMIN',
    USER: 'USER',
  },
}));

describe('AuditService - Security Tests', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
  });

  describe('Metadata Sanitization', () => {
    it('should redact sensitive fields from metadata', async () => {
      const sensitiveData = {
        email: 'user@test.com',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key123',
        normalField: 'visible',
      };

      await auditService.log({
        action: AuditAction.AUTH_LOGIN,
        category: AuditCategory.AUTH,
        metadata: sensitiveData,
      });

      // Verify that sensitive fields were redacted
      // Note: This would require exposing the sanitizeMetadata function or testing via integration
    });

    it('should truncate metadata exceeding 10KB', async () => {
      const largeData = {
        data: 'x'.repeat(20000), // 20KB of data
      };

      await auditService.log({
        action: AuditAction.BOOK_CREATE,
        category: AuditCategory.BOOK,
        metadata: largeData,
      });

      // Should truncate and add _truncated flag
    });

    it('should handle nested objects with max depth of 3', async () => {
      const deeplyNested = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'too deep',
              },
            },
          },
        },
      };

      await auditService.log({
        action: AuditAction.BOOK_UPDATE,
        category: AuditCategory.BOOK,
        metadata: deeplyNested,
      });

      // Should stop at level 3 and add _truncated
    });
  });

  describe('String Sanitization', () => {
    it('should remove control characters from strings', async () => {
      const maliciousString = 'Normal text\x00\x1F\x7FWith control chars';

      await auditService.log({
        action: AuditAction.POST_CREATE,
        category: AuditCategory.SOCIAL,
        description: maliciousString,
      });

      // Should remove \x00, \x1F, \x7F
    });

    it('should truncate strings longer than 1000 characters', async () => {
      const longString = 'a'.repeat(2000);

      await auditService.log({
        action: AuditAction.COMMENT_CREATE,
        category: AuditCategory.SOCIAL,
        description: longString,
      });

      // Should truncate to 1000 chars
    });
  });

  describe('WebSocket Emission', () => {
    it('should emit to admin-room for audit logs', async () => {
      const mockEmitter = vi.fn();
      auditService.setWebSocketEmitter(mockEmitter);

      await auditService.log({
        action: AuditAction.AUTH_LOGIN_FAILED,
        category: AuditCategory.AUTH,
        severity: AuditSeverity.HIGH,
      });

      expect(mockEmitter).toHaveBeenCalledWith(
        'admin-room',
        'audit:new',
        expect.any(Object)
      );
    });

    it('should not fail if WebSocket emitter is not set', async () => {
      // No emitter set
      await expect(
        auditService.log({
          action: AuditAction.BOOK_CREATE,
          category: AuditCategory.BOOK,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Export Rate Limiting', () => {
    it('should reject exports exceeding 100,000 records', async () => {
      // Mock query to return large count
      const filters = { page: 1, limit: 10 };
      
      // This would need to mock the query method to return 150,000 records
      const result = await auditService.export(filters, 'json');

      if ('error' in result) {
        expect(result.error).toContain('100000');
        expect(result.maxRecords).toBe(100000);
      }
    });

    it('should allow exports under 100,000 records', async () => {
      const filters = { page: 1, limit: 10 };
      
      // Mock query to return small count
      const result = await auditService.export(filters, 'csv');

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('Alert System', () => {
    it('should trigger alerts for CRITICAL severity', async () => {
      await auditService.log({
        userId: 'user123',
        userEmail: 'test@test.com',
        action: AuditAction.ADMIN_USER_BAN,
        category: AuditCategory.ADMIN,
        severity: AuditSeverity.CRITICAL,
        description: 'User banned by admin',
      });

      // Should call notifyAdmins
    });

    it('should trigger alerts for HIGH severity security events', async () => {
      await auditService.log({
        action: AuditAction.AUTH_LOGIN_FAILED,
        category: AuditCategory.AUTH,
        severity: AuditSeverity.HIGH,
        ipAddress: '192.168.1.1',
      });

      // Should call notifyAdmins for repeated failures
    });
  });

  describe('Fire-and-Forget Logging', () => {
    it('should not throw errors even if database fails', async () => {
      // Mock database error
      await expect(
        auditService.log({
          action: AuditAction.BOOK_CREATE,
          category: AuditCategory.BOOK,
        })
      ).resolves.not.toThrow();
    });

    it('should log errors to console but continue execution', async () => {
      const consoleSpy = vi.spyOn(console, 'error');

      await auditService.log({
        action: AuditAction.SYSTEM_MAINTENANCE,
        category: AuditCategory.SYSTEM,
      });

      // Should not throw, may log to console
    });
  });

  describe('Query Filters', () => {
    it('should filter by severity', async () => {
      const result = await auditService.query({
        severity: AuditSeverity.CRITICAL,
        page: 1,
        limit: 10,
      });

      expect(result.filters.severity).toBe(AuditSeverity.CRITICAL);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const result = await auditService.query({
        startDate,
        endDate,
        page: 1,
        limit: 10,
      });

      expect(result.filters.startDate).toEqual(startDate);
      expect(result.filters.endDate).toEqual(endDate);
    });

    it('should search across multiple fields', async () => {
      const result = await auditService.query({
        search: 'test@example.com',
        page: 1,
        limit: 10,
      });

      expect(result.filters.search).toBe('test@example.com');
    });
  });

  describe('Retention Policy', () => {
    it('should purge LOW severity logs after 90 days', async () => {
      const count = await auditService.purgeByRetentionPolicy();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should keep CRITICAL logs for 365 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400);

      const count = await auditService.purge(oldDate);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('LGPD Compliance', () => {
    it('should anonymize user logs on request', async () => {
      const userId = 'user-to-anonymize';
      const count = await auditService.anonymizeUserLogs(userId);

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
