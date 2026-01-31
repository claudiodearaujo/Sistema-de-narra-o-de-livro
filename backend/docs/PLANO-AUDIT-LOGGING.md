# Plano de Audit Logging - Sistema Livria

## 1. Visao Geral

### 1.1 Objetivo

Implementar um sistema de audit logging (registro de auditoria) para rastrear todas as acoes significativas realizadas pelos usuarios na plataforma Livria. O sistema deve permitir:

- **Rastreabilidade completa** de acoes de usuarios
- **Investigacao de incidentes** de seguranca
- **Conformidade regulatoria** (LGPD, GDPR)
- **Analise de comportamento** para deteccao de anomalias
- **Suporte ao usuario** com historico detalhado de acoes

### 1.2 Principios

| Principio | Descricao |
|---|---|
| **Imutabilidade** | Logs nunca sao editados ou deletados pelo sistema (apenas expurgados por politica de retencao) |
| **Completude** | Toda acao relevante deve ser registrada sem excecao |
| **Performance** | O logging nao deve impactar a experiencia do usuario (escrita assincrona) |
| **Privacidade** | Dados sensiveis (senhas, tokens) nunca sao logados |
| **Consultabilidade** | Logs devem ser facilmente consultaveis por admins |

---

## 2. Schema do Banco de Dados

### 2.1 Modelo Prisma

```prisma
enum AuditAction {
  // Autenticacao
  AUTH_LOGIN
  AUTH_LOGIN_FAILED
  AUTH_LOGOUT
  AUTH_LOGOUT_ALL
  AUTH_SIGNUP
  AUTH_TOKEN_REFRESH
  AUTH_PASSWORD_CHANGE
  AUTH_PASSWORD_RESET_REQUEST
  AUTH_PASSWORD_RESET_COMPLETE
  AUTH_EMAIL_VERIFY

  // Livros
  BOOK_CREATE
  BOOK_UPDATE
  BOOK_DELETE
  BOOK_VIEW

  // Capitulos
  CHAPTER_CREATE
  CHAPTER_UPDATE
  CHAPTER_DELETE
  CHAPTER_REORDER

  // Personagens
  CHARACTER_CREATE
  CHARACTER_UPDATE
  CHARACTER_DELETE

  // Falas / Dialogos
  SPEECH_CREATE
  SPEECH_UPDATE
  SPEECH_DELETE

  // Narracao e Audio
  NARRATION_START
  NARRATION_COMPLETE
  NARRATION_FAIL
  AUDIO_GENERATE
  AUDIO_DELETE

  // Social - Posts
  POST_CREATE
  POST_UPDATE
  POST_DELETE

  // Social - Comentarios
  COMMENT_CREATE
  COMMENT_DELETE

  // Social - Interacoes
  LIKE_TOGGLE
  FOLLOW_TOGGLE

  // Mensagens
  MESSAGE_SEND
  MESSAGE_DELETE

  // Perfil
  PROFILE_UPDATE
  AVATAR_UPLOAD

  // Grupos
  GROUP_CREATE
  GROUP_UPDATE
  GROUP_DELETE
  GROUP_JOIN
  GROUP_LEAVE
  GROUP_MEMBER_ROLE_CHANGE
  GROUP_MEMBER_REMOVE

  // Campanhas
  CAMPAIGN_CREATE
  CAMPAIGN_UPDATE
  CAMPAIGN_DELETE
  CAMPAIGN_JOIN

  // Stories
  STORY_CREATE
  STORY_DELETE

  // Financeiro / Assinatura
  SUBSCRIPTION_CREATE
  SUBSCRIPTION_CANCEL
  SUBSCRIPTION_UPGRADE
  SUBSCRIPTION_DOWNGRADE
  LIVRA_PURCHASE
  LIVRA_SPEND
  LIVRA_EARN

  // AI
  AI_TEXT_GENERATE
  AI_IMAGE_GENERATE
  AI_TTS_GENERATE

  // Admin
  ADMIN_USER_BAN
  ADMIN_USER_UNBAN
  ADMIN_USER_ROLE_CHANGE
  ADMIN_CONTENT_REMOVE
  ADMIN_CONFIG_CHANGE

  // Sistema
  RATE_LIMIT_EXCEEDED
  PERMISSION_DENIED
  PLAN_LIMIT_REACHED
}

enum AuditCategory {
  AUTH
  BOOK
  CHAPTER
  CHARACTER
  SPEECH
  NARRATION
  SOCIAL
  MESSAGE
  PROFILE
  GROUP
  CAMPAIGN
  STORY
  FINANCIAL
  AI
  ADMIN
  SYSTEM
}

enum AuditSeverity {
  LOW        // Acoes de leitura, visualizacao
  MEDIUM     // Acoes de criacao e edicao
  HIGH       // Acoes de delecao, mudanca de senha
  CRITICAL   // Acoes admin, financeiras, falhas de seguranca
}

model AuditLog {
  id          String         @id @default(uuid())

  // Quem
  userId      String?        // Null para acoes anonimas (login falho)
  user        User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  userEmail   String?        // Snapshot do email no momento da acao
  userRole    UserRole?      // Snapshot do role no momento da acao

  // O que
  action      AuditAction
  category    AuditCategory
  severity    AuditSeverity  @default(MEDIUM)

  // Onde
  resource    String?        // Tipo do recurso: "Book", "Chapter", "Post", etc.
  resourceId  String?        // ID do recurso afetado

  // Como
  method      String?        // HTTP method: GET, POST, PUT, DELETE
  endpoint    String?        // Rota da API: /api/books/:id
  statusCode  Int?           // HTTP status code da resposta

  // Detalhes
  metadata    Json?          // Dados adicionais (campos alterados, valores anteriores)
  description String?        // Descricao legivel da acao

  // Contexto de rede
  ipAddress   String?
  userAgent   String?
  sessionId   String?        // ID da sessao/refresh token

  // Resultado
  success     Boolean        @default(true)
  errorMessage String?       // Mensagem de erro se success = false

  // Tempo
  duration    Int?           // Duracao da operacao em ms
  createdAt   DateTime       @default(now())

  @@index([userId])
  @@index([action])
  @@index([category])
  @@index([severity])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@index([success])
  @@index([ipAddress])
  @@index([userId, createdAt])
  @@index([category, createdAt])
  @@index([action, createdAt])

  @@map("audit_logs")
}
```

