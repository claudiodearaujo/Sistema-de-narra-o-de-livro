"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ========== CONSTANTS ==========
const SENSITIVE_FIELDS = [
    'password', 'senha', 'token', 'refreshToken', 'accessToken',
    'secret', 'apiKey', 'creditCard', 'cvv', 'cardNumber',
    'stripeCustomerId', 'stripeSubscriptionId', 'resetToken', 'verifyToken'
];
const MAX_METADATA_SIZE = 10 * 1024; // 10KB
const MAX_DEPTH = 3;
// ========== UTILITY FUNCTIONS ==========
/**
 * Sanitiza dados sensíveis do metadata
 */
function sanitizeMetadata(data, depth = 0) {
    if (depth > MAX_DEPTH) {
        return { _truncated: 'Max depth exceeded' };
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        // Remove campos sensíveis
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
            continue;
        }
        // Recursivamente sanitiza objetos aninhados
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeMetadata(value, depth + 1);
        }
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => typeof item === 'object' ? sanitizeMetadata(item, depth + 1) : item);
        }
        else {
            sanitized[key] = value;
        }
    }
    // Limita tamanho total do JSON
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > MAX_METADATA_SIZE) {
        return { _truncated: `Metadata too large (${jsonString.length} bytes)` };
    }
    return sanitized;
}
/**
 * Sanitiza strings para prevenir log injection
 */
