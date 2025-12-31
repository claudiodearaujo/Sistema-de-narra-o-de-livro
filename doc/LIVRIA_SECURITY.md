# 🔒 LIVRIA - Guia de Segurança

> **Objetivo:** Boas práticas de segurança para desenvolvimento e produção  
> **Escopo:** Backend, Frontend, Infraestrutura, Dados  
> **Compliance:** LGPD, OWASP Top 10

---

## 📋 Índice

1. [Autenticação e Autorização](#1-autenticação-e-autorização)
2. [Proteção de Dados](#2-proteção-de-dados)
3. [Segurança de API](#3-segurança-de-api)
4. [Segurança do Frontend](#4-segurança-do-frontend)
5. [Infraestrutura](#5-infraestrutura)
6. [LGPD e Privacidade](#6-lgpd-e-privacidade)
7. [Monitoramento e Logging](#7-monitoramento-e-logging)
8. [Checklist de Segurança](#8-checklist-de-segurança)

---

## 1. Autenticação e Autorização

### 1.1 JWT (JSON Web Tokens)

```typescript
// ✅ Configuração Segura de JWT
const JWT_CONFIG = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET, // 256+ bits
    expiresIn: '15m', // Curta duração
    algorithm: 'HS256',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET, // Diferente do access
    expiresIn: '7d',
    algorithm: 'HS256',
  },
};

// ✅ Geração de Token
function generateAccessToken(user: User): string {
  return jwt.sign(
    { 
      sub: user.id,
      role: user.role,
      // NÃO incluir dados sensíveis (email, nome completo)
    },
    JWT_CONFIG.accessToken.secret,
    { 
      expiresIn: JWT_CONFIG.accessToken.expiresIn,
      algorithm: JWT_CONFIG.accessToken.algorithm,
    }
  );
}

// ✅ Refresh Token com Rotação
async function refreshTokens(oldRefreshToken: string) {
  // Verifica se token existe no banco
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
  });
  
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  
  // ROTAÇÃO: Invalida o antigo, cria novo
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  
  const newRefreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: stored.userId,
      expiresAt: addDays(new Date(), 7),
    },
  });
  
  return {
    accessToken: generateAccessToken(user),
    refreshToken: newRefreshToken,
  };
}
```

### 1.2 Senhas

```typescript
// ✅ Hash de Senha com Bcrypt
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Mínimo recomendado

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ✅ Validação de Força de Senha
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validatePasswordStrength(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

// Requisitos:
// - Mínimo 8 caracteres
// - Pelo menos 1 maiúscula
// - Pelo menos 1 minúscula
// - Pelo menos 1 número
// - Pelo menos 1 caractere especial
```

### 1.3 Autorização por Roles

```typescript
// ✅ Middleware de Role
function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (!allowedRoles.includes(user.role)) {
      // Log tentativa de acesso não autorizado
      logger.warn('Unauthorized access attempt', {
        userId: user.id,
        role: user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    next();
  };
}

// ✅ Verificação de Propriedade
async function requireOwnership(req: Request, res: Response, next: NextFunction) {
  const resourceId = req.params.id;
  const userId = req.user.id;
  
  const resource = await prisma.post.findUnique({
    where: { id: resourceId },
    select: { userId: true },
  });
  
  if (!resource) {
    return res.status(404).json({ error: 'Recurso não encontrado' });
  }
  
  // Admin pode acessar qualquer recurso
  if (resource.userId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  next();
}
```

### 1.4 Proteção contra Brute Force

```typescript
// ✅ Rate Limiting para Login
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip, // Por email ou IP
});

app.post('/api/auth/login', loginLimiter, authController.login);

// ✅ Lockout após múltiplas falhas
async function handleFailedLogin(email: string) {
  const key = `login:failed:${email}`;
  const failures = await redis.incr(key);
  await redis.expire(key, 900); // 15 minutos
  
  if (failures >= 5) {
    await redis.set(`login:locked:${email}`, '1', 'EX', 900);
    throw new TooManyRequestsError('Conta temporariamente bloqueada');
  }
}

async function checkAccountLocked(email: string): Promise<boolean> {
  return await redis.exists(`login:locked:${email}`) === 1;
}
```

---

## 2. Proteção de Dados

### 2.1 Sanitização de Input

```typescript
// ✅ Validação com Zod
import { z } from 'zod';

const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Conteúdo não pode ser vazio')
    .max(2000, 'Máximo 2000 caracteres')
    .transform((val) => sanitizeHtml(val)), // Sanitiza HTML
  type: z.enum(['TEXT', 'IMAGE', 'BOOK_UPDATE', 'CHAPTER_PREVIEW']),
  mediaUrl: z.string().url().optional(),
  bookId: z.string().uuid().optional(),
});

// ✅ Sanitização de HTML
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
  allowedTags: [], // Nenhuma tag HTML permitida
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

function sanitize(input: string): string {
  return sanitizeHtml(input, sanitizeOptions);
}

// ✅ Prevenção de SQL Injection (Prisma já protege)
// NUNCA faça isso:
// const query = `SELECT * FROM users WHERE email = '${email}'`;

// Prisma é seguro por padrão:
const user = await prisma.user.findUnique({
  where: { email }, // Parâmetros são escapados
});
```

### 2.2 Criptografia de Dados Sensíveis

```typescript
// ✅ Criptografia de dados sensíveis em repouso
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Uso para dados sensíveis como:
// - Tokens de API de terceiros
// - Dados de pagamento (além do Stripe)
// - Informações pessoais sensíveis
```

### 2.3 Proteção de Dados em Trânsito

```typescript
// ✅ Apenas HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// ✅ Headers de Segurança
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Ajustar conforme necessário
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// ✅ CORS restrito
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://livria.com.br'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 3. Segurança de API

### 3.1 Rate Limiting

```typescript
// ✅ Rate Limiting Global
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalLimiter);

// ✅ Rate Limiting por Endpoint
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});

app.post('/api/posts', strictLimiter, postController.create);
app.post('/api/messages', strictLimiter, messageController.send);

// ✅ Rate Limiting por Usuário (Redis)
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit',
  points: 100, // Número de requests
  duration: 60, // Por minuto
});

async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.user?.id || req.ip;
    await rateLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({ error: 'Muitas requisições. Tente novamente.' });
  }
}
```

### 3.2 Validação de Entrada

```typescript
// ✅ Middleware de Validação
function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Uso
app.post('/api/posts', authenticate, validate(createPostSchema), postController.create);

// ✅ Validação de UUID
const uuidSchema = z.string().uuid();

app.get('/api/posts/:id', (req, res, next) => {
  const result = uuidSchema.safeParse(req.params.id);
  if (!result.success) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
});
```

### 3.3 Proteção contra CSRF

```typescript
// ✅ CSRF Token (para formulários tradicionais)
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

// Para APIs REST com JWT, CSRF é menos crítico pois:
// 1. Token está no header Authorization (não em cookie)
// 2. SameSite cookies

// ✅ SameSite Cookies
app.use(cookieParser());

res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
});
```

### 3.4 Upload Seguro de Arquivos

```typescript
// ✅ Validação de Upload
import multer from 'multer';
import fileType from 'file-type';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
  },
  fileFilter: async (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido'));
    }
    cb(null, true);
  },
});