### 2.2 Indice Composto para Consultas Frequentes

Os indices foram planejados para otimizar os seguintes cenarios de consulta:

| Consulta | Indice Utilizado |
|---|---|
| Historico de um usuario | `[userId, createdAt]` |
| Filtro por categoria + periodo | `[category, createdAt]` |
| Filtro por acao + periodo | `[action, createdAt]` |
| Busca por recurso especifico | `[resource, resourceId]` |
| Filtro por IP (investigacao) | `[ipAddress]` |
| Filtro por falhas | `[success]` |

### 2.3 Estimativa de Volume

| Cenario | Logs/dia estimados | Armazenamento/mes |
|---|---|---|
| 100 usuarios ativos | ~5.000 | ~50 MB |
| 1.000 usuarios ativos | ~50.000 | ~500 MB |
| 10.000 usuarios ativos | ~500.000 | ~5 GB |

---

## 3. Arquitetura do Sistema

### 3.1 Fluxo de Dados

```
Request HTTP
    |
    v
[Express Middleware] ──> Captura: IP, UserAgent, Method, Endpoint
    |
    v
[Auth Middleware] ──> Captura: userId, email, role
    |
    v
[Controller] ──> Executa acao
    |
    v
[Service Layer] ──> Chama AuditService.log() (assincrono)
    |
    v
[AuditService] ──> Valida e enriquece dados
    |
    v
[Escrita Assincrona] ──> Prisma INSERT (fire-and-forget)
    |
    v
[PostgreSQL - audit_logs]
```

### 3.2 Estrategia de Escrita

A escrita dos logs sera **assincrona e nao-bloqueante** para nao impactar a latencia das respostas:

