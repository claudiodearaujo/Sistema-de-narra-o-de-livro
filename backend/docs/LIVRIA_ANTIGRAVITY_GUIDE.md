# 🤖 LIVRIA - Guia de Implementação para Antigravity AI

> **Objetivo:** Prompts prontos para gerar código de cada módulo  
> **Formato:** Copie e cole no Antigravity AI ou Claude  
> **Ordem:** Seguir sequencialmente (Sprint por Sprint)

---

## 📋 Como Usar Este Guia

1. **Siga a ordem dos sprints** (não pule etapas)
2. **Copie os prompts** e cole na IA
3. **Revise o código gerado** antes de implementar
4. **Teste cada módulo** antes de avançar
5. **Commit frequentemente** (após cada task)

---

## 🎯 Sprint 1: Setup e Infraestrutura

### Task 1.1: Criar Schema Prisma Completo

```
Context: Estou desenvolvendo a Livria, uma plataforma literária com rede social. 
Já tenho um sistema existente de narração de livros (User, Book, Chapter, Character).
Agora preciso adicionar funcionalidades de rede social e gamificação.

Task: Criar schema Prisma completo para as novas tabelas:

ENUMS:
- UserRole (USER, WRITER, PRO, ADMIN)
- SubscriptionPlan (FREE, PREMIUM, PRO)
- SubscriptionStatus (ACTIVE, CANCELLED, PAST_DUE, TRIALING)
- PostType (TEXT, IMAGE, BOOK_UPDATE, CHAPTER_PREVIEW, AUDIO_PREVIEW, POLL, SHARED)
- NotificationType (LIKE, COMMENT, FOLLOW, MENTION, MESSAGE, BOOK_UPDATE, ACHIEVEMENT, LIVRA_EARNED, SYSTEM)
- LivraTransactionType (EARNED_*, SPENT_*, EXPIRED, ADMIN_ADJUSTMENT)
- AchievementCategory (WRITING, SOCIAL, READING, MILESTONE, SPECIAL)
- GroupRole (OWNER, ADMIN, MODERATOR, MEMBER)
- GroupPrivacy (PUBLIC, PRIVATE, INVITE_ONLY)
- StoryType (TEXT, IMAGE, QUOTE, POLL)

MODELS (rede social):
- Post (id, userId, type, content, mediaUrl, bookId?, chapterId?, sharedPostId?, likeCount, commentCount, shareCount)
- Comment (id, postId, userId, content, parentId?, likeCount)
- Like (id, postId, userId) - unique constraint
- Follow (id, followerId, followingId) - unique constraint

MODELS (comunicação):
- Message (id, senderId, receiverId, content, isRead)
- Notification (id, userId, type, title, message, data, isRead)

MODELS (gamificação):
- Subscription (id, userId unique, plan, status, stripe fields, period dates)
- LivraBalance (id, userId unique, balance, lifetime, spent)
- LivraTransaction (id, userId, type, amount, balance, metadata, expiresAt)
- LivraConfig (id, key unique, value, description)
- LivraPackage (id, name, amount, price, stripePriceId, isActive)

MODELS (conquistas):
- Achievement (id, key unique, category, name, description, icon, livraReward, requirement, isHidden)
- UserAchievement (id, userId, achievementId, unlockedAt) - unique constraint

MODELS (grupos):
- Group (id, name, description, coverUrl, ownerId, privacy, memberCount)
- GroupMember (id, groupId, userId, role, joinedAt) - unique constraint
- ReadingCampaign (id, groupId, name, description, status, startDate, endDate, livraReward)
- CampaignBook (id, campaignId, bookId, chapterId?, orderIndex)
- CampaignProgress (id, campaignId, userId, booksRead, isCompleted, completedAt)

MODELS (stories):
- Story (id, userId, type, content, mediaUrl, expiresAt, viewCount)
- StoryView (id, storyId, userId, viewedAt) - unique constraint

Requirements:
1. Use @prisma/client
2. Integre com models existentes (User, Book, Chapter)
3. Crie índices apropriados para queries frequentes
4. Configure relações e cascades corretamente
5. Use DateTime @default(now()) onde apropriado

Provide the complete schema.prisma file.
```

### Task 1.2: Middleware de Roles

