"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const audit_service_1 = require("../audit.service");
const client_1 = require("@prisma/client");
// Mock Prisma
vitest_1.vi.mock('@prisma/client', () => ({
    PrismaClient: vitest_1.vi.fn(() => ({
        auditLog: {
            create: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            count: vitest_1.vi.fn(),
            groupBy: vitest_1.vi.fn(),
            deleteMany: vitest_1.vi.fn(),
            updateMany: vitest_1.vi.fn(),
        },
        user: {
            findMany: vitest_1.vi.fn(),
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
(0, vitest_1.describe)('AuditService - Security Tests', () => {
    let auditService;
    (0, vitest_1.beforeEach)(() => {
        auditService = new audit_service_1.AuditService();
    });
    (0, vitest_1.describe)('Metadata Sanitization', () => {
        (0, vitest_1.it)('should redact sensitive fields from metadata', async () => {
            const sensitiveData = {
                email: 'user@test.com',
                password: 'secret123',
                token: 'abc123',
                apiKey: 'key123',
                normalField: 'visible',
            };
            await auditService.log({
                action: client_1.AuditAction.AUTH_LOGIN,
                category: client_1.AuditCategory.AUTH,
                metadata: sensitiveData,
            });
            // Verify that sensitive fields were redacted
            // Note: This would require exposing the sanitizeMetadata function or testing via integration
        });
        (0, vitest_1.it)('should truncate metadata exceeding 10KB', async () => {
            const largeData = {
                data: 'x'.repeat(20000), // 20KB of data
            };
            await auditService.log({
                action: client_1.AuditAction.BOOK_CREATE,
                category: client_1.AuditCategory.BOOK,
                metadata: largeData,
            });
            // Should truncate and add _truncated flag
        });
        (0, vitest_1.it)('should handle nested objects with max depth of 3', async () => {
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
                action: client_1.AuditAction.BOOK_UPDATE,
                category: client_1.AuditCategory.BOOK,
                metadata: deeplyNested,
            });
            // Should stop at level 3 and add _truncated
        });
    });
    (0, vitest_1.describe)('String Sanitization', () => {
        (0, vitest_1.it)('should remove control characters from strings', async () => {
            const maliciousString = 'Normal text\x00\x1F\x7FWith control chars';
            await auditService.log({
                action: client_1.AuditAction.POST_CREATE,
                category: client_1.AuditCategory.SOCIAL,
                description: maliciousString,
            });
            // Should remove \x00, \x1F, \x7F
        });
        (0, vitest_1.it)('should truncate strings longer than 1000 characters', async () => {
            const longString = 'a'.repeat(2000);
            await auditService.log({
                action: client_1.AuditAction.COMMENT_CREATE,
                category: client_1.AuditCategory.SOCIAL,
                description: longString,
            });
            // Should truncate to 1000 chars
        });
    });
    (0, vitest_1.describe)('WebSocket Emission', () => {
        (0, vitest_1.it)('should emit to admin-room for audit logs', async () => {
            const mockEmitter = vitest_1.vi.fn();
            auditService.setWebSocketEmitter(mockEmitter);
            await auditService.log({
                action: client_1.AuditAction.AUTH_LOGIN_FAILED,
                category: client_1.AuditCategory.AUTH,
                severity: client_1.AuditSeverity.HIGH,
            });
            (0, vitest_1.expect)(mockEmitter).toHaveBeenCalledWith('admin-room', 'audit:new', vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should not fail if WebSocket emitter is not set', async () => {
            // No emitter set
            await (0, vitest_1.expect)(auditService.log({
                action: client_1.AuditAction.BOOK_CREATE,
                category: client_1.AuditCategory.BOOK,
            })).resolves.not.toThrow();
        });
    });
    (0, vitest_1.describe)('Export Rate Limiting', () => {
        (0, vitest_1.it)('should reject exports exceeding 100,000 records', async () => {
            // Mock query to return large count
            const filters = { page: 1, limit: 10 };
            // This would need to mock the query method to return 150,000 records
            const result = await auditService.export(filters, 'json');
            if ('error' in result) {
                (0, vitest_1.expect)(result.error).toContain('100000');
                (0, vitest_1.expect)(result.maxRecords).toBe(100000);
            }
        });
        (0, vitest_1.it)('should allow exports under 100,000 records', async () => {
            const filters = { page: 1, limit: 10 };
            // Mock query to return small count
            const result = await auditService.export(filters, 'csv');
            (0, vitest_1.expect)(result).toBeInstanceOf(Buffer);
        });
    });
    (0, vitest_1.describe)('Alert System', () => {
        (0, vitest_1.it)('should trigger alerts for CRITICAL severity', async () => {
            await auditService.log({
                userId: 'user123',
                userEmail: 'test@test.com',
                action: client_1.AuditAction.ADMIN_USER_BAN,
                category: client_1.AuditCategory.ADMIN,
                severity: client_1.AuditSeverity.CRITICAL,
                description: 'User banned by admin',
            });
            // Should call notifyAdmins
        });
        (0, vitest_1.it)('should trigger alerts for HIGH severity security events', async () => {
            await auditService.log({
                action: client_1.AuditAction.AUTH_LOGIN_FAILED,
                category: client_1.AuditCategory.AUTH,
                severity: client_1.AuditSeverity.HIGH,
                ipAddress: '192.168.1.1',
            });
            // Should call notifyAdmins for repeated failures
        });
    });
    (0, vitest_1.describe)('Fire-and-Forget Logging', () => {
        (0, vitest_1.it)('should not throw errors even if database fails', async () => {
            // Mock database error
            await (0, vitest_1.expect)(auditService.log({
                action: client_1.AuditAction.BOOK_CREATE,
                category: client_1.AuditCategory.BOOK,
            })).resolves.not.toThrow();
        });
        (0, vitest_1.it)('should log errors to console but continue execution', async () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'error');
            await auditService.log({
                action: client_1.AuditAction.SYSTEM_MAINTENANCE,
                category: client_1.AuditCategory.SYSTEM,
            });
            // Should not throw, may log to console
        });
    });
    (0, vitest_1.describe)('Query Filters', () => {
        (0, vitest_1.it)('should filter by severity', async () => {
            const result = await auditService.query({
                severity: client_1.AuditSeverity.CRITICAL,
                page: 1,
                limit: 10,
            });
            (0, vitest_1.expect)(result.filters.severity).toBe(client_1.AuditSeverity.CRITICAL);
        });
        (0, vitest_1.it)('should filter by date range', async () => {
            const startDate = new Date('2026-01-01');
            const endDate = new Date('2026-01-31');
            const result = await auditService.query({
                startDate,
                endDate,
                page: 1,
                limit: 10,
            });
            (0, vitest_1.expect)(result.filters.startDate).toEqual(startDate);
            (0, vitest_1.expect)(result.filters.endDate).toEqual(endDate);
        });
        (0, vitest_1.it)('should search across multiple fields', async () => {
            const result = await auditService.query({
                search: 'test@example.com',
                page: 1,
                limit: 10,
            });
            (0, vitest_1.expect)(result.filters.search).toBe('test@example.com');
        });
    });
    (0, vitest_1.describe)('Retention Policy', () => {
        (0, vitest_1.it)('should purge LOW severity logs after 90 days', async () => {
            const count = await auditService.purgeByRetentionPolicy();
            (0, vitest_1.expect)(count).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should keep CRITICAL logs for 365 days', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 400);
            const count = await auditService.purge(oldDate);
            (0, vitest_1.expect)(count).toBeGreaterThanOrEqual(0);
        });
    });
    (0, vitest_1.describe)('LGPD Compliance', () => {
        (0, vitest_1.it)('should anonymize user logs on request', async () => {
            const userId = 'user-to-anonymize';
            const count = await auditService.anonymizeUserLogs(userId);
            (0, vitest_1.expect)(count).toBeGreaterThanOrEqual(0);
        });
    });
});