```typescript
// Fire-and-forget: nao aguarda a escrita do log
auditService.log({...}).catch(err => console.error('[AUDIT] Falha ao gravar log:', err));
```

Para cenarios de alta carga, a escrita pode ser migrada para uma **fila BullMQ** dedicada:

```
[Service] --> [BullMQ: audit-queue] --> [Worker] --> [PostgreSQL]
```

### 3.3 Componentes

```
src/
├── services/
│   └── audit.service.ts          # Servico principal de auditoria
├── middleware/
│   └── audit.middleware.ts        # Middleware Express para captura de contexto
├── controllers/
│   └── audit.controller.ts       # Controller para consulta de logs (admin)
├── routes/
│   └── audit.routes.ts           # Rotas de consulta de logs
└── queues/                       # (Fase 2 - opcional)
    └── audit.queue.ts            # Fila de processamento assincrono
```

---

## 4. Servico de Auditoria (AuditService)

### 4.1 Interface

```typescript
interface AuditLogInput {
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

class AuditService {
  // Registra um evento de auditoria
  async log(input: AuditLogInput): Promise<void>;

  // Consulta logs com filtros e paginacao
  async query(filters: AuditQueryFilters): Promise<PaginatedResult<AuditLog>>;

  // Retorna estatisticas agregadas
  async getStats(filters: AuditStatsFilters): Promise<AuditStats>;

  // Exporta logs para CSV/JSON
  async export(filters: AuditQueryFilters, format: 'csv' | 'json'): Promise<Buffer>;

  // Expurga logs antigos conforme politica de retencao
  async purge(olderThan: Date): Promise<number>;
}
```

### 4.2 Metodos Auxiliares (Helpers)

Para simplificar o uso nos services existentes, serao criados helpers por categoria:

```typescript
class AuditService {
  // === Helpers de Auth ===
  async logLogin(userId: string, email: string, ip: string, userAgent: string): Promise<void>;
  async logLoginFailed(email: string, ip: string, userAgent: string, reason: string): Promise<void>;
  async logLogout(userId: string): Promise<void>;
  async logSignup(userId: string, email: string, ip: string): Promise<void>;
  async logPasswordChange(userId: string): Promise<void>;

  // === Helpers de CRUD ===
  async logCreate(userId: string, resource: string, resourceId: string, metadata?: any): Promise<void>;
  async logUpdate(userId: string, resource: string, resourceId: string, changes: any): Promise<void>;
  async logDelete(userId: string, resource: string, resourceId: string): Promise<void>;

  // === Helpers de Seguranca ===
  async logPermissionDenied(userId: string, endpoint: string, reason: string): Promise<void>;
  async logRateLimitExceeded(userId: string, endpoint: string, ip: string): Promise<void>;

  // === Helpers Admin ===
  async logAdminAction(adminId: string, action: AuditAction, targetUserId: string, metadata?: any): Promise<void>;
}
```

### 4.3 Sanitizacao de Dados

O servico DEVE sanitizar dados sensiveis antes de gravar:

```typescript
const SENSITIVE_FIELDS = [
  'password', 'senha', 'token', 'refreshToken', 'accessToken',
  'secret', 'apiKey', 'creditCard', 'cvv', 'cardNumber',
  'stripeCustomerId', 'stripeSubscriptionId'
];

function sanitizeMetadata(data: Record<string, any>): Record<string, any> {
  // Substitui valores sensiveis por '[REDACTED]'
  // Limita profundidade do objeto a 3 niveis
  // Limita tamanho total do JSON a 10KB
}
```

---

## 5. Middleware de Auditoria

### 5.1 Middleware de Contexto

Captura informacoes do request para uso posterior nos services:

```typescript
// audit.middleware.ts

export function auditContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Anexa contexto de auditoria ao request
    req.auditContext = {
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
      method: req.method,
      endpoint: req.originalUrl,
      startTime,
    };

    // Intercepta o fim da resposta para capturar statusCode e duracao
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      req.auditContext.statusCode = res.statusCode;
      req.auditContext.duration = Date.now() - startTime;
      return originalEnd.apply(res, args);
    };

    next();
  };
}
```