```
Context: Livria tem 4 roles: USER (free), WRITER (premium), PRO, ADMIN.
Preciso de middlewares para proteger rotas por role e features por plano.

Task: Criar 2 middlewares de autorização.

File 1: backend/src/middleware/role.middleware.ts

/**
 * requireRole(...roles: UserRole[]) - middleware factory
 * - Verifica req.user.role (assume authenticate já rodou)
 * - Retorna 403 se role insuficiente
 * - Suporta múltiplos roles: requireRole('WRITER', 'PRO', 'ADMIN')
 */

File 2: backend/src/middleware/plan-limits.middleware.ts

/**
 * requireFeature(feature: keyof PlanLimits) - middleware factory
 * - Busca subscription do user
 * - Verifica se plano permite a feature
 * - Retorna 403 com info de upgrade se não permitido
 * 
 * Features: maxBooks, maxCharactersPerBook, canUseTTS, canUseImageGen, etc.
 */

PlanLimits interface:
{
  maxBooks: number;
  maxCharactersPerBook: number;
  maxStoriesPerDay: number;
  maxDMsPerDay: number;
  maxGroupsOwned: number;
  canUseTTS: boolean;
  canUseImageGen: boolean;
  monthlyLivras: number;
}

PLAN_LIMITS config:
- FREE: maxBooks=0, canUseTTS=false, monthlyLivras=0
- PREMIUM: maxBooks=10, canUseTTS=true, monthlyLivras=100
- PRO: maxBooks=-1 (unlimited), canUseTTS=true, monthlyLivras=500

Use:
- Express types (@types/express)
- Prisma client para buscar subscription
- UserRole e SubscriptionPlan enums

Provide both files with TypeScript and complete implementation.
```

### Task 1.3: Redis Service para Feed Cache

```
Context: Vou usar Redis para cachear feeds de usuários usando Sorted Sets.

Task: Criar serviço de cache Redis.

File: backend/src/lib/redis.ts

Requirements:
1. RedisClient singleton usando ioredis
2. Configuração via env: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
3. Connection pool configurado
4. Graceful shutdown

Functions para feed:
- addToFeed(userId: string, postId: string, timestamp: number): Promise<void>
  // ZADD feed:{userId} {timestamp} {postId}
  
- getFeed(userId: string, page: number, limit: number): Promise<string[]>
  // ZREVRANGE com offset/count
  
- removeFromFeed(userId: string, postId: string): Promise<void>
  // ZREM
  
- invalidateFeed(userId: string): Promise<void>
  // DEL feed:{userId}

Functions auxiliares:
- set(key: string, value: string, ttlSeconds?: number): Promise<void>
- get(key: string): Promise<string | null>
- del(key: string): Promise<void>
- incr(key: string): Promise<number>

Error handling robusto com retry.

Provide complete implementation.
```

### Task 1.4: Estrutura Frontend - Módulo Social

```
Context: Livria é Angular 20 standalone components app.
Já existe módulo /writer, agora preciso criar módulo /social.

Task: Criar estrutura base do módulo social.

File 1: frontend/src/app/features/social/social.routes.ts

Routes (lazy loaded):
- /social/feed → FeedComponent
- /social/explore → ExploreComponent
- /social/profile/:username → ProfileComponent
- /social/post/:id → PostDetailComponent
- /social/search → SearchComponent
- /social/notifications → NotificationsComponent

All routes use AuthGuard (canActivate).

File 2: frontend/src/app/features/social/layouts/social-layout.component.ts

Requirements:
- Standalone component
- Layout com: Header, Sidebar (desktop), Main Content, BottomNav (mobile)
- Responsive: sidebar vira bottom nav em mobile
- Use signals para estado
- Router outlet para conteúdo
- Integra com HeaderComponent existente

Use:
- Angular 20 syntax (standalone, signals)
- @angular/router
- PrimeNG e Tailwindcss já instalado para estilo

Provide both files with complete implementation.
```

---

## 🎯 Sprint 2: Posts e Feed

### Task 2.1: Post Controller

```
Context: Sistema de posts da Livria (rede social para escritores).

Task: Criar PostController completo.

File: backend/src/controllers/post.controller.ts

Endpoints:

1. POST /api/posts - Criar post
   Body: { type: PostType, content: string, mediaUrl?: string, bookId?: string, chapterId?: string }
   Auth: Required
   Validations:
   - type é PostType enum válido
   - content não vazio, max 2000 chars
   - Se BOOK_UPDATE: bookId obrigatório
   - Se CHAPTER_PREVIEW: chapterId obrigatório
   Response 201: Post com user populated

2. GET /api/posts/feed - Feed personalizado
   Query: page=1, limit=20
   Auth: Required
   Logic:
   - Busca IDs de quem o user segue
   - Se usar Redis cache, tenta primeiro
   - Fallback para query direta
   - Ordenado por createdAt DESC
   Response 200: { posts: Post[], pagination: {...} }

3. GET /api/posts/explore - Posts em destaque
   Query: page=1, limit=20
   Auth: Optional
   Logic:
   - Posts públicos das últimas 48h
   - Ordenado por likeCount DESC
   Response 200: { posts: Post[], pagination: {...} }

4. GET /api/posts/:id - Detalhes do post
   Auth: Optional
   Include: user, book, chapter, sharedPost, últimos 3 comentários
   Response 200: Post com relações

5. DELETE /api/posts/:id - Excluir post
   Auth: Required
   Validation: Só autor ou ADMIN pode deletar
   Response 204

Use:
- Express Router
- PostService para lógica
- authenticate middleware
- Zod para validação
- asyncHandler para try/catch

Provide complete implementation.
```

