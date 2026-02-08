import { PrismaClient, AuditAction, AuditCategory, AuditSeverity, UserRole } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

// ========== INTERFACES ==========

export interface AuditLogInput {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  action: AuditAction;
  category: AuditCategory;
  severity?: AuditSeverity;
  resource?: string;
  resourceId?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success?: boolean;
  errorMessage?: string;
  duration?: number;
}

export interface AuditQueryFilters {
  userId?: string;
  action?: AuditAction | AuditAction[];
  category?: AuditCategory | AuditCategory[];
  severity?: AuditSeverity | AuditSeverity[];
  resource?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  method?: string;
  endpoint?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'severity' | 'action';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: AuditQueryFilters;
}

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
function sanitizeMetadata(data: Record<string, any>, depth = 0): Record<string, any> {
  if (depth > MAX_DEPTH) {
    return { _truncated: 'Max depth exceeded' };
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Remove campos sensíveis
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursivamente sanitiza objetos aninhados
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value, depth + 1);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeMetadata(item, depth + 1) : item
      );
    } else {
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
function sanitizeString(input: string): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
    .substring(0, 1000); // Limita tamanho
}

// ========== AUDIT SERVICE ==========

export class AuditService {
  private wsEmitter: ((userId: string, event: string, data: any) => void) | null = null;

  /**
   * Define o emissor de eventos WebSocket
   */
  setWebSocketEmitter(emitter: (userId: string, event: string, data: any) => void) {
    this.wsEmitter = emitter;
  }