### 5.2 Extensao do Request

```typescript
// types/express.d.ts

declare namespace Express {
  interface Request {
    auditContext?: {
      ipAddress?: string;
      userAgent?: string;
      method: string;
      endpoint: string;
      statusCode?: number;
      startTime: number;
      duration?: number;
    };
  }
}
```

### 5.3 Registro no Express

```typescript
// index.ts

import { auditContext } from './middleware/audit.middleware';

// Registrar ANTES dos outros middlewares
app.use(auditContext());
```

---

## 6. Integracao com Services Existentes

### 6.1 Exemplo: AuthService

```typescript
// services/auth.service.ts

import { auditService } from './audit.service';

class AuthService {
  async login(email: string, password: string, auditCtx: AuditContext) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        await auditService.logLoginFailed(email, auditCtx.ipAddress, auditCtx.userAgent, 'Usuario nao encontrado');
        throw new Error('Credenciais invalidas');
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        await auditService.logLoginFailed(email, auditCtx.ipAddress, auditCtx.userAgent, 'Senha incorreta');
        throw new Error('Credenciais invalidas');
      }

      // ... gera tokens ...

      // Log de sucesso (fire-and-forget)
      auditService.logLogin(user.id, user.email, auditCtx.ipAddress, auditCtx.userAgent)
        .catch(err => console.error('[AUDIT]', err));

      return { accessToken, refreshToken };
    } catch (error) {
      throw error;
    }
  }
}
```

### 6.2 Exemplo: BooksService

```typescript
// services/books.service.ts

import { auditService } from './audit.service';

class BooksService {
  async create(userId: string, data: CreateBookDto, auditCtx: AuditContext) {
    const book = await prisma.book.create({ data: { ...data, userId } });

    auditService.logCreate(userId, 'Book', book.id, {
      title: data.title,
      author: data.author,
    }).catch(err => console.error('[AUDIT]', err));

    return book;
  }

  async update(userId: string, bookId: string, data: UpdateBookDto, auditCtx: AuditContext) {
    const before = await prisma.book.findUnique({ where: { id: bookId } });
    const book = await prisma.book.update({ where: { id: bookId }, data });

    auditService.logUpdate(userId, 'Book', bookId, {
      before: { title: before.title, description: before.description },
      after: { title: book.title, description: book.description },
    }).catch(err => console.error('[AUDIT]', err));

    return book;
  }

  async delete(userId: string, bookId: string, auditCtx: AuditContext) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    await prisma.book.delete({ where: { id: bookId } });

    auditService.logDelete(userId, 'Book', bookId, {
      title: book.title,
      author: book.author,
    }).catch(err => console.error('[AUDIT]', err));
  }
}
```

### 6.3 Mapeamento de Acoes por Service