### Task 2.2: Feed Service com Cache

```
Context: Preciso de um serviço que gerencia o feed com cache Redis.

Task: Criar FeedService com fanout-on-write pattern.

File: backend/src/services/feed.service.ts

Methods:

1. getFeed(userId: string, page: number, limit: number)
   - Tenta buscar do Redis (ZREVRANGE)
   - Se não tem cache, busca do banco e popula cache
   - Retorna posts com relações

2. addPostToFollowerFeeds(post: Post)
   - Busca todos os followers do autor
   - Para cada follower, ZADD no seu feed
   - Usa batch para performance
   - Limita feed a 500 posts (ZREMRANGEBYRANK)

3. removePostFromFeeds(postId: string, authorId: string)
   - Remove post dos feeds de todos os followers
   - Remove do cache do autor

4. rebuildFeed(userId: string)
   - Reconstrói feed do zero
   - Busca posts de quem o user segue
   - Popula Redis

5. warmCache(userId: string)
   - Se cache vazio, popula com últimos 100 posts

Strategy:
- Feed TTL: 24 horas
- Max posts per feed: 500
- Fanout limit: 10k followers (acima disso, pull-based)

Use:
- Redis service criado anteriormente
- Prisma para queries
- Promise.all para paralelismo

Provide complete implementation.
```

### Task 2.3: Frontend - Feed Component

```
Context: Página principal do feed social da Livria.

Task: Criar FeedComponent com infinite scroll.

File: frontend/src/app/features/social/pages/feed/feed.component.ts

Requirements:
1. Standalone component com signals
2. Busca posts ao iniciar
3. Infinite scroll (adiciona mais posts ao rolar)
4. Pull-to-refresh (mobile)
5. Loading skeleton enquanto carrega
6. Empty state: "Siga escritores para ver posts"
7. Botão flutuante: "Novo Post"

State (signals):
- posts: Post[] = signal([])
- page: number = signal(1)
- loading: boolean = signal(false)
- hasMore: boolean = signal(true)

Template structure:
```html
<div class="feed-container">
  <app-story-bar /> <!-- stories de quem segue -->
  
  <app-post-composer (postCreated)="onPostCreated($event)" />
  
  @if (loading() && posts().length === 0) {
    <app-loading-skeleton [count]="3" />
  }
  
  @for (post of posts(); track post.id) {
    <app-post-card [post]="post" />
  }
  
  @if (posts().length === 0 && !loading()) {
    <app-empty-state 
      icon="📝" 
      title="Seu feed está vazio"
      message="Siga escritores para ver seus posts"
      actionLabel="Explorar"
      (action)="goToExplore()"
    />
  }
  
  <div #sentinel (intersection)="loadMore()"></div>
</div>
```

Use:
- PostService
- IntersectionObserver para infinite scroll
- PrimeNG components
- Angular 20 control flow (@if, @for)

Provide complete component (ts + html inline template).
```

### Task 2.4: Frontend - Post Card Component

```
Context: Card de post para mostrar no feed.

Task: Criar PostCardComponent reutilizável.

File: frontend/src/app/shared/components/post-card/post-card.component.ts

Requirements:
@Input() post: Post
@Input() showActions: boolean = true

Display:
1. Header: avatar, nome, username, tempo (time ago)
2. Conteúdo: texto com suporte a links e mentions
3. Mídia: imagem (se houver)
4. Preview de livro/capítulo (se tipo BOOK_UPDATE ou CHAPTER_PREVIEW)
5. Post compartilhado inline (se tipo SHARED)
6. Métricas: X curtidas, Y comentários, Z compartilhamentos
7. Ações: Curtir, Comentar, Compartilhar, Mais (...)

Actions:
- Click no avatar/nome: navega para perfil
- Click em curtir: toggle like (otimistic update)
- Click em comentar: abre modal ou navega para post
- Click em compartilhar: abre modal de share
- Click no card: navega para detalhes

Animations:
- Heart pulse ao curtir
- Counter increment animado

Use:
- TimeAgoPipe (criado separadamente)
- LikeService
- Router
- Angular Animations

Provide complete component.
```

---

## 🎯 Sprint 3: Interações

### Task 3.1: Like Controller e Service

