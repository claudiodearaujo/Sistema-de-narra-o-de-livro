# 🗓️ LIVRIA - Roadmap de 3 Meses (12 Sprints)

> **Objetivo:** MVP completo para apresentação a investidores  
> **Período:** 12 semanas (3 meses)  
> **Metodologia:** Sprints semanais com entregas incrementais  
> **Estimativa:** 1 desenvolvedor full-time (40h/semana)

---

## 📊 Visão Geral por Milestone

```
┌─────────────────────────────────────────────────────────────────┐
│  SEMANAS 1-3: FUNDAÇÃO                                          │
│  • Banco de dados (migrations)                                  │
│  • Auth com roles                                               │
│  • Infraestrutura (Redis, BullMQ)                              │
│  • Estrutura frontend                                           │
├─────────────────────────────────────────────────────────────────┤
│  SEMANAS 4-7: REDE SOCIAL                                       │
│  • Posts, Feed, Explore                                         │
│  • Curtidas, Comentários                                        │
│  • Follows, Perfis públicos                                     │
│  • Busca global                                                 │
│  • DMs (Mensagens diretas)                                      │
├─────────────────────────────────────────────────────────────────┤
│  SEMANAS 8-10: GAMIFICAÇÃO                                      │
│  • Sistema de Livras completo                                   │
│  • Planos e assinaturas (Stripe)                               │
│  • Conquistas e medalhas                                        │
├─────────────────────────────────────────────────────────────────┤
│  SEMANAS 11-12: GRUPOS & POLIMENTO                              │
│  • Grupos literários                                            │
│  • Campanhas de leitura                                         │
│  • Stories                                                      │
│  • PWA e testes finais                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Sprint 1: Setup e Infraestrutura (Semana 1)

### Objetivos
- ✅ Configurar banco de dados com novos models
- ✅ Atualizar autenticação para suportar roles
- ✅ Setup de Redis para cache de feed
- ✅ Estruturar pastas backend/frontend

### Tarefas Backend (20h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 1.1 | Criar migrations Prisma (Post, Follow, Like, Comment) | 2h | 🔴 |
| 1.2 | Criar migrations (Message, Notification) | 2h | 🔴 |
| 1.3 | Criar migrations (Subscription, Livra*) | 2h | 🔴 |
| 1.4 | Criar migrations (Achievement, Group, Story) | 2h | 🔴 |
| 1.5 | Rodar migrations + seed inicial | 1h | 🔴 |
| 1.6 | Implementar middleware `requireRole` | 2h | 🔴 |
| 1.7 | Implementar middleware `requireFeature` | 2h | 🔴 |
| 1.8 | Configurar Redis (Upstash) | 2h | 🔴 |
| 1.9 | Setup BullMQ com novas filas | 2h | 🟡 |
| 1.10 | Configurar Supabase Storage buckets | 1h | 🟡 |
| 1.11 | Documentar .env.example | 1h | 🟢 |
| 1.12 | Testes unitários de auth | 1h | 🟢 |

### Tarefas Frontend (15h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 1.13 | Criar módulo `/social` com lazy loading | 2h | 🔴 |
| 1.14 | Criar SocialLayoutComponent | 3h | 🔴 |
| 1.15 | Criar componentes base (Header, Sidebar, BottomNav) | 4h | 🔴 |
| 1.16 | Criar post.service.ts | 2h | 🟡 |
| 1.17 | Criar follow.service.ts | 1h | 🟡 |
| 1.18 | Criar notification.service.ts | 2h | 🟡 |
| 1.19 | Setup de navegação entre módulos | 1h | 🟡 |

### Entregas da Semana
- [x] Banco de dados atualizado com todos os models
- [x] Sistema de roles funcionando
- [x] Redis configurado e conectado
- [x] Estrutura base do módulo social

---

## 🎯 Sprint 2: Posts e Feed (Semana 2)

### Objetivos
- ✅ CRUD completo de posts
- ✅ Feed cronológico básico
- ✅ Upload de imagens
- ✅ Componentes de UI para posts

### Tarefas Backend (18h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 2.1 | POST /api/posts - Criar post | 2h | 🔴 |
| 2.2 | GET /api/posts/feed - Feed personalizado | 3h | 🔴 |
| 2.3 | GET /api/posts/explore - Posts em destaque | 2h | 🔴 |
| 2.4 | GET /api/posts/:id - Detalhes do post | 1h | 🔴 |
| 2.5 | DELETE /api/posts/:id - Excluir post | 1h | 🟡 |
| 2.6 | FeedService com cache Redis | 3h | 🔴 |
| 2.7 | Upload de imagens (Supabase Storage) | 2h | 🟡 |
| 2.8 | Validação de tipos de post | 1h | 🟡 |
| 2.9 | Paginação com cursores | 2h | 🟡 |
| 2.10 | Testes de integração | 1h | 🟢 |

### Tarefas Frontend (17h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 2.11 | FeedComponent - página principal | 4h | 🔴 |
| 2.12 | PostCardComponent - card de post | 3h | 🔴 |
| 2.13 | PostComposerComponent - criar post | 3h | 🔴 |
| 2.14 | ImageUploadComponent | 2h | 🟡 |
| 2.15 | InfiniteScrollDirective | 2h | 🟡 |
| 2.16 | TimeAgoPipe | 1h | 🟢 |
| 2.17 | Loading skeletons | 2h | 🟢 |

### Entregas da Semana
- [x] Usuário pode criar posts (texto e imagem)
- [x] Feed mostra posts de quem segue
- [x] Página Explore mostra posts populares
- [x] Infinite scroll funcionando

---

## 🎯 Sprint 3: Interações (Semana 3)

### Objetivos
- ✅ Sistema de curtidas
- ✅ Sistema de comentários
- ✅ Sistema de follows
- ✅ Notificações básicas

### Tarefas Backend (18h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 3.1 | POST/DELETE /api/posts/:id/like | 2h | 🔴 |
| 3.2 | LikeService com atualização de contadores | 2h | 🔴 |
| 3.3 | POST /api/posts/:id/comments | 2h | 🔴 |
| 3.4 | GET /api/posts/:id/comments | 2h | 🔴 |
| 3.5 | Comentários aninhados (replies) | 2h | 🟡 |
| 3.6 | POST/DELETE /api/users/:id/follow | 2h | 🔴 |
| 3.7 | GET /api/users/:id/followers | 1h | 🟡 |
| 3.8 | GET /api/users/:id/following | 1h | 🟡 |
| 3.9 | NotificationService - criar notificações | 2h | 🔴 |
| 3.10 | Trigger notifs em like/comment/follow | 2h | 🔴 |

### Tarefas Frontend (17h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 3.11 | Botão de curtir com animação | 2h | 🔴 |
| 3.12 | CommentListComponent | 3h | 🔴 |
| 3.13 | CommentInputComponent | 2h | 🔴 |
| 3.14 | Botão de seguir/deixar de seguir | 2h | 🔴 |
| 3.15 | UserListComponent (followers/following) | 2h | 🟡 |
| 3.16 | NotificationBell no header | 2h | 🟡 |
| 3.17 | NotificationListComponent | 2h | 🟡 |
| 3.18 | Badge de não lidas | 2h | 🟢 |

### Entregas da Semana
- [x] Curtir/descurtir posts
- [x] Comentar em posts (com replies)
- [x] Seguir/deixar de seguir usuários
- [x] Notificações aparecem no sino

---

## 🎯 Sprint 4: Perfis e Busca (Semana 4)

### Objetivos
- ✅ Perfil público de usuário
- ✅ Busca global
- ✅ Página de detalhes do post

### Tarefas Backend (16h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 4.1 | GET /api/users/:username - Perfil completo | 3h | 🔴 |
| 4.2 | GET /api/users/:username/posts | 2h | 🔴 |
| 4.3 | GET /api/users/:username/books | 2h | 🟡 |
| 4.4 | GET /api/search - Busca global | 4h | 🔴 |
| 4.5 | Full-text search com PostgreSQL | 2h | 🟡 |
| 4.6 | Ranking por relevância | 2h | 🟢 |
| 4.7 | Histórico de buscas (opcional) | 1h | 🟢 |

### Tarefas Frontend (19h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 4.8 | ProfileComponent - página de perfil | 4h | 🔴 |
| 4.9 | ProfileHeaderComponent | 2h | 🔴 |
| 4.10 | ProfileTabsComponent (posts, livros) | 2h | 🔴 |
| 4.11 | Editar perfil (modal ou página) | 3h | 🟡 |
| 4.12 | SearchComponent - página de busca | 3h | 🔴 |
| 4.13 | SearchBarComponent com debounce | 2h | 🔴 |
| 4.14 | SearchResultsComponent (tabs) | 2h | 🟡 |
| 4.15 | PostDetailComponent | 1h | 🟡 |

### Entregas da Semana
- [x] Perfil público com posts e livros
- [x] Editar próprio perfil
- [x] Buscar usuários, livros, posts
- [x] Ver detalhes de post individual

---

## 🎯 Sprint 5: Mensagens Diretas (Semana 5)

### Objetivos
- ✅ DMs funcionando (enviar/receber)
- ✅ Real-time com WebSocket
- ✅ Lista de conversas

### Tarefas Backend (18h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 5.1 | GET /api/messages/conversations | 2h | 🔴 |
| 5.2 | GET /api/messages/:userId | 2h | 🔴 |
| 5.3 | POST /api/messages/:userId | 2h | 🔴 |
| 5.4 | PUT /api/messages/:userId/read | 1h | 🟡 |
| 5.5 | WebSocket: message:new event | 3h | 🔴 |
| 5.6 | WebSocket: presence (online/offline) | 2h | 🟡 |
| 5.7 | Rate limiting de mensagens | 2h | 🔴 |
| 5.8 | Middleware de limite por plano | 2h | 🟡 |
| 5.9 | Testes de WebSocket | 2h | 🟢 |

### Tarefas Frontend (17h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 5.10 | InboxComponent - lista de conversas | 3h | 🔴 |
| 5.11 | ChatComponent - conversa individual | 4h | 🔴 |
| 5.12 | MessageBubbleComponent | 2h | 🔴 |
| 5.13 | WebSocketService (singleton) | 3h | 🔴 |
| 5.14 | Indicador de online/typing | 2h | 🟡 |
| 5.15 | Notificação de nova mensagem | 2h | 🟡 |
| 5.16 | Responsive layout (mobile-first) | 1h | 🟢 |

### Entregas da Semana
- [x] Enviar e receber mensagens em tempo real
- [x] Ver lista de conversas
- [x] Marcar como lida
- [x] Indicador de online

---

## 🎯 Sprint 6: Notificações Real-time (Semana 6)

### Objetivos
- ✅ Notificações em tempo real
- ✅ Central de notificações
- ✅ Push notifications (PWA)

### Tarefas Backend (14h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 6.1 | WebSocket: notification:new event | 2h | 🔴 |
| 6.2 | Refatorar triggers de notificação | 2h | 🔴 |
| 6.3 | GET /api/notifications (paginado) | 2h | 🔴 |
| 6.4 | PUT /api/notifications/read | 1h | 🟡 |
| 6.5 | PUT /api/notifications/:id/read | 1h | 🟡 |
| 6.6 | NotificationWorker (BullMQ) | 3h | 🟡 |
| 6.7 | Web Push setup (VAPID keys) | 2h | 🟢 |
| 6.8 | POST /api/notifications/subscribe | 1h | 🟢 |

### Tarefas Frontend (16h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 6.9 | NotificationsPageComponent | 3h | 🔴 |
| 6.10 | NotificationItemComponent | 2h | 🔴 |
| 6.11 | Real-time updates no sino | 2h | 🔴 |
| 6.12 | Agrupar notificações similares | 2h | 🟡 |
| 6.13 | Service Worker setup | 2h | 🟡 |
| 6.14 | Push notification handling | 2h | 🟡 |
| 6.15 | Permission request UX | 1h | 🟢 |
| 6.16 | Filtros por tipo de notificação | 2h | 🟢 |

### Entregas da Semana
- [x] Notificações aparecem em tempo real
- [x] Central de notificações completa
- [x] Marcar todas como lidas
- [x] Push notifications funcionando

---

## 🎯 Sprint 7: Compartilhamento e Explore (Semana 7)

### Objetivos
- ✅ Compartilhar posts
- ✅ Explore melhorado
- ✅ Posts de livros e previews

### Tarefas Backend (14h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 7.1 | POST /api/posts/:id/share | 2h | 🔴 |
| 7.2 | Contar shares no post original | 1h | 🔴 |
| 7.3 | Explore com algoritmo básico | 3h | 🔴 |
| 7.4 | Trending: posts das últimas 24h | 2h | 🟡 |
| 7.5 | Post tipo BOOK_UPDATE automático | 2h | 🟡 |
| 7.6 | Post tipo CHAPTER_PREVIEW | 2h | 🟡 |
| 7.7 | Post tipo AUDIO_PREVIEW | 2h | 🟢 |

### Tarefas Frontend (16h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 7.8 | Botão de compartilhar | 2h | 🔴 |
| 7.9 | ShareModal (quote ou repost) | 2h | 🔴 |
| 7.10 | SharedPostCard (post dentro de post) | 2h | 🔴 |
| 7.11 | ExploreComponent melhorado | 3h | 🔴 |
| 7.12 | TrendingSection | 2h | 🟡 |
| 7.13 | BookUpdateCard | 2h | 🟡 |
| 7.14 | ChapterPreviewCard | 2h | 🟡 |
| 7.15 | AudioPreviewPlayer | 1h | 🟢 |

### Entregas da Semana
- [x] Compartilhar posts (quote retweet)
- [x] Explore com trending
- [x] Posts automáticos de novos capítulos
- [x] Preview de áudio TTS no feed

---

## 🎯 Sprint 8: Sistema de Livras (Semana 8)

### Objetivos
- ✅ LivraService completo
- ✅ Ganhar/gastar Livras
- ✅ UI de saldo e histórico

### Tarefas Backend (20h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 8.1 | LivraService.getBalance() | 1h | 🔴 |
| 8.2 | LivraService.addLivras() | 2h | 🔴 |
| 8.3 | LivraService.spendLivras() | 2h | 🔴 |
| 8.4 | LivraService.hasSufficientBalance() | 1h | 🔴 |
| 8.5 | LivraService.getTransactionHistory() | 2h | 🔴 |
| 8.6 | LivraConfigService (valores admin) | 2h | 🔴 |
| 8.7 | Middleware checkLivras | 2h | 🔴 |
| 8.8 | Hook: dar Livras em like recebido | 1h | 🟡 |
| 8.9 | Hook: dar Livras em comment recebido | 1h | 🟡 |
| 8.10 | Hook: dar Livras em follow recebido | 1h | 🟡 |
| 8.11 | GET /api/livras/balance | 1h | 🔴 |
| 8.12 | GET /api/livras/transactions | 1h | 🔴 |
| 8.13 | WebSocket: livra:update | 2h | 🟡 |
| 8.14 | Worker de expiração diária | 1h | 🟢 |

### Tarefas Frontend (15h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 8.15 | LivraBalanceComponent (header) | 2h | 🔴 |
| 8.16 | Animação de ganho/perda | 2h | 🟡 |
| 8.17 | LivrasPageComponent | 3h | 🔴 |
| 8.18 | BalanceCardComponent | 2h | 🔴 |
| 8.19 | TransactionListComponent | 2h | 🔴 |
| 8.20 | TransactionFilters | 1h | 🟡 |
| 8.21 | ExpirationWarning | 1h | 🟢 |
| 8.22 | livra.service.ts | 2h | 🔴 |

### Entregas da Semana
- [x] Saldo de Livras visível no header
- [x] Ganhar Livras automaticamente
- [x] Ver histórico de transações
- [x] Middleware bloqueia ações sem saldo

---

## 🎯 Sprint 9: Planos e Pagamentos (Semana 9)

### Objetivos
- ✅ Integração Stripe
- ✅ Checkout de assinatura
- ✅ Compra de Livras avulsas
- ✅ Portal do cliente

### Tarefas Backend (20h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 9.1 | StripeService setup | 2h | 🔴 |
| 9.2 | SubscriptionService | 3h | 🔴 |
| 9.3 | POST /api/subscription/checkout | 2h | 🔴 |
| 9.4 | POST /api/subscription/portal | 1h | 🔴 |
| 9.5 | POST /api/subscription/cancel | 1h | 🟡 |
| 9.6 | GET /api/subscription | 1h | 🔴 |
| 9.7 | Webhook: checkout.session.completed | 2h | 🔴 |
| 9.8 | Webhook: invoice.paid | 2h | 🔴 |
| 9.9 | Webhook: customer.subscription.* | 2h | 🔴 |
| 9.10 | GET /api/livras/packages | 1h | 🟡 |
| 9.11 | POST /api/livras/purchase/:packageId | 2h | 🟡 |
| 9.12 | Crédito mensal de Livras (cron) | 1h | 🟡 |

### Tarefas Frontend (15h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 9.13 | PlansPageComponent | 3h | 🔴 |
| 9.14 | PlanCardComponent | 2h | 🔴 |
| 9.15 | CheckoutFlow (redirect Stripe) | 2h | 🔴 |
| 9.16 | SuccessPageComponent | 2h | 🔴 |
| 9.17 | subscription.service.ts | 2h | 🔴 |
| 9.18 | LivraPackagesComponent | 2h | 🟡 |
| 9.19 | UpgradePromptModal | 2h | 🟡 |

### Entregas da Semana
- [x] Usuário pode assinar Premium/Pro
- [x] Comprar Livras avulsas
- [x] Acessar portal do cliente Stripe
- [x] Webhooks processam pagamentos

---

## 🎯 Sprint 10: Conquistas (Semana 10)

### Objetivos
- ✅ Sistema de conquistas
- ✅ Desbloquear automaticamente
- ✅ UI de conquistas

### Tarefas Backend (14h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 10.1 | AchievementService.checkAndUnlock() | 3h | 🔴 |
| 10.2 | AchievementService.getUserAchievements() | 2h | 🔴 |
| 10.3 | Seed de conquistas iniciais | 2h | 🔴 |
| 10.4 | Hook: verificar conquistas após ações | 3h | 🔴 |
| 10.5 | GET /api/achievements | 1h | 🔴 |
| 10.6 | GET /api/achievements/user/:userId | 1h | 🔴 |
| 10.7 | Notificação de conquista desbloqueada | 2h | 🟡 |

### Tarefas Frontend (16h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 10.8 | AchievementsPageComponent | 3h | 🔴 |
| 10.9 | AchievementCardComponent | 2h | 🔴 |
| 10.10 | AchievementUnlockToast | 2h | 🔴 |
| 10.11 | AchievementCategoriesTabs | 2h | 🟡 |
| 10.12 | ProgressBar para conquistas | 2h | 🟡 |
| 10.13 | Conquistas no perfil público | 2h | 🟡 |
| 10.14 | achievement.service.ts | 2h | 🔴 |
| 10.15 | Animação de unlock | 1h | 🟢 |

### Conquistas para Seed

```
first_post: Primeira Voz - Publicar 1 post → +10 Livras
first_book: Primeiro Livro - Criar 1 livro → +10 Livras
10_chapters: Escritor Dedicado - 10 capítulos → +20 Livras
first_follower: Primeiro Fã - Ganhar 1 seguidor → +5 Livras
10_followers: Começando a Fazer Barulho - 10 seguidores → +10 Livras
100_followers: Influente - 100 seguidores → +50 Livras
50_posts: Voz Ativa - 50 posts → +30 Livras
first_dm: Conversa Iniciada - Enviar 1 DM → +5 Livras
first_campaign: Leitor Voraz - Completar 1 campanha → +50 Livras
join_group: Socializando - Entrar em 1 grupo → +5 Livras
```

### Entregas da Semana
- [x] 10+ conquistas criadas
- [x] Desbloquear automaticamente
- [x] Toast de conquista desbloqueada
- [x] Ver conquistas no perfil

---

## 🎯 Sprint 11: Grupos e Campanhas (Semana 11)

### Objetivos
- ✅ CRUD de grupos
- ✅ Membros e roles
- ✅ Campanhas de leitura

### Tarefas Backend (20h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 11.1 | GET /api/groups (descoberta) | 2h | 🔴 |
| 11.2 | POST /api/groups (criar) | 2h | 🔴 |
| 11.3 | GET /api/groups/:id | 2h | 🔴 |
| 11.4 | PUT /api/groups/:id | 1h | 🟡 |
| 11.5 | DELETE /api/groups/:id | 1h | 🟡 |
| 11.6 | POST /api/groups/:id/join | 1h | 🔴 |
| 11.7 | DELETE /api/groups/:id/leave | 1h | 🔴 |
| 11.8 | GET /api/groups/:id/members | 1h | 🟡 |
| 11.9 | PUT /api/groups/:id/members/:userId/role | 1h | 🟡 |
| 11.10 | GET /api/groups/:groupId/campaigns | 2h | 🔴 |
| 11.11 | POST /api/groups/:groupId/campaigns | 2h | 🔴 |
| 11.12 | GET /api/campaigns/:id/progress | 2h | 🔴 |
| 11.13 | POST /api/campaigns/:id/complete-book | 2h | 🔴 |

### Tarefas Frontend (15h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 11.14 | GroupListComponent | 3h | 🔴 |
| 11.15 | GroupDetailComponent | 3h | 🔴 |
| 11.16 | GroupCreateModal | 2h | 🔴 |
| 11.17 | MemberListComponent | 2h | 🟡 |
| 11.18 | CampaignListComponent | 2h | 🔴 |
| 11.19 | CampaignDetailComponent | 2h | 🔴 |
| 11.20 | CampaignProgressComponent | 1h | 🟡 |

### Entregas da Semana
- [x] Criar/entrar em grupos
- [x] Ver membros e roles
- [x] Criar campanhas de leitura
- [x] Marcar livros como lidos
- [x] Ganhar Livras ao completar

---

## 🎯 Sprint 12: Stories e Polimento (Semana 12)

### Objetivos
- ✅ Stories funcionando
- ✅ PWA completo
- ✅ Testes e bugs
- ✅ Deploy final

### Tarefas Backend (14h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 12.1 | GET /api/stories (seguindo) | 2h | 🔴 |
| 12.2 | POST /api/stories | 2h | 🔴 |
| 12.3 | POST /api/stories/:id/view | 1h | 🔴 |
| 12.4 | DELETE /api/stories/:id | 1h | 🟡 |
| 12.5 | Worker de limpeza (24h) | 2h | 🔴 |
| 12.6 | Limite de stories por plano | 1h | 🟡 |
| 12.7 | Review de segurança | 2h | 🔴 |
| 12.8 | Performance audit | 2h | 🟡 |
| 12.9 | Documentação API (Swagger) | 1h | 🟢 |

### Tarefas Frontend (21h)

| ID | Tarefa | Horas | Prioridade |
|----|--------|-------|------------|
| 12.10 | StoryBarComponent (topo do feed) | 3h | 🔴 |
| 12.11 | StoryViewerComponent (fullscreen) | 4h | 🔴 |
| 12.12 | StoryCreatorComponent | 3h | 🔴 |
| 12.13 | Touch gestures (tap, swipe) | 2h | 🟡 |
| 12.14 | Auto-advance timer | 1h | 🟡 |
| 12.15 | PWA manifest.json | 1h | 🔴 |
| 12.16 | Service Worker caching | 2h | 🔴 |
| 12.17 | Offline fallback page | 1h | 🟡 |
| 12.18 | Install prompt | 1h | 🟡 |
| 12.19 | Bug fixes finais | 2h | 🔴 |
| 12.20 | Deploy produção | 1h | 🔴 |

### Entregas da Semana
- [x] Stories funcionando (criar, ver, expirar)
- [x] PWA instalável
- [x] Performance otimizada
- [x] MVP completo deployado

---

## 📊 Resumo de Horas por Sprint

| Sprint | Backend | Frontend | Total |
|--------|---------|----------|-------|
| 1 - Setup | 20h | 15h | 35h |
| 2 - Posts | 18h | 17h | 35h |
| 3 - Interações | 18h | 17h | 35h |
| 4 - Perfis | 16h | 19h | 35h |
| 5 - DMs | 18h | 17h | 35h |
| 6 - Notificações | 14h | 16h | 30h |
| 7 - Explore | 14h | 16h | 30h |
| 8 - Livras | 20h | 15h | 35h |
| 9 - Pagamentos | 20h | 15h | 35h |
| 10 - Conquistas | 14h | 16h | 30h |
| 11 - Grupos | 20h | 15h | 35h |
| 12 - Stories | 14h | 21h | 35h |
| **TOTAL** | **206h** | **199h** | **405h** |

---

## ✅ Checklist Final do MVP

### Backend
- [ ] 60+ endpoints funcionando
- [ ] Todas as migrations aplicadas
- [ ] WebSocket conectando
- [ ] Redis cache ativo
- [ ] Workers rodando (TTS, notifs, expiration)
- [ ] Stripe webhooks processando
- [ ] Rate limiting configurado
- [ ] Logs e monitoramento

### Frontend
- [ ] Todas as páginas renderizando
- [ ] Navegação fluida
- [ ] Loading states em todas requests
- [ ] Empty states em listas vazias
- [ ] Error handling global
- [ ] Responsive design
- [ ] PWA configurado
- [ ] Push notifications

### Features Completas
- [ ] Criar/editar/deletar posts
- [ ] Feed personalizado
- [ ] Curtir, comentar, compartilhar
- [ ] Seguir/deixar de seguir
- [ ] DMs em tempo real
- [ ] Notificações real-time
- [ ] Busca global
- [ ] Sistema de Livras
- [ ] Planos e pagamentos
- [ ] Grupos literários
- [ ] Campanhas de leitura
- [ ] Conquistas
- [ ] Stories 24h

---

## 🚀 Pós-MVP (Fase 2)

Após validação com investidores:

1. **Vídeos** (3 semanas)
   - Upload e transcodificação (Mux)
   - Player customizado
   - Book trailers

2. **Mobile App** (4 semanas)
   - React Native
   - Push notifications nativas
   - App Store + Play Store

3. **Feed Algorítmico** (2 semanas)
   - ML básico
   - A/B testing

4. **Migração AWS** (2 semanas)
   - RDS/Aurora
   - S3 + CloudFront
   - ECS/Fargate

---

**Documento atualizado em:** 30 de Dezembro de 2025