function sanitizeString(input) {
    return input
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
        .substring(0, 1000); // Limita tamanho
}
// ========== AUDIT SERVICE ==========
class AuditService {
    /**
     * Registra um evento de auditoria
     * Fire-and-forget: não bloqueia a execução
     */
    async log(input) {
        try {
            // Sanitiza metadata se existir
            const sanitizedMetadata = input.metadata
                ? sanitizeMetadata(input.metadata)
                : undefined;
            // Sanitiza strings
            const description = input.description
                ? sanitizeString(input.description)
                : undefined;
            await prisma.auditLog.create({
                data: {
                    userId: input.userId,
                    userEmail: input.userEmail,
                    userRole: input.userRole,
                    action: input.action,
                    category: input.category,
                    severity: input.severity || client_1.AuditSeverity.MEDIUM,
                    resource: input.resource,
                    resourceId: input.resourceId,
                    method: input.method,
                    endpoint: input.endpoint,
                    statusCode: input.statusCode,
                    metadata: sanitizedMetadata,
                    description,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                    sessionId: input.sessionId,
                    success: input.success !== undefined ? input.success : true,
                    errorMessage: input.errorMessage,
                    duration: input.duration,
                },
            });
        }
        catch (error) {
            // Nunca deve falhar a operação principal
            console.error('[AUDIT] Falha ao gravar log:', error);
        }
    }
    // ========== HELPERS DE AUTH ==========
    async logLogin(userId, email, ip, userAgent) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.AUTH_LOGIN,
            category: client_1.AuditCategory.AUTH,
            severity: client_1.AuditSeverity.MEDIUM,
            description: `Usuário ${email} fez login`,
            ipAddress: ip,
            userAgent,
            success: true,
        });
    }
    async logLoginFailed(email, ip, userAgent, reason) {
        return this.log({
            userEmail: email,
            action: client_1.AuditAction.AUTH_LOGIN_FAILED,
            category: client_1.AuditCategory.AUTH,
            severity: client_1.AuditSeverity.HIGH,
            description: `Tentativa de login falhou para ${email}`,
            ipAddress: ip,
            userAgent,
            success: false,
            errorMessage: reason,
        });
    }
    async logLogout(userId, email) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.AUTH_LOGOUT,
            category: client_1.AuditCategory.AUTH,
            severity: client_1.AuditSeverity.LOW,
            description: `Usuário ${email} fez logout`,
        });
    }
    async logSignup(userId, email, ip) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.AUTH_SIGNUP,
            category: client_1.AuditCategory.AUTH,
            severity: client_1.AuditSeverity.MEDIUM,
            description: `Novo usuário registrado: ${email}`,
            ipAddress: ip,
        });
    }
    async logPasswordChange(userId, email) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.AUTH_PASSWORD_CHANGE,
            category: client_1.AuditCategory.AUTH,
            severity: client_1.AuditSeverity.HIGH,
            description: `Usuário ${email} alterou a senha`,
        });
    }
    async logPasswordResetRequest(email, ip) {
        return this.log({
            userEmail: email,
            action: client_1.AuditAction.AUTH_PASSWORD_RESET_REQUEST,
            category: client_1.AuditCategory.AUTH,
            severity: client_1.AuditSeverity.MEDIUM,
            description: `Solicitação de reset de senha para ${email}`,
            ipAddress: ip,
        });
    }
    async logPasswordResetComplete(userId, email) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.AUTH_PASSWORD_RESET_COMPLETE,
            category: client_1.AuditCategory.AUTH,
            severity: client_1.AuditSeverity.HIGH,
            description: `Reset de senha concluído para ${email}`,
        });
    }
    // ========== HELPERS DE CRUD ==========
    async logCreate(userId, email, resource, resourceId, metadata) {
        return this.log({
            userId,
            userEmail: email,
            action: `${resource.toUpperCase()}_CREATE`,
            category: this.getCategoryFromResource(resource),
            severity: client_1.AuditSeverity.MEDIUM,
            resource,
            resourceId,
            description: `${resource} criado`,
            metadata,
        });
    }
    async logUpdate(userId, email, resource, resourceId, changes) {
        return this.log({
            userId,
            userEmail: email,
            action: `${resource.toUpperCase()}_UPDATE`,
            category: this.getCategoryFromResource(resource),
            severity: client_1.AuditSeverity.MEDIUM,
            resource,
            resourceId,
            description: `${resource} atualizado`,
            metadata: { changes },
        });
    }
    async logDelete(userId, email, resource, resourceId, metadata) {
        return this.log({
            userId,
            userEmail: email,
            action: `${resource.toUpperCase()}_DELETE`,
            category: this.getCategoryFromResource(resource),
            severity: client_1.AuditSeverity.HIGH,
            resource,
            resourceId,
            description: `${resource} deletado`,
            metadata,
        });
    }
    // ========== HELPERS DE SEGURANÇA ==========
    async logPermissionDenied(userId, email, endpoint, reason) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.PERMISSION_DENIED,
            category: client_1.AuditCategory.SYSTEM,
            severity: client_1.AuditSeverity.HIGH,
            endpoint,
            description: `Permissão negada: ${reason}`,
            success: false,
            errorMessage: reason,
        });
    }
    async logRateLimitExceeded(userId, email, endpoint, ip) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.RATE_LIMIT_EXCEEDED,
            category: client_1.AuditCategory.SYSTEM,
            severity: client_1.AuditSeverity.MEDIUM,
            endpoint,
            ipAddress: ip,
            description: `Rate limit excedido`,
            success: false,
        });
    }
    async logPlanLimitReached(userId, email, limitType) {
        return this.log({
            userId,
            userEmail: email,
            action: client_1.AuditAction.PLAN_LIMIT_REACHED,
            category: client_1.AuditCategory.SYSTEM,
            severity: client_1.AuditSeverity.MEDIUM,
            description: `Limite do plano atingido: ${limitType}`,
            metadata: { limitType },
            success: false,
        });
    }
    // ========== HELPERS ADMIN ==========
    async logAdminAction(adminId, adminEmail, action, targetUserId, metadata) {
        return this.log({
            userId: adminId,
            userEmail: adminEmail,
            action,
            category: client_1.AuditCategory.ADMIN,
            severity: client_1.AuditSeverity.CRITICAL,
            description: `Ação admin: ${action}`,
            metadata: { targetUserId, ...metadata },
        });
    }
    // ========== QUERY METHODS ==========
    async query(filters) {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 50, 200);
        const skip = (page - 1) * limit;
        // Constrói o where clause
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.action) {
            where.action = Array.isArray(filters.action)
                ? { in: filters.action }
                : filters.action;
        }
        if (filters.category) {
            where.category = Array.isArray(filters.category)
                ? { in: filters.category }
                : filters.category;
        }
        if (filters.severity) {
            where.severity = Array.isArray(filters.severity)
                ? { in: filters.severity }
                : filters.severity;
        }
        if (filters.resource)
            where.resource = filters.resource;
        if (filters.resourceId)
            where.resourceId = filters.resourceId;
        if (filters.success !== undefined)
            where.success = filters.success;
        if (filters.ipAddress)
            where.ipAddress = filters.ipAddress;
        if (filters.method)
            where.method = filters.method;
        if (filters.endpoint)
            where.endpoint = { contains: filters.endpoint };
        // Filtro de período
        const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = filters.endDate || new Date();
        where.createdAt = { gte: startDate, lte: endDate };
        // Busca textual
        if (filters.search) {
            where.OR = [
                { description: { contains: filters.search, mode: 'insensitive' } },
                { userEmail: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        // Ordenação
        const sortBy = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'desc';
        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.auditLog.count({ where }),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            filters,
        };
    }
    /**
     * Exporta logs para CSV ou JSON
     */
    async export(filters, format) {
        const result = await this.query({ ...filters, limit: 10000 });
        if (format === 'json') {
            return Buffer.from(JSON.stringify(result.data, null, 2));
        }
        // CSV format
        const headers = [
            'ID', 'Data', 'Usuário', 'Email', 'Ação', 'Categoria',
            'Severidade', 'Recurso', 'Sucesso', 'IP', 'Descrição'
        ];
        const rows = result.data.map(log => [
            log.id,
            log.createdAt.toISOString(),
            log.userId || '',
            log.userEmail || '',
            log.action,
            log.category,
            log.severity,
            log.resource || '',
            log.success ? 'Sim' : 'Não',
            log.ipAddress || '',
            log.description || '',
        ]);
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');
        return Buffer.from(csv);
    }
    /**
     * Expurga logs antigos conforme política de retenção
     */
    async purge(olderThan) {
        const result = await prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: olderThan },
            },
        });
        return result.count;
    }
    /**
     * Expurga logs com base na política de severidade
     */
    async purgeByRetentionPolicy() {
        const now = new Date();
        let totalDeleted = 0;
        const rules = [
            { severity: client_1.AuditSeverity.LOW, days: 90 },
            { severity: client_1.AuditSeverity.MEDIUM, days: 180 },
            { severity: client_1.AuditSeverity.HIGH, days: 365 },
            { severity: client_1.AuditSeverity.CRITICAL, days: 730 },
        ];
        for (const rule of rules) {
            const cutoff = new Date(now.getTime() - rule.days * 24 * 60 * 60 * 1000);
            const result = await prisma.auditLog.deleteMany({
                where: {
                    severity: rule.severity,
                    createdAt: { lt: cutoff },
                },
            });
            totalDeleted += result.count;
            console.log(`[AUDIT PURGE] Removidos ${result.count} logs ${rule.severity} anteriores a ${cutoff.toISOString()}`);
        }
        return totalDeleted;
    }
    /**
     * Anonimiza logs de um usuário (LGPD)
     */
    async anonymizeUserLogs(userId) {
        const result = await prisma.auditLog.updateMany({
            where: { userId },
            data: {
                userId: null,
                userEmail: '[ANONYMIZED]',
                ipAddress: null,
                userAgent: null,
                // Note: metadata cannot be set to null in updateMany for Json fields
            },
        });
        return result.count;
    }
    // ========== HELPER METHODS ==========
    getCategoryFromResource(resource) {
        const resourceUpper = resource.toUpperCase();
        if (['BOOK'].includes(resourceUpper))
            return client_1.AuditCategory.BOOK;
        if (['CHAPTER'].includes(resourceUpper))
            return client_1.AuditCategory.CHAPTER;
        if (['CHARACTER'].includes(resourceUpper))
            return client_1.AuditCategory.CHARACTER;
        if (['SPEECH'].includes(resourceUpper))
            return client_1.AuditCategory.SPEECH;
        if (['POST'].includes(resourceUpper))
            return client_1.AuditCategory.SOCIAL;
        if (['COMMENT', 'LIKE', 'FOLLOW'].includes(resourceUpper))
            return client_1.AuditCategory.SOCIAL;
        if (['MESSAGE'].includes(resourceUpper))
            return client_1.AuditCategory.MESSAGE;
        if (['GROUP'].includes(resourceUpper))
            return client_1.AuditCategory.GROUP;
        if (['CAMPAIGN'].includes(resourceUpper))
            return client_1.AuditCategory.CAMPAIGN;
        if (['STORY'].includes(resourceUpper))
            return client_1.AuditCategory.STORY;
        if (['SUBSCRIPTION', 'LIVRA'].includes(resourceUpper))
            return client_1.AuditCategory.FINANCIAL;
        return client_1.AuditCategory.SYSTEM;
    }
}
// Singleton instance
exports.auditService = new AuditService();