```
Context: Sistema de curtidas da Livria.

Task: Criar LikeController e LikeService.

File 1: backend/src/controllers/like.controller.ts

Endpoints:
1. POST /api/posts/:id/like - Curtir post
   Auth: Required
   Logic:
   - Cria like se não existe
   - Incrementa likeCount no post
   - Dispara notificação para autor
   - Dá Livras para autor (se configurado)
   Response 200: { liked: true, likeCount: number }

2. DELETE /api/posts/:id/like - Descurtir
   Auth: Required
   Logic:
   - Remove like se existe
   - Decrementa likeCount
   Response 200: { liked: false, likeCount: number }

File 2: backend/src/services/like.service.ts

Methods:
- like(postId: string, userId: string): Promise<{ liked: boolean, likeCount: number }>
- unlike(postId: string, userId: string): Promise<{ liked: boolean, likeCount: number }>
- isLiked(postId: string, userId: string): Promise<boolean>
- getLikesByPost(postId: string, page: number, limit: number): Promise<PaginatedResult<User>>

Side effects (em like):
- notificationService.create(...)
- livraService.addLivras(autor, 1, 'EARNED_LIKE', { postId, fromUserId })
- achievementService.checkAndUnlock(userId, 'first_like')

Use transactions para atomicidade.

Provide both files.
```

### Task 3.2: Comment Controller e Service

```
Context: Sistema de comentários com suporte a replies.

Task: Criar CommentController e CommentService.

File 1: backend/src/controllers/comment.controller.ts

Endpoints:
1. GET /api/posts/:postId/comments
   Query: page, limit, parentId (null = root comments)
   Auth: Optional
   Response 200: { comments: Comment[], pagination: {...} }

2. POST /api/posts/:postId/comments
   Body: { content: string, parentId?: string }
   Auth: Required
   Validations:
   - content 1-1000 chars
   - parentId se for reply
   Response 201: Comment com user

3. DELETE /api/comments/:id
   Auth: Required (autor ou admin)
   Logic: Soft delete ou cascata de replies
   Response 204

File 2: backend/src/services/comment.service.ts

Methods:
- create(postId, userId, content, parentId?): Comment
- getByPost(postId, page, limit, parentId?): PaginatedResult<Comment>
- delete(commentId, userId): void
- getReplies(commentId, page, limit): PaginatedResult<Comment>

Side effects (em create):
- Incrementa commentCount no post
- Notifica autor do post
- Se reply, notifica autor do comment pai
- Dá Livras para autor do post

Provide both files.
```

### Task 3.3: Follow Controller e Service

```
Context: Sistema de follows (seguir escritores).

Task: Criar FollowController e FollowService.

File 1: backend/src/controllers/follow.controller.ts

Endpoints:
1. POST /api/users/:id/follow
   Auth: Required
   Validation: Não pode seguir a si mesmo
   Response 200: { following: true, followerCount: number }

2. DELETE /api/users/:id/follow
   Auth: Required
   Response 200: { following: false, followerCount: number }

3. GET /api/users/:id/followers
   Query: page, limit
   Auth: Optional
   Response 200: { users: User[], pagination: {...} }

4. GET /api/users/:id/following
   Query: page, limit
   Auth: Optional
   Response 200: { users: User[], pagination: {...} }

5. GET /api/users/:id/follow-status
   Auth: Required
   Response 200: { isFollowing: boolean, isFollowedBy: boolean }

File 2: backend/src/services/follow.service.ts

Methods:
- follow(followerId, followingId): { following: boolean, followerCount: number }
- unfollow(followerId, followingId): { following: boolean, followerCount: number }
- isFollowing(followerId, followingId): boolean
- getFollowers(userId, page, limit): PaginatedResult<User>
- getFollowing(userId, page, limit): PaginatedResult<User>
- getFollowCounts(userId): { followers: number, following: number }

Side effects (em follow):
- Notifica usuário seguido
- Dá Livras para usuário seguido
- Verifica conquistas (first_follower, 10_followers, 100_followers)

Provide both files.
```

### Task 3.4: Frontend - Interações

```
Context: Componentes de interação social.

Task: Criar serviços e componentes de interação.

File 1: frontend/src/app/features/social/services/like.service.ts

Methods:
- like(postId: string): Observable<LikeResponse>
- unlike(postId: string): Observable<LikeResponse>
- isLiked(postId: string): Observable<boolean>

File 2: frontend/src/app/features/social/services/follow.service.ts

Methods:
- follow(userId: string): Observable<FollowResponse>
- unfollow(userId: string): Observable<FollowResponse>
- isFollowing(userId: string): Observable<boolean>
- getFollowers(userId: string, page: number): Observable<PaginatedUsers>
- getFollowing(userId: string, page: number): Observable<PaginatedUsers>

File 3: frontend/src/app/shared/components/like-button/like-button.component.ts

Requirements:
@Input() postId: string
@Input() isLiked: boolean
@Input() likeCount: number
@Output() likedChange = new EventEmitter<boolean>()

Features:
- Optimistic update
- Heart animation on click
- Counter animation
- Debounce para evitar spam

File 4: frontend/src/app/shared/components/follow-button/follow-button.component.ts

Requirements:
@Input() userId: string
@Input() isFollowing: boolean
@Output() followingChange = new EventEmitter<boolean>()

States:
- "Seguir" (default)
- "Seguindo" (quando seguindo)
- "Deixar de seguir" (hover quando seguindo)

Provide all 4 files.
```