// ✅ Validação adicional do conteúdo real
async function validateFileContent(buffer: Buffer): Promise<boolean> {
  const type = await fileType.fromBuffer(buffer);
  if (!type || !ALLOWED_MIMES.includes(type.mime)) {
    return false;
  }
  return true;
}

// ✅ Renomear arquivo para evitar path traversal
function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
}
```

---

## 4. Segurança do Frontend

### 4.1 XSS Prevention

```typescript
// ✅ Angular já escapa HTML por padrão
// Evite usar:
// [innerHTML]="userContent" // PERIGOSO

// Use interpolação:
// {{ userContent }} // SEGURO - escapado automaticamente

// ✅ Se precisar de HTML, sanitize
import { DomSanitizer } from '@angular/platform-browser';

@Component({...})
export class PostComponent {
  constructor(private sanitizer: DomSanitizer) {}
  
  getSafeHtml(content: string) {
    // Primeiro sanitize no backend, depois use bypassSecurityTrustHtml
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}

// ✅ Content Security Policy no index.html
// <meta http-equiv="Content-Security-Policy" 
//       content="default-src 'self'; script-src 'self'">
```

### 4.2 Armazenamento Seguro de Tokens

```typescript
// ✅ Access Token - Memória (MELHOR)
// Não persiste entre abas, mais seguro

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;
  