  /**
   * Registra um evento de auditoria
   * Fire-and-forget: não bloqueia a execução
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      // Sanitiza metadata se existir
      const sanitizedMetadata = input.metadata 
        ? sanitizeMetadata(input.metadata) 
        : undefined;

      // Sanitiza strings
      const description = input.description 
        ? sanitizeString(input.description) 
        : undefined;

      const log = await prisma.auditLog.create({
        data: {
          userId: input.userId,
          userEmail: input.userEmail,
          userRole: input.userRole,
          action: input.action,
          category: input.category,
          severity: input.severity || AuditSeverity.MEDIUM,
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

      // Emitir via WebSocket para admins em tempo real
      if (this.wsEmitter) {
        // Emite apenas para sala de admins
        this.wsEmitter('admin-room', 'audit:new', log);
      }

      // Disparar alertas se necessário
      this.checkAndTriggerAlert(input).catch(err => console.error('[AUDIT ALERT]', err));
    } catch (error) {
      // Nunca deve falhar a operação principal
      console.error('[AUDIT] Falha ao gravar log:', error);
    }
  }

  // ========== HELPERS DE AUTH ==========

  async logLogin(userId: string, email: string, ip: string, userAgent: string): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.AUTH_LOGIN,
      category: AuditCategory.AUTH,
      severity: AuditSeverity.MEDIUM,
      description: `Usuário ${email} fez login`,
      ipAddress: ip,
      userAgent,
      success: true,
    });
  }

  async logLoginFailed(email: string, ip: string, userAgent: string, reason: string): Promise<void> {
    return this.log({
      userEmail: email,
      action: AuditAction.AUTH_LOGIN_FAILED,
      category: AuditCategory.AUTH,
      severity: AuditSeverity.HIGH,
      description: `Tentativa de login falhou para ${email}`,
      ipAddress: ip,
      userAgent,
      success: false,
      errorMessage: reason,
    });
  }

  async logLogout(userId: string, email: string): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.AUTH_LOGOUT,
      category: AuditCategory.AUTH,
      severity: AuditSeverity.LOW,
      description: `Usuário ${email} fez logout`,
    });
  }

  async logSignup(userId: string, email: string, ip: string): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.AUTH_SIGNUP,
      category: AuditCategory.AUTH,
      severity: AuditSeverity.MEDIUM,
      description: `Novo usuário registrado: ${email}`,
      ipAddress: ip,
    });
  }

  async logPasswordChange(userId: string, email: string): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.AUTH_PASSWORD_CHANGE,
      category: AuditCategory.AUTH,
      severity: AuditSeverity.HIGH,
      description: `Usuário ${email} alterou a senha`,
    });
  }

  async logPasswordResetRequest(email: string, ip: string): Promise<void> {
    return this.log({
      userEmail: email,
      action: AuditAction.AUTH_PASSWORD_RESET_REQUEST,
      category: AuditCategory.AUTH,
      severity: AuditSeverity.MEDIUM,
      description: `Solicitação de reset de senha para ${email}`,
      ipAddress: ip,
    });
  }

  async logPasswordResetComplete(userId: string, email: string): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.AUTH_PASSWORD_RESET_COMPLETE,
      category: AuditCategory.AUTH,
      severity: AuditSeverity.HIGH,
      description: `Reset de senha concluído para ${email}`,
    });
  }

  // ========== HELPERS DE CRUD ==========

  async logCreate(
    userId: string, 
    email: string,
    resource: string, 
    resourceId: string, 
    metadata?: any
  ): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: `${resource.toUpperCase()}_CREATE` as AuditAction,
      category: this.getCategoryFromResource(resource),
      severity: AuditSeverity.MEDIUM,
      resource,
      resourceId,
      description: `${resource} criado`,
      metadata,
    });
  }

  async logUpdate(
    userId: string,
    email: string,
    resource: string,
    resourceId: string,
    changes: any
  ): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: `${resource.toUpperCase()}_UPDATE` as AuditAction,
      category: this.getCategoryFromResource(resource),
      severity: AuditSeverity.MEDIUM,
      resource,
      resourceId,
      description: `${resource} atualizado`,
      metadata: { changes },
    });
  }

  async logDelete(
    userId: string,
    email: string,
    resource: string,
    resourceId: string,
    metadata?: any
  ): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: `${resource.toUpperCase()}_DELETE` as AuditAction,
      category: this.getCategoryFromResource(resource),
      severity: AuditSeverity.HIGH,
      resource,
      resourceId,
      description: `${resource} deletado`,
      metadata,
    });
  }

  // ========== HELPERS DE SEGURANÇA ==========

  async logPermissionDenied(
    userId: string,
    email: string,
    endpoint: string,
    reason: string
  ): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.PERMISSION_DENIED,
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.HIGH,
      endpoint,
      description: `Permissão negada: ${reason}`,
      success: false,
      errorMessage: reason,
    });
  }

  async logRateLimitExceeded(
    userId: string | undefined,
    email: string | undefined,
    endpoint: string,
    ip: string
  ): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.MEDIUM,
      endpoint,
      ipAddress: ip,
      description: `Rate limit excedido`,
      success: false,
    });
  }

  async logPlanLimitReached(
    userId: string,
    email: string,
    limitType: string
  ): Promise<void> {
    return this.log({
      userId,
      userEmail: email,
      action: AuditAction.PLAN_LIMIT_REACHED,
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.MEDIUM,
      description: `Limite do plano atingido: ${limitType}`,
      metadata: { limitType },
      success: false,
    });
  }

  // ========== HELPERS ADMIN ==========

  async logAdminAction(
    adminId: string,
    adminEmail: string,
    action: AuditAction,
    targetUserId: string,
    metadata?: any
  ): Promise<void> {
    return this.log({
      userId: adminId,
      userEmail: adminEmail,
      action,
      category: AuditCategory.ADMIN,
      severity: AuditSeverity.CRITICAL,
      description: `Ação admin: ${action}`,
      metadata: { targetUserId, ...metadata },
    });
  }

  // ========== QUERY METHODS ==========

  async query(filters: AuditQueryFilters): Promise<PaginatedResult<any>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const skip = (page - 1) * limit;

    // Constrói o where clause
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
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
    if (filters.resource) where.resource = filters.resource;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.success !== undefined) where.success = filters.success;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;
    if (filters.method) where.method = filters.method;
    if (filters.endpoint) where.endpoint = { contains: filters.endpoint };

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
   * Obtém um log específico por ID
   */
  async getById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
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
    });
  }

  /**
   * Obtém estatísticas rápidas dos logs
   */
  async getQuickStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [total, last24hCount, severityStats, categoryStats] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: last24h } } }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        _count: { _all: true },
      }),
      prisma.auditLog.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      last24h: last24hCount,
      bySeverity: severityStats.reduce((acc, curr) => ({ ...acc, [curr.severity]: curr._count._all }), {}),
      byCategory: categoryStats.reduce((acc, curr) => ({ ...acc, [curr.category]: curr._count._all }), {}),
    };
  }

  /**
   * Exporta logs para CSV ou JSON
   * Limitado a 100.000 registros para prevenir DoS
   */
  async export(filters: AuditQueryFilters, format: 'csv' | 'json'): Promise<Buffer | { error: string; maxRecords: number }> {
    const MAX_EXPORT_RECORDS = 100000;
    
    // Primeiro, verifica quantos registros seriam exportados
    const countResult = await this.query({ ...filters, limit: 1 });
    const totalRecords = countResult.pagination.total;
    
    if (totalRecords > MAX_EXPORT_RECORDS) {
      return {
        error: `Exportação limitada a ${MAX_EXPORT_RECORDS} registros. Total encontrado: ${totalRecords}`,
        maxRecords: MAX_EXPORT_RECORDS
      };
    }
    
    // Busca todos os registros (até o limite)
    const result = await this.query({ ...filters, limit: totalRecords });
    
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
  async purge(olderThan: Date): Promise<number> {
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
  async purgeByRetentionPolicy(): Promise<number> {
    const now = new Date();
    let totalDeleted = 0;

    const rules = [
      { severity: AuditSeverity.LOW, days: 90 },
      { severity: AuditSeverity.MEDIUM, days: 180 },
      { severity: AuditSeverity.HIGH, days: 365 },
      { severity: AuditSeverity.CRITICAL, days: 730 },
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
   * Verifica se um log exige alerta imediato e dispara as notificações
   */
  private async checkAndTriggerAlert(log: AuditLogInput): Promise<void> {
    // 1. Alertas CRITICAL - Sempre notifica admins
    if (log.severity === AuditSeverity.CRITICAL) {
      await this.notifyAdmins(
        `🚨 ALERTA CRÍTICO: ${log.action}`,
        `Um evento crítico foi registrado por ${log.userEmail || 'sistema'}: ${log.description}`,
        { action: log.action, category: log.category, resourceId: log.resourceId }
      );
      return;
    }

    // 2. Alertas HIGH de Segurança/Auth
    if (log.severity === AuditSeverity.HIGH && (log.category === AuditCategory.AUTH || log.category === AuditCategory.SYSTEM)) {
      // Exemplo: múltiplas falhas de login (isso seria melhor em um rate limiter, mas aqui registramos o alerta)
      if (log.action === AuditAction.AUTH_LOGIN_FAILED || log.action === AuditAction.PERMISSION_DENIED) {
        await this.notifyAdmins(
          `🛡️ ALERTA DE SEGURANÇA: ${log.action}`,
          `Atividade suspeita detectada para ${log.userEmail || 'IP ' + log.ipAddress}: ${log.description}`,
          { action: log.action, ip: log.ipAddress }
        );
      }
    }
  }

  /**
   * Envia notificação para todos os administradores
   */
  private async notifyAdmins(title: string, message: string, data?: any): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true }
      });

      const adminIds = admins.map(a => a.id);
      if (adminIds.length > 0) {
        await notificationService.notifyBulk(
          adminIds,
          'SYSTEM',
          title,
          message,
          data
        );
      }
      
      // Também loga no console para visibilidade imediata nos logs do container/server
      console.warn(`[AUDIT ALERT] ${title}: ${message}`);
    } catch (error) {
      console.error('[AUDIT SERVICE] Erro ao notificar admins:', error);
    }
  }

  /**
   * Anonimiza logs de um usuário (LGPD)
   */
  async anonymizeUserLogs(userId: string): Promise<number> {
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

  private getCategoryFromResource(resource: string): AuditCategory {
    const resourceUpper = resource.toUpperCase();
    
    if (['BOOK'].includes(resourceUpper)) return AuditCategory.BOOK;
    if (['CHAPTER'].includes(resourceUpper)) return AuditCategory.CHAPTER;
    if (['CHARACTER'].includes(resourceUpper)) return AuditCategory.CHARACTER;
    if (['SPEECH'].includes(resourceUpper)) return AuditCategory.SPEECH;
    if (['POST'].includes(resourceUpper)) return AuditCategory.SOCIAL;
    if (['COMMENT', 'LIKE', 'FOLLOW'].includes(resourceUpper)) return AuditCategory.SOCIAL;
    if (['MESSAGE'].includes(resourceUpper)) return AuditCategory.MESSAGE;
    if (['GROUP'].includes(resourceUpper)) return AuditCategory.GROUP;
    if (['CAMPAIGN'].includes(resourceUpper)) return AuditCategory.CAMPAIGN;
    if (['STORY'].includes(resourceUpper)) return AuditCategory.STORY;
    if (['SUBSCRIPTION', 'LIVRA'].includes(resourceUpper)) return AuditCategory.FINANCIAL;
    
    return AuditCategory.SYSTEM;
  }
}

// Singleton instance
export const auditService = new AuditService();