| Service | Acoes a Logar |
|---|---|
| `auth.service.ts` | LOGIN, LOGIN_FAILED, LOGOUT, LOGOUT_ALL, SIGNUP, TOKEN_REFRESH, PASSWORD_CHANGE, PASSWORD_RESET_REQUEST, PASSWORD_RESET_COMPLETE, EMAIL_VERIFY |
| `books.service.ts` | BOOK_CREATE, BOOK_UPDATE, BOOK_DELETE |
| `chapters.service.ts` | CHAPTER_CREATE, CHAPTER_UPDATE, CHAPTER_DELETE, CHAPTER_REORDER |
| `characters.service.ts` | CHARACTER_CREATE, CHARACTER_UPDATE, CHARACTER_DELETE |
| `speeches.service.ts` | SPEECH_CREATE, SPEECH_UPDATE, SPEECH_DELETE |
| `narration.service.ts` | NARRATION_START, NARRATION_COMPLETE, NARRATION_FAIL |
| `post.service.ts` | POST_CREATE, POST_UPDATE, POST_DELETE |
| `comment.service.ts` | COMMENT_CREATE, COMMENT_DELETE |
| `like.service.ts` | LIKE_TOGGLE |
| `follow.service.ts` | FOLLOW_TOGGLE |
| `message.service.ts` | MESSAGE_SEND, MESSAGE_DELETE |
| `profile.service.ts` | PROFILE_UPDATE, AVATAR_UPLOAD |
| `group.service.ts` | GROUP_CREATE, GROUP_UPDATE, GROUP_DELETE, GROUP_JOIN, GROUP_LEAVE, GROUP_MEMBER_ROLE_CHANGE, GROUP_MEMBER_REMOVE |
| `campaign.service.ts` | CAMPAIGN_CREATE, CAMPAIGN_UPDATE, CAMPAIGN_DELETE, CAMPAIGN_JOIN |
| `story.service.ts` | STORY_CREATE, STORY_DELETE |
| `subscription.service.ts` | SUBSCRIPTION_CREATE, SUBSCRIPTION_CANCEL, SUBSCRIPTION_UPGRADE, SUBSCRIPTION_DOWNGRADE |
| `livra.service.ts` | LIVRA_PURCHASE, LIVRA_SPEND, LIVRA_EARN |
| `ai.service.ts` | AI_TEXT_GENERATE, AI_IMAGE_GENERATE, AI_TTS_GENERATE |
| `rate-limit.middleware.ts` | RATE_LIMIT_EXCEEDED |
| `role.middleware.ts` | PERMISSION_DENIED |
| `plan-limits.middleware.ts` | PLAN_LIMIT_REACHED |

---

## 7. API de Consulta (Admin)

### 7.1 Endpoints

```
GET    /api/admin/audit-logs           # Listar logs com filtros
GET    /api/admin/audit-logs/:id       # Detalhe de um log
GET    /api/admin/audit-logs/stats     # Estatisticas agregadas
GET    /api/admin/audit-logs/export    # Exportar logs (CSV/JSON)
GET    /api/admin/audit-logs/user/:id  # Logs de um usuario especifico
DELETE /api/admin/audit-logs/purge     # Expurgar logs antigos (super admin)
```

### 7.2 Filtros de Consulta

```typescript
interface AuditQueryFilters {
  // Filtros principais
  userId?: string;
  action?: AuditAction | AuditAction[];
  category?: AuditCategory | AuditCategory[];
  severity?: AuditSeverity | AuditSeverity[];
  resource?: string;
  resourceId?: string;
  success?: boolean;

  // Filtros de periodo
  startDate?: Date;   // default: 30 dias atras
  endDate?: Date;     // default: agora

  // Filtros de contexto
  ipAddress?: string;
  method?: string;
  endpoint?: string;

  // Busca textual
  search?: string;    // Busca em description e metadata

  // Paginacao
  page?: number;      // default: 1
  limit?: number;     // default: 50, max: 200

  // Ordenacao
  sortBy?: 'createdAt' | 'severity' | 'action';
  sortOrder?: 'asc' | 'desc';  // default: desc
}
```

### 7.3 Formato de Resposta

```typescript
interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: AuditQueryFilters; // Filtros aplicados
}

interface AuditStatsResponse {
  period: { start: Date; end: Date };
  totalLogs: number;
  byCategory: Record<AuditCategory, number>;
  byAction: Record<AuditAction, number>;  // Top 20
  bySeverity: Record<AuditSeverity, number>;
  failureRate: number;                     // Percentual de success=false
  topUsers: Array<{ userId: string; email: string; count: number }>; // Top 10
  topEndpoints: Array<{ endpoint: string; count: number }>;          // Top 10
  timeline: Array<{ date: string; count: number }>;                  // Por dia
}
```

### 7.4 Protecao das Rotas

```typescript
// routes/audit.routes.ts

router.use(authenticate);
router.use(requireAdmin);
router.use(rateLimit('api:general'));

router.get('/', auditController.list);
router.get('/stats', auditController.stats);
router.get('/export', auditController.export);
router.get('/user/:userId', auditController.byUser);
router.get('/:id', auditController.detail);
router.delete('/purge', requireRole('SUPER_ADMIN'), auditController.purge);
```

---

## 8. Politica de Retencao de Dados

### 8.1 Periodos de Retencao