  setAccessToken(token: string) {
    this.accessToken = token;
  }
  
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// ✅ Refresh Token - HttpOnly Cookie (configurado no backend)
// NÃO armazene refresh token em localStorage

// ❌ EVITAR:
// localStorage.setItem('accessToken', token);
// sessionStorage.setItem('accessToken', token);

// ✅ Se precisar persistir entre abas, use sessionStorage com cuidado
// e tokens de curta duração
```

### 4.3 Proteção de Rotas

```typescript
// ✅ Auth Guard
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}

// ✅ Role Guard
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const userRole = this.authService.getUserRole();
    
    if (requiredRoles.includes(userRole)) {
      return true;
    }
    
    this.router.navigate(['/unauthorized']);
    return false;
  }
}

// Uso nas rotas
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN'] }
}
```

---

## 5. Infraestrutura

### 5.1 Variáveis de Ambiente

```bash
# ✅ .env.example (sem valores reais)
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# JWT (gerar com: openssl rand -hex 64)
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Encryption
ENCRYPTION_KEY=your-32-byte-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis
REDIS_URL=redis://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

# ❌ NUNCA commitar .env no Git
# ✅ Adicionar .env ao .gitignore
```

### 5.2 Configuração de Produção

```typescript
// ✅ Configurações por ambiente
const config = {
  development: {
    logLevel: 'debug',
    corsOrigin: '*',
  },
  production: {
    logLevel: 'warn',
    corsOrigin: ['https://livria.com.br'],
  },
};

// ✅ Desabilitar informações de erro em produção
if (process.env.NODE_ENV === 'production') {
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { stack: err.stack });
    
    // Não expor detalhes do erro
    res.status(500).json({ error: 'Erro interno do servidor' });
  });
}

// ✅ Remover headers que expõem tecnologia
app.disable('x-powered-by');
```

### 5.3 Backup e Recovery

```bash
# ✅ Backup automático do PostgreSQL (Supabase faz isso)
# Mas para segurança extra:

# Backup manual
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250101.sql

# ✅ Point-in-Time Recovery (PITR)
# Configurar no Supabase Dashboard

# ✅ Backup de dados do Redis
redis-cli BGSAVE
```

---

## 6. LGPD e Privacidade

### 6.1 Consentimento

```typescript
// ✅ Registro de Consentimento
model UserConsent {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        ConsentType // TERMS, PRIVACY, MARKETING
  version     String   // Versão do documento aceito
  ipAddress   String
  userAgent   String
  acceptedAt  DateTime @default(now())
}

// ✅ Verificação de Consentimento
async function requireConsent(userId: string, type: ConsentType) {
  const consent = await prisma.userConsent.findFirst({
    where: { userId, type },
    orderBy: { acceptedAt: 'desc' },
  });
  
  const currentVersion = await getCurrentTermsVersion(type);
  
  if (!consent || consent.version !== currentVersion) {
    throw new ConsentRequiredError('Atualização dos termos necessária');
  }
}
```

### 6.2 Direito de Acesso (LGPD Art. 18)

```typescript
// ✅ Exportar dados do usuário
async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: true,
      comments: true,
      books: { include: { chapters: true } },
      followers: true,
      following: true,
      messages: true,
      notifications: true,
      livraTransactions: true,
      achievements: true,
    },
  });
  
  // Remover dados sensíveis
  delete user.password;
  
  return {
    exportedAt: new Date(),
    data: user,
  };
}