---

## 🎯 Sprint 8: Sistema de Livras

### Task 8.1: Livra Service Core

```
Context: Sistema de Livras (moeda virtual da Livria).

Task: Criar LivraService completo.

File: backend/src/services/livra.service.ts

Methods:

1. getBalance(userId: string): Promise<LivraBalance>
   - Retorna LivraBalance ou cria se não existe
   - Include: balance, lifetime, spent

2. addLivras(userId, amount, type, metadata?, expiresAt?): Promise<LivraTransaction>
   - Transação atômica (Prisma transaction)
   - Upsert LivraBalance
   - Incrementa balance e lifetime
   - Cria LivraTransaction
   - Emite WebSocket event
   - Notifica usuário (se amount >= 10)
   - Return: { balance, transaction }

3. spendLivras(userId, amount, type, metadata?): Promise<LivraTransaction>
   - Verifica saldo suficiente (throw se não)
   - Transação atômica
   - Decrementa balance, incrementa spent
   - Cria LivraTransaction (amount negativo)
   - Return: { balance, transaction }

4. hasSufficientLivras(userId, amount): Promise<boolean>
   - Return true se balance >= amount

5. getTransactionHistory(userId, page, limit, type?): Promise<PaginatedResult<LivraTransaction>>
   - Filtro opcional por type
   - Ordenado por createdAt DESC

6. expireLivras(): Promise<number>
   - Worker que roda diariamente
   - Busca transações com expiresAt < now E amount > 0
   - Para cada: subtrai do balance, cria transação EXPIRED
   - Return: número de Livras expiradas

7. grantMonthlyLivras(): Promise<void>
   - Worker que roda no dia 1
   - Busca subscriptions ACTIVE
   - Para PREMIUM: addLivras(100, 'EARNED_PLAN')
   - Para PRO: addLivras(500, 'EARNED_PLAN')

Use:
- Prisma transactions ($transaction)
- WebSocketService para real-time
- NotificationService

Provide complete implementation.
```

### Task 8.2: Livra Config Service

```
Context: Configuração dinâmica de valores de Livras (admin).

Task: Criar LivraConfigService.

File: backend/src/services/livra-config.service.ts

Methods:

1. getValue(key: string): Promise<number>
   - Busca valor do banco
   - Cache em memória (Map) por 5 min
   - Throw se key não existe

2. setValue(key: string, value: number): Promise<void>
   - Atualiza valor no banco
   - Invalida cache

3. getAllConfigs(): Promise<LivraConfig[]>
   - Lista todas as configurações

4. seedDefaults(): Promise<void>
   - Cria configs padrão se não existem

Default configs:
{
  earn_like_received: 1,
  earn_comment_received: 2,
  earn_follow_received: 5,
  earn_campaign_small: 10,
  earn_campaign_medium: 25,
  earn_campaign_large: 50,
  cost_tts_chapter: 10,
  cost_image_generate: 5,
  cost_character_create: 2,
  cost_post_boost: 20,
  livra_expiration_days: 365,
}

Provide complete implementation.
```

### Task 8.3: Livra Check Middleware

```
Context: Middleware para verificar Livras antes de ações que consomem.

Task: Criar checkLivras middleware factory.

File: backend/src/middleware/livra.middleware.ts

/**
 * checkLivras(actionKey: string) => Express middleware
 * 
 * Behavior:
 * 1. Get cost from LivraConfigService (actionKey ex: "cost_tts_chapter")
 * 2. Verify user has sufficient Livras
 * 3. If yes: attach cost to req.livraCost, call next()
 * 4. If no: return 402 Payment Required
 * 
 * Usage:
 * router.post('/chapters/:id/narrate',
 *   authenticate,
 *   checkLivras('cost_tts_chapter'),
 *   generateNarration // req.livraCost disponível
 * );
 */

Error response (402):
{
  error: 'Saldo insuficiente de Livras',
  code: 'INSUFFICIENT_LIVRAS',
  required: 10,
  current: 5,
  deficit: 5,
  action: 'tts_chapter'
}

Provide complete implementation.
```

### Task 8.4: Frontend - Livras Components