| Severidade | Periodo de Retencao | Justificativa |
|---|---|---|
| LOW | 90 dias | Acoes de leitura, baixo valor investigativo |
| MEDIUM | 180 dias | Acoes de criacao/edicao |
| HIGH | 365 dias | Delecoes, mudancas de senha |
| CRITICAL | 730 dias (2 anos) | Acoes admin, financeiras, seguranca |

### 8.2 Job de Expurgo

```typescript
// Executar diariamente via cron job ou BullMQ repeatable job

async function purgeExpiredLogs() {
  const now = new Date();

  const rules = [
    { severity: 'LOW',      days: 90  },
    { severity: 'MEDIUM',   days: 180 },
    { severity: 'HIGH',     days: 365 },
    { severity: 'CRITICAL', days: 730 },
  ];

  for (const rule of rules) {
    const cutoff = new Date(now.getTime() - rule.days * 24 * 60 * 60 * 1000);

    const { count } = await prisma.auditLog.deleteMany({
      where: {
        severity: rule.severity,
        createdAt: { lt: cutoff },
      },
    });

    console.log(`[AUDIT PURGE] Removidos ${count} logs ${rule.severity} anteriores a ${cutoff.toISOString()}`);
  }
}
```

### 8.3 Agendamento

```typescript
// Via BullMQ repeatable job
auditQueue.add('purge-expired-logs', {}, {
  repeat: { cron: '0 3 * * *' }, // Todo dia as 3h da manha
});
```

---

## 9. Seguranca

### 9.1 Dados que NUNCA devem ser logados

- Senhas (plain text ou hash)
- Tokens de acesso (JWT, refresh tokens)
- Chaves de API
- Dados de cartao de credito
- Tokens de verificacao/reset

### 9.2 Protecao contra Log Injection

```typescript
function sanitizeString(input: string): string {
  // Remove caracteres de controle
  // Limita tamanho a 1000 caracteres
  // Escapa caracteres especiais
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 1000);
}
```

### 9.3 Acesso aos Logs

- Somente usuarios com role `ADMIN` podem consultar logs
- A acao de consultar logs tambem e auditada
- Exportacao de logs gera um log de auditoria adicional
- Expurgo manual requer role `SUPER_ADMIN` (a ser implementado)

### 9.4 Integridade

- Logs sao imutaveis (sem UPDATE na tabela)
- A coluna `id` usa UUID v4 para evitar enumeracao
- Timestamps sao gerados pelo banco (`@default(now())`)

---

## 10. Monitoramento e Alertas

### 10.1 Metricas a Monitorar

| Metrica | Alerta |
|---|---|
| Falhas de login consecutivas (mesmo IP) | > 5 em 10 min |
| Falhas de login consecutivas (mesmo email) | > 3 em 5 min |
| Acoes CRITICAL por minuto | > 10 |
| Erros de escrita de audit log | Qualquer ocorrencia |
| Taxa de falhas (success=false) | > 20% em 5 min |
| PERMISSION_DENIED por usuario | > 10 em 10 min |
| RATE_LIMIT_EXCEEDED por IP | > 50 em 10 min |

### 10.2 Implementacao de Alertas (Fase Futura)

```typescript
// Verificacao via BullMQ repeatable job (a cada 5 minutos)
async function checkAuditAlerts() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Verifica tentativas de login falhas
  const failedLogins = await prisma.auditLog.groupBy({
    by: ['ipAddress'],
    where: {
      action: 'AUTH_LOGIN_FAILED',
      createdAt: { gte: fiveMinAgo },
    },
    _count: true,
    having: { ipAddress: { _count: { gt: 5 } } },
  });

  for (const entry of failedLogins) {
    // Envia notificacao para admins
    await notificationService.notifyAdmins({
      type: 'SECURITY_ALERT',
      title: 'Tentativas de login suspeitas',
      message: `IP ${entry.ipAddress}: ${entry._count} tentativas falhas nos ultimos 5 minutos`,
    });
  }
}
```

---

## 11. Fases de Implementacao

### Fase 1 - Fundacao (Prioridade Alta)