// Endpoint
app.get('/api/users/me/export', authenticate, async (req, res) => {
  const data = await exportUserData(req.user.id);
  res.json(data);
});
```

### 6.3 Direito de Exclusão (LGPD Art. 18)

```typescript
// ✅ Deletar conta e dados
async function deleteUserAccount(userId: string): Promise<void> {
  // 1. Cancelar assinatura no Stripe
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  
  if (subscription?.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  }
  
  // 2. Deletar arquivos do Storage
  await supabase.storage.from('avatars').remove([`${userId}/*`]);
  await supabase.storage.from('posts').remove([`${userId}/*`]);
  await supabase.storage.from('books').remove([`${userId}/*`]);
  
  // 3. Anonimizar dados que precisam ser mantidos (ex: para auditoria)
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@deleted.livria.com`,
      name: 'Usuário Removido',
      username: `deleted_${userId}`,
      password: '', // Invalidar
      avatar: null,
      bio: null,
      isVerified: false,
    },
  });
  
  // 4. Deletar dados pessoais
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
    prisma.userConsent.deleteMany({ where: { userId } }),
  ]);
  
  // 5. Log de auditoria
  await prisma.auditLog.create({
    data: {
      action: 'ACCOUNT_DELETED',
      userId,
      timestamp: new Date(),
    },
  });
}
```

### 6.4 Minimização de Dados

```typescript
// ✅ Coletar apenas dados necessários
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  username: z.string().min(3).max(30),
  // NÃO coletar: CPF, endereço, telefone (a menos que necessário)
});

// ✅ Retornar apenas dados necessários
function sanitizeUserResponse(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    // NÃO retornar: email, password, createdAt (se não necessário)
  };
}
```

---

## 7. Monitoramento e Logging

### 7.1 Logging Seguro

```typescript
// ✅ Logger configurado
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'creditCard',
      '*.password',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});

// ✅ Log de auditoria para ações sensíveis
async function logAuditEvent(event: AuditEvent) {
  await prisma.auditLog.create({
    data: {
      action: event.action,
      userId: event.userId,
      targetId: event.targetId,
      targetType: event.targetType,
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: new Date(),
    },
  });
}

// Ações a auditar:
// - LOGIN, LOGOUT
// - PASSWORD_CHANGE, PASSWORD_RESET
// - ACCOUNT_CREATED, ACCOUNT_DELETED
// - SUBSCRIPTION_CREATED, SUBSCRIPTION_CANCELLED
// - ADMIN_ACTION
```

### 7.2 Alertas de Segurança

```typescript
// ✅ Detectar comportamento suspeito
async function detectSuspiciousActivity(userId: string, action: string) {
  const recentActions = await redis.lrange(`user:actions:${userId}`, 0, 99);
  
  // Muitas ações em pouco tempo
  if (recentActions.length > 50) {
    await sendSecurityAlert({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      action,
      message: 'Atividade suspeita detectada',
    });
  }
  
  // Login de nova localização
  // Login em horário incomum
  // Múltiplas falhas de autenticação
}

// ✅ Notificar equipe de segurança
async function sendSecurityAlert(alert: SecurityAlert) {
  // Email para equipe
  await emailService.send({
    to: 'security@livria.com.br',
    subject: `[ALERTA] ${alert.type}`,
    body: JSON.stringify(alert, null, 2),
  });
  
  // Slack/Discord webhook
  await fetch(process.env.SECURITY_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(alert),
  });
}
```

---

## 8. Checklist de Segurança

### 8.1 Pré-Deploy

```markdown
## Autenticação
- [ ] Senhas hasheadas com bcrypt (12+ rounds)
- [ ] JWT com tempo de expiração curto (15min)
- [ ] Refresh tokens com rotação
- [ ] Rate limiting em login
- [ ] Lockout após falhas

## API
- [ ] Validação de input com Zod
- [ ] Sanitização de HTML
- [ ] Rate limiting global e por endpoint
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (Helmet)

## Dados
- [ ] HTTPS obrigatório em produção
- [ ] Dados sensíveis criptografados
- [ ] Backups automáticos
- [ ] Logs não contêm dados sensíveis

## Infraestrutura
- [ ] Variáveis de ambiente seguras
- [ ] .env não commitado
- [ ] Secrets em serviço de gestão
- [ ] Firewall configurado
- [ ] SSL/TLS atualizado

## LGPD
- [ ] Termos de uso atualizados
- [ ] Política de privacidade
- [ ] Consentimento registrado
- [ ] Endpoint de exportação de dados
- [ ] Endpoint de exclusão de conta
```

### 8.2 Monitoramento Contínuo

```markdown
## Diário
- [ ] Verificar logs de erro
- [ ] Verificar alertas de segurança
- [ ] Monitorar rate limiting

## Semanal
- [ ] Revisar tentativas de login falhas
- [ ] Verificar atualizações de dependências
- [ ] Analisar padrões de tráfego

## Mensal
- [ ] Revisar permissões de acesso
- [ ] Atualizar dependências
- [ ] Testar backup e restore
- [ ] Revisar políticas de segurança

## Trimestral
- [ ] Penetration testing
- [ ] Revisão de código de segurança
- [ ] Atualizar documentação
- [ ] Treinamento da equipe
```

---

## 📚 Recursos Adicionais

### OWASP
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

### LGPD
- [Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Autoridade Nacional](https://www.gov.br/anpd/)

### Ferramentas
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)

---

**Documento atualizado em:** 30 de Dezembro de 2025  
**Próxima revisão:** Trimestral