```
Context: Componentes de UI para sistema de Livras.

Task: Criar componentes de Livras.

File 1: frontend/src/app/features/livras/services/livra.service.ts

Methods:
- getBalance(): Observable<LivraBalance>
- getTransactions(page, limit, type?): Observable<PaginatedTransactions>
- getPackages(): Observable<LivraPackage[]>
- purchasePackage(packageId): Observable<{ checkoutUrl: string }>

File 2: frontend/src/app/shared/components/livra-balance/livra-balance.component.ts

Requirements:
- Mostra saldo atual com ícone de moeda
- Real-time updates via WebSocket
- Click: navega para /livras
- Tooltip: "Livras são usadas para narração, imagens e mais"
- Animação quando saldo muda (+/-)

State (signals):
- balance: number
- animating: boolean
- changeAmount: number (para mostrar +10 ou -5)

File 3: frontend/src/app/features/livras/pages/livras/livras.component.ts

Tabs:
1. Saldo
   - Balance card grande
   - Lifetime earned / spent
   - Próximas a expirar (warning)

2. Histórico
   - Lista de transações
   - Filtros por tipo
   - Paginação

3. Comprar
   - Cards de pacotes
   - Redirect para Stripe Checkout

Provide all 3 files.
```

---

## 🎯 Sprint 9: Planos e Pagamentos

### Task 9.1: Stripe Service

```
Context: Integração com Stripe para assinaturas e pagamentos.

Task: Criar StripeService.

File: backend/src/services/stripe.service.ts

Setup:
- const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

Methods:

1. createCustomer(user: User): Promise<string>
   - Cria customer no Stripe
   - Retorna customerId

2. createCheckoutSession(userId, plan): Promise<string>
   - Busca ou cria Stripe customer
   - Cria checkout session para subscription
   - Price IDs do env: STRIPE_PREMIUM_PRICE_ID, STRIPE_PRO_PRICE_ID
   - Success URL: /subscription/success?session_id={CHECKOUT_SESSION_ID}
   - Cancel URL: /subscription/plans
   - Retorna checkout URL

3. createPortalSession(customerId): Promise<string>
   - Cria portal session para gerenciar assinatura
   - Retorna portal URL

4. createLivraCheckoutSession(userId, packageId): Promise<string>
   - Checkout para compra única de Livras
   - Mode: 'payment'

5. handleWebhook(payload, signature): Promise<void>
   - Verifica assinatura do webhook
   - Processa eventos:
     - checkout.session.completed → createSubscription()
     - invoice.paid → renewSubscription()
     - customer.subscription.updated → updateSubscription()
     - customer.subscription.deleted → cancelSubscription()

Provide complete implementation with all webhook handlers.
```

### Task 9.2: Subscription Controller

```
Context: Endpoints de assinatura.

Task: Criar SubscriptionController.

File: backend/src/controllers/subscription.controller.ts

Endpoints:

1. GET /api/subscription
   Auth: Required
   Response 200:
   {
     plan: 'PREMIUM',
     status: 'ACTIVE',
     currentPeriodStart: '...',
     currentPeriodEnd: '...',
     cancelAtPeriodEnd: false,
     limits: { maxBooks: 10, canUseTTS: true, ... }
   }

2. POST /api/subscription/checkout
   Auth: Required
   Body: { plan: 'PREMIUM' | 'PRO' }
   Response 200: { checkoutUrl: '...' }

3. POST /api/subscription/portal
   Auth: Required
   Response 200: { portalUrl: '...' }

4. POST /api/subscription/cancel
   Auth: Required
   Response 200: { ... subscription with cancelAtPeriodEnd: true }

5. POST /api/subscription/webhook
   Headers: stripe-signature
   Body: raw
   No auth (Stripe calls directly)
   Response 200/400

Provide complete implementation.
```

### Task 9.3: Frontend - Subscription Flow

```
Context: Fluxo de assinatura no frontend.

Task: Criar páginas de assinatura.

File 1: frontend/src/app/features/subscription/pages/plans/plans.component.ts

Requirements:
- 3 cards: Free, Premium (R$19,90), Pro (R$49,90)
- Feature comparison table
- CTA buttons
- Highlight no plano recomendado
- Badge se usuário já tem plano

File 2: frontend/src/app/features/subscription/pages/success/success.component.ts

Requirements:
- Mensagem de boas-vindas
- Badge do novo plano
- Livras recebidas (animação)
- CTA: "Começar a criar"

File 3: frontend/src/app/features/subscription/services/subscription.service.ts

Methods:
- getCurrent(): Observable<Subscription>
- checkout(plan): Observable<{ checkoutUrl: string }>
- getPortalUrl(): Observable<{ portalUrl: string }>
- cancel(): Observable<Subscription>

Provide all 3 files.
```

---

## 🎯 Sprint 10: Conquistas

### Task 10.1: Achievement Service