**Escopo:**
- [ ] Criar modelo `AuditLog` no schema Prisma
- [ ] Executar migracao do banco de dados
- [ ] Implementar `AuditService` com metodo `log()` e helpers
- [ ] Implementar `auditContext()` middleware
- [ ] Implementar sanitizacao de dados sensiveis
- [ ] Integrar auditoria no `AuthService` (login, logout, signup, password)
- [ ] Testes unitarios do `AuditService`

**Arquivos a criar/modificar:**
```
CRIAR:
  src/services/audit.service.ts
  src/middleware/audit.middleware.ts
  src/__tests__/services/audit.service.test.ts

MODIFICAR:
  prisma/schema.prisma              (adicionar modelo AuditLog + enums)
  src/services/auth.service.ts      (integrar audit logging)
  src/middleware/index.ts            (exportar audit middleware)
  src/index.ts                      (registrar audit middleware)
  src/types/express.d.ts            (estender Request)
```

### Fase 2 - Cobertura Completa (Prioridade Alta)

**Escopo:**
- [ ] Integrar auditoria em todos os services de CRUD (books, chapters, characters, speeches)
- [ ] Integrar auditoria nos services sociais (posts, comments, likes, follows)
- [ ] Integrar auditoria nos services de mensagens
- [ ] Integrar auditoria nos services de grupos e campanhas
- [ ] Integrar auditoria nos services financeiros (subscription, livra)
- [ ] Integrar auditoria nos services de AI
- [ ] Integrar auditoria nos middlewares de seguranca (rate-limit, role, plan-limits)

**Arquivos a modificar:**
```
src/services/books.service.ts
src/services/chapters.service.ts
src/services/characters.service.ts
src/services/speeches.service.ts
src/services/post.service.ts
src/services/comment.service.ts
src/services/like.service.ts
src/services/follow.service.ts
src/services/message.service.ts
src/services/profile.service.ts
src/services/group.service.ts
src/services/campaign.service.ts
src/services/story.service.ts
src/services/subscription.service.ts
src/services/livra.service.ts
src/services/ai.service.ts
src/middleware/rate-limit.middleware.ts
src/middleware/role.middleware.ts
src/middleware/plan-limits.middleware.ts
```

### Fase 3 - API de Consulta Admin (Prioridade Media)

**Escopo:**
- [ ] Implementar `AuditController` com listagem, filtros e paginacao
- [ ] Implementar endpoint de estatisticas agregadas
- [ ] Implementar exportacao CSV/JSON
- [ ] Implementar rotas protegidas por ADMIN
- [ ] Testes dos endpoints

**Arquivos a criar:**
```
src/controllers/audit.controller.ts
src/routes/audit.routes.ts
src/__tests__/controllers/audit.controller.test.ts
```

### Fase 4 - Retencao e Performance (Prioridade Media)

**Escopo:**
- [ ] Implementar job de expurgo automatico com BullMQ
- [ ] Configurar politicas de retencao por severidade
- [ ] Otimizar queries com indices parciais se necessario
- [ ] Avaliar necessidade de particao da tabela por data

**Arquivos a criar/modificar:**
```
CRIAR:
  src/queues/audit.queue.ts

MODIFICAR:
  prisma/schema.prisma    (indices adicionais se necessario)
```

### Fase 5 - Monitoramento e Alertas (Prioridade Baixa)

**Escopo:**
- [ ] Implementar job de verificacao de anomalias
- [ ] Integrar com sistema de notificacoes para admins
- [ ] Dashboard de metricas de auditoria (frontend)
- [ ] Alertas em tempo real via WebSocket para admins

---

## 12. Consideracoes de Performance

### 12.1 Estrategias

| Estrategia | Descricao |
|---|---|
| **Fire-and-forget** | Escrita assincrona sem `await` no fluxo principal |
| **Batch insert** | Agrupar logs em lote a cada 5 segundos (fase futura) |
| **Indices parciais** | Criar indices apenas para logs recentes se necessario |
| **Particionamento** | Particionar tabela por mes quando volume ultrapassar 10M registros |
| **Archiving** | Mover logs antigos para storage frio (S3) antes do expurgo |