```
Context: Sistema de conquistas e medalhas.

Task: Criar AchievementService.

File: backend/src/services/achievement.service.ts

Methods:

1. checkAndUnlock(userId, achievementKey): Promise<Achievement | null>
   - Verifica se user já tem a conquista
   - Se sim, return null
   - Verifica requirements (se aplicável)
   - Cria UserAchievement
   - Adiciona Livras reward
   - Cria notificação
   - Emite WebSocket event
   - Return achievement

2. getUserAchievements(userId): Promise<AchievementWithStatus[]>
   - Retorna todas conquistas
   - Para cada: { ...achievement, unlocked: boolean, unlockedAt?: Date }
   - Ordenado: unlocked first, then by category

3. getAchievementProgress(userId, key): Promise<{ current: number, target: number, percentage: number }>
   - Calcula progresso para conquistas progressivas
   - Ex: 100_followers → { current: 45, target: 100, percentage: 45 }

4. seedAchievements(): Promise<void>
   - Cria conquistas padrão (idempotente)

Default achievements:
```
[
  { key: 'first_post', category: 'SOCIAL', name: 'Primeira Voz', description: 'Publique seu primeiro post', icon: '📢', livraReward: 10 },
  { key: 'first_book', category: 'WRITING', name: 'Primeiro Livro', description: 'Crie seu primeiro livro', icon: '📚', livraReward: 10 },
  { key: '10_chapters', category: 'WRITING', name: 'Escritor Dedicado', description: 'Escreva 10 capítulos', icon: '✍️', livraReward: 20 },
  { key: 'first_follower', category: 'SOCIAL', name: 'Primeiro Fã', description: 'Ganhe seu primeiro seguidor', icon: '⭐', livraReward: 5 },
  { key: '10_followers', category: 'SOCIAL', name: 'Fazendo Barulho', description: 'Alcance 10 seguidores', icon: '🌟', livraReward: 10 },
  { key: '100_followers', category: 'SOCIAL', name: 'Influente', description: 'Alcance 100 seguidores', icon: '👑', livraReward: 50 },
  { key: '50_posts', category: 'SOCIAL', name: 'Voz Ativa', description: 'Publique 50 posts', icon: '💬', livraReward: 30 },
  { key: 'first_campaign', category: 'READING', name: 'Leitor Voraz', description: 'Complete uma campanha de leitura', icon: '📖', livraReward: 50 },
  { key: 'join_group', category: 'SOCIAL', name: 'Socializando', description: 'Entre em um grupo', icon: '👥', livraReward: 5 },
]
```

Provide complete implementation.
```

### Task 10.2: Achievement Hooks

```
Context: Disparar verificação de conquistas após ações.

Task: Adicionar hooks de conquistas nos services existentes.

Locations and checks:

1. PostService.create()
   After creating post:
   ```typescript
   await achievementService.checkAndUnlock(userId, 'first_post');
   const postCount = await prisma.post.count({ where: { userId } });
   if (postCount === 50) {
     await achievementService.checkAndUnlock(userId, '50_posts');
   }
   ```

2. BookService.create()
   After creating book:
   ```typescript
   await achievementService.checkAndUnlock(userId, 'first_book');
   ```

3. ChapterService.create()
   After creating chapter:
   ```typescript
   const chapterCount = await prisma.chapter.count({
     where: { book: { userId } }
   });
   if (chapterCount === 10) {
     await achievementService.checkAndUnlock(userId, '10_chapters');
   }
   ```

4. FollowService.follow()
   After creating follow (for the followed user):
   ```typescript
   const followerCount = await getFollowerCount(followingId);
   if (followerCount === 1) {
     await achievementService.checkAndUnlock(followingId, 'first_follower');
   } else if (followerCount === 10) {
     await achievementService.checkAndUnlock(followingId, '10_followers');
   } else if (followerCount === 100) {
     await achievementService.checkAndUnlock(followingId, '100_followers');
   }
   ```

5. GroupMemberService.join()
   After joining group:
   ```typescript
   await achievementService.checkAndUnlock(userId, 'join_group');
   ```

6. CampaignProgressService.complete()
   After completing campaign:
   ```typescript
   await achievementService.checkAndUnlock(userId, 'first_campaign');
   ```

Provide the modifications needed for each service.
```

### Task 10.3: Frontend - Achievements

```
Context: Página de conquistas.

Task: Criar componentes de conquistas.

File 1: frontend/src/app/features/achievements/pages/list/achievements-list.component.ts

Requirements:
- Grid de conquistas
- Tabs por categoria (Escrita, Social, Leitura, etc)
- Cards: icon, nome, descrição, reward
- Locked: grayscale + cadeado
- Unlocked: colorido + data
- Progress bar para conquistas progressivas
- Stats: X de Y desbloqueadas

File 2: frontend/src/app/shared/components/achievement-card/achievement-card.component.ts

@Input() achievement: AchievementWithStatus
@Input() showProgress: boolean = true

Display:
- Icon (emoji)
- Name
- Description
- Livra reward
- Unlocked date (se desbloqueada)
- Progress bar (se progressiva)

File 3: frontend/src/app/shared/components/achievement-toast/achievement-toast.component.ts

Toast que aparece quando conquista é desbloqueada.

Display:
- Animação de confetti
- Icon grande
- "Conquista Desbloqueada!"
- Nome da conquista
- "+X Livras"
- Auto-dismiss em 5s

Provide all 3 files.
```

---

## 🎯 Sprint 12: Stories

### Task 12.1: Story Controller

```
Context: Stories que expiram em 24h.

Task: Criar StoryController.

File: backend/src/controllers/story.controller.ts

Endpoints:

1. GET /api/stories
   Auth: Required
   Logic:
   - Busca stories de quem o user segue
   - Agrupa por autor
   - Exclui expirados (expiresAt < now)
   - Inclui flag viewed (se user já viu)
   Response 200:
   {
     stories: [
       {
         user: { id, name, username, avatar },
         hasUnviewed: true,
         items: [
           { id, type, content, mediaUrl, viewCount, viewed, createdAt, expiresAt }
         ]
       }
     ]
   }

2. POST /api/stories
   Auth: Required
   Body: { type: StoryType, content?: string, mediaUrl?: string }
   Check: Limite por plano (maxStoriesPerDay)
   Logic:
   - expiresAt = now + 24h
   Response 201: Story

3. GET /api/stories/:id/viewers
   Auth: Required (autor apenas)
   Response 200: { viewers: User[], viewCount: number }

4. POST /api/stories/:id/view
   Auth: Required
   Logic:
   - Cria StoryView (upsert)
   - Incrementa viewCount
   Response 204

5. DELETE /api/stories/:id
   Auth: Required (autor)
   Response 204

Provide complete implementation.
```

### Task 12.2: Story Worker (Cleanup)

```
Context: Worker para limpar stories expirados.

Task: Criar StoryCleanupWorker.

File: backend/src/workers/story-cleanup.worker.ts

Job:
- Roda a cada hora (ou diariamente)
- Busca stories com expiresAt < now
- Deleta stories e views associadas
- Loga quantidade deletada

BullMQ setup:
```typescript
const queue = new Queue('story-cleanup', { connection: redis });

// Scheduler (adiciona job recorrente)
await queue.add('cleanup', {}, {
  repeat: { cron: '0 * * * *' } // A cada hora
});

// Worker
const worker = new Worker('story-cleanup', async (job) => {
  const result = await prisma.story.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
  console.log(`Deleted ${result.count} expired stories`);
  return result.count;
}, { connection: redis });
```

Provide complete implementation.
```

### Task 12.3: Frontend - Story Components

```
Context: Componentes de Stories.

Task: Criar componentes de stories.

File 1: frontend/src/app/features/stories/components/story-bar/story-bar.component.ts

Requirements:
- Barra horizontal no topo do feed
- Círculos com avatar dos usuários
- Borda gradient se tem stories não vistos
- Primeiro: "Seu Story" com +
- Click: abre StoryViewer

File 2: frontend/src/app/features/stories/components/story-viewer/story-viewer.component.ts

Requirements:
- Fullscreen modal
- Progress bar no topo (auto-advance)
- Conteúdo do story (text/image)
- Swipe left/right: próximo/anterior
- Tap sides: próximo/anterior
- Tap hold: pause
- Swipe down: fechar
- Avatar e nome do autor no topo
- View count (para próprios stories)

Gestures:
- Touch events para mobile
- Keyboard para desktop (arrows, esc)

Auto-advance: 5 segundos por story

File 3: frontend/src/app/features/stories/components/story-creator/story-creator.component.ts

Requirements:
- Modal de criação
- Types: Text, Image, Quote
- Text: background color picker, font size
- Image: upload ou camera
- Preview antes de publicar
- Botão publicar

Provide all 3 files.
```

---

## 📦 Checklist Final

Após implementar todos os sprints, use este checklist:

### Backend
```bash
# Testar todos os endpoints
npm run test

# Verificar migrations
npx prisma migrate status

# Verificar seeds
npx prisma db seed

# Testar WebSocket
npm run test:ws

# Verificar workers
npm run workers:status
```

### Frontend
```bash
# Build de produção
ng build --configuration production

# Testar PWA
npx lighthouse http://localhost:4200 --view

# Verificar bundle size
ng build --stats-json && npx webpack-bundle-analyzer dist/stats.json
```

### Features (manual testing)
- [ ] Criar conta e fazer login
- [ ] Criar post com imagem
- [ ] Ver feed personalizado
- [ ] Curtir e comentar
- [ ] Seguir usuário
- [ ] Enviar DM
- [ ] Ver notificações em tempo real
- [ ] Buscar usuários e posts
- [ ] Ver saldo de Livras
- [ ] Assinar plano Premium
- [ ] Criar grupo
- [ ] Criar campanha de leitura
- [ ] Ver conquistas
- [ ] Criar e ver stories
- [ ] Instalar PWA

---

**Total de Tasks:** 60+  
**Prompts neste guia:** 30+  
**Tempo estimado de geração:** 2-3 horas

Boa implementação! 🚀