### 12.2 Impacto Estimado

- **Latencia adicional por request:** < 1ms (fire-and-forget)
- **Carga adicional no banco:** ~1 INSERT por request (baixo impacto)
- **Espaco em disco:** Depende do volume de usuarios (ver secao 2.3)

---

## 13. Conformidade LGPD

### 13.1 Requisitos

| Requisito LGPD | Como Atendemos |
|---|---|
| Direito de acesso | Endpoint para usuario consultar seus proprios logs |
| Direito de exclusao | Anonimizacao de logs (substituir userId por hash) em vez de delecao |
| Base legal | Legitimo interesse (seguranca) e obrigacao legal |
| Minimizacao | Apenas dados necessarios sao coletados |
| Retencao limitada | Politica de expurgo automatico |

### 13.2 Anonimizacao (para requisicoes de exclusao de conta)

```typescript
async function anonymizeUserLogs(userId: string): Promise<void> {
  await prisma.auditLog.updateMany({
    where: { userId },
    data: {
      userId: null,
      userEmail: '[ANONYMIZED]',
      ipAddress: null,
      userAgent: null,
      metadata: null,
    },
  });
}
```

---

## 14. Testes

### 14.1 Testes Unitarios

```typescript
// __tests__/services/audit.service.test.ts

describe('AuditService', () => {
  describe('log()', () => {
    it('deve criar um registro de auditoria com dados validos');
    it('deve sanitizar campos sensiveis no metadata');
    it('deve definir severity padrao como MEDIUM');
    it('deve aceitar userId null para acoes anonimas');
    it('deve limitar tamanho do metadata a 10KB');
    it('nao deve lancar erro mesmo se a escrita falhar');
  });

  describe('logLogin()', () => {
    it('deve criar log com action AUTH_LOGIN e severity MEDIUM');
    it('deve incluir IP e userAgent');
  });

  describe('logLoginFailed()', () => {
    it('deve criar log com action AUTH_LOGIN_FAILED e severity HIGH');
    it('deve incluir motivo da falha');
  });

  describe('query()', () => {
    it('deve retornar logs paginados');
    it('deve filtrar por userId');
    it('deve filtrar por action');
    it('deve filtrar por periodo');
    it('deve filtrar por severity');
    it('deve ordenar por createdAt desc por padrao');
  });

  describe('sanitizeMetadata()', () => {
    it('deve remover campo password');
    it('deve remover campo token');
    it('deve manter campos nao-sensiveis');
    it('deve limitar profundidade a 3 niveis');
  });

  describe('purge()', () => {
    it('deve remover logs anteriores a data especificada');
    it('deve respeitar politica de retencao por severidade');
  });
});
```

### 14.2 Testes de Integracao

```typescript
describe('Audit Integration', () => {
  it('deve criar log de auditoria quando usuario faz login');
  it('deve criar log quando um livro e criado');
  it('deve criar log quando um livro e deletado');
  it('deve criar log quando permissao e negada');
  it('deve criar log quando rate limit e excedido');
  it('endpoint GET /api/admin/audit-logs deve retornar logs paginados');
  it('endpoint GET /api/admin/audit-logs deve rejeitar usuario nao-admin');
});
```

---

## 15. Resumo Executivo

| Item | Detalhes |
|---|---|
| **Tabela** | `audit_logs` com 20 colunas e 10 indices |
| **Enums** | `AuditAction` (60+ acoes), `AuditCategory` (16), `AuditSeverity` (4) |
| **Arquivos novos** | 5 (service, middleware, controller, routes, queue) |
| **Arquivos modificados** | ~25 (todos os services + middlewares + schema) |
| **Fases** | 5 fases, da fundacao ao monitoramento |
| **Retencao** | 90 dias (LOW) a 2 anos (CRITICAL) |
| **Performance** | Fire-and-forget, < 1ms overhead por request |
| **Seguranca** | Sanitizacao, imutabilidade, acesso restrito a ADMIN |
| **Conformidade** | LGPD/GDPR com anonimizacao e expurgo automatico |
