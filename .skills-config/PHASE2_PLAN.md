# 🚀 FASE 2: CRIAR NOVAS SKILLS ESPECÍFICAS DO PROJETO

**Status:** 📋 PLANEJADO
**Projeto:** Livrya - Sistema de Narração de Livro
**Objetivo:** Desenvolver 10 skills tailored para as necessidades específicas do projeto

---

## 📊 Resumo Executivo

Na Fase 2, criaremos skills específicos para o Livrya que cobrem:
- **Audio & TTS** - Processamento de áudio e síntese de fala
- **Real-time Communication** - WebSocket e gerenciamento de salas
- **Social Features** - Feed, notificações, gamificação
- **Business Logic** - Pagamentos, autenticação, assinaturas

**Total:** 10 novas skills
**Esforço Estimado:** 2-3 sprints

---

## 🎯 Skills a Criar

### 1️⃣ Audio Processing & Streaming

#### Skill: `livrya-audio-processing`
**Propósito:** Padrões de processamento de áudio com FFmpeg

**Conteúdo:**
- FFmpeg command patterns para Livrya
- Otimização de qualidade vs. tamanho
- Compressão de áudio (MP3, AAC, OGG)
- Extração de metadados de áudio
- Normalização de volume
- Conversão de formatos

**Exemplos:**
```typescript
// Converter narração para diferentes formatos
ffmpeg -i input.wav -codec:a libmp3lame -q:a 4 output.mp3
ffmpeg -i input.wav -codec:a aac -b:a 128k output.m4a

// Normalizar volume para consistência
ffmpeg -i input.mp3 -af volumedetect -f null - # Detectar
ffmpeg -i input.mp3 -af volume=0.8 output.mp3 # Normalizar
```

**Relacionado a:** Backend service de processamento de áudio

---

#### Skill: `livrya-tts-optimization`
**Propósito:** Otimização de síntese de fala com Gemini TTS

**Conteúdo:**
- Caching de resultados TTS (Redis)
- Estratégias de fallback quando Gemini falha
- Seleção de vozes por persona
- Rate limiting de requisições TTS
- Batch processing para múltiplos capítulos
- Monitoring de custo de API

**Exemplos:**
```typescript
// Caching com Redis
const cacheKey = `tts:${textHash}:${voiceId}`;
let audio = await redis.get(cacheKey);
if (!audio) {
  audio = await geminiTTS.synthesize(text, voice);
  await redis.setex(cacheKey, 86400, audio); // 24h cache
}

// Fallback para TTS alternativo (ElevenLabs)
try {
  audio = await geminiTTS.synthesize(text, voice);
} catch (error) {
  logger.warn('Gemini TTS failed, trying ElevenLabs');
  audio = await elevenLabsTTS.synthesize(text, voice);
}
```

**Relacionado a:** Backend TTS abstraction layer

---

#### Skill: `livrya-audio-streaming`
**Propósito:** Streaming de áudio com HLS/DASH e CDN

**Conteúdo:**
- Criação de manifests HLS (.m3u8)
- Segmentação de áudio em chunks
- Estratégias de CDN (CloudFlare, Akamai)
- Adaptive bitrate streaming
- Cliente-side buffering strategies
- Análise de performance de streaming

**Exemplos:**
```bash
# Gerar segmentos HLS
ffmpeg -i narration.mp3 -f hls -hls_time 10 \
  -hls_playlist_type event \
  output.m3u8

# Upload para CDN
curl -X PUT -H "Content-Type: application/vnd.apple.mpegurl" \
  --data-binary @output.m3u8 \
  https://cdn.livrya.com/books/123/narration.m3u8
```

**Relacionado a:** Frontend e CDN strategy

---

### 2️⃣ Real-time Communication

#### Skill: `socket-io-rooms-management`
**Propósito:** Gerenciar salas e broadcasting em Socket.IO

**Conteúdo:**
- Criação e destruição de rooms
- Namespaces para organizações
- Broadcasting e targeted messaging
- Transições de rooms
- Escalabilidade com Redis adapter
- Debugging de conexões

**Exemplos:**
```typescript
// Organizar readers lendo o mesmo livro em uma sala
const roomId = `book:${bookId}`;
socket.join(roomId);

// Broadcast quando um capítulo é lançado
io.to(roomId).emit('chapter:released', {
  bookId,
  chapterNumber,
  audioUrl,
  narratorName,
});

// Com Redis adapter para múltiplos servidores
const redisAdapter = createAdapter(pubClient, subClient);
io.adapter(redisAdapter);
```

**Relacionado a:** WebSocket em tempo real

---

#### Skill: `socket-io-security`
**Propósito:** Segurança e autorização em Socket.IO

**Conteúdo:**
- Autenticação de conexões com JWT
- Autorização baseada em permissions
- Rate limiting por conexão
- Validação de mensagens
- Proteção contra DDoS
- Monitoring de conexões suspeitas

**Exemplos:**
```typescript
// Middleware de autenticação
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = user.id;
    socket.permissions = user.permissions;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Validação de autorização por evento
socket.on('chapter:update', async (data) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: data.chapterId },
    include: { book: true },
  });

  if (chapter.book.authorId !== socket.userId) {
    throw new Error('Unauthorized');
  }
  // ... process
});
```

**Relacionado a:** Security e WebSockets

---

### 3️⃣ Social Features

#### Skill: `social-feed-architecture`
**Propósito:** Arquitetura de feed social com algoritmos

**Conteúdo:**
- Paginação eficiente (cursor-based)
- Infinite scroll patterns
- Algoritmos de relevância (likes, comments, recency)
- Cache de feed (Redis)
- Aggregation pipeline (MongoDB/PostgreSQL)
- Performance optimization

**Exemplos:**
```typescript
// Cursor-based pagination
const cursor = request.query.cursor; // timestamp ou ID
const pageSize = 20;

const posts = await prisma.post.findMany({
  where: {
    createdAt: cursor ? { lt: new Date(cursor) } : undefined,
  },
  orderBy: { createdAt: 'desc' },
  take: pageSize + 1,
  include: { author: true, likes: true },
});

const hasNextPage = posts.length > pageSize;
const data = posts.slice(0, pageSize);
const nextCursor = data[data.length - 1]?.createdAt;

return { data, nextCursor, hasNextPage };
```

**Relacionado a:** Backend e Frontend Angular

---

#### Skill: `notification-system`
**Propósito:** Sistema de notificações em tempo real

**Conteúdo:**
- Push notifications (Web, Mobile)
- In-app notifications com Socket.IO
- Delivery queue com BullMQ
- Dead letter handling
- Preferences e unsubscribe
- Analytics de engagement

**Exemplos:**
```typescript
// Enfileirar notificação
await notificationQueue.add(
  'send-notification',
  {
    userId: author.id,
    type: 'chapter:published',
    data: { bookId, chapterId, title },
  },
  {
    priority: 10,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  }
);

// Worker processa
notificationQueue.process('send-notification', async (job) => {
  const { userId, type, data } = job.data;

  // Enviar push
  await webPush.send(userDevice, {
    title: 'Novo capítulo!',
    body: `${data.title} está disponível`,
    data,
  });

  // Enviar Socket.IO
  io.to(`user:${userId}`).emit('notification', { type, data });

  // Salvar no banco
  await prisma.notification.create({
    data: { userId, type, data, read: false },
  });
});
```

**Relacionado a:** BullMQ, Socket.IO, Backend

---

#### Skill: `gamification-patterns`
**Propósito:** Sistema de gamificação com achievements

**Conteúdo:**
- Sistema de badges (leitor, criador, crítico)
- Leaderboards (mensal, anual, all-time)
- Pontos de experiência
- Streaks (leitura diária)
- Unlock conditions e triggers
- Analytics de engagement

**Exemplos:**
```typescript
// Trigger achievement após ação
async function checkAchievements(userId: string, action: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { achievements: true },
  });

  const achievements = {
    'reader:first-book': user.booksRead === 1,
    'reader:10-books': user.booksRead === 10,
    'creator:first-book': user.booksCreated === 1,
    'social:100-followers': user.followers >= 100,
    'critic:10-reviews': (await countUserReviews(userId)) === 10,
  };

  for (const [achievementId, unlocked] of Object.entries(achievements)) {
    if (unlocked && !user.achievements.some(a => a.id === achievementId)) {
      await prisma.userAchievement.create({
        data: { userId, achievementId, unlockedAt: new Date() },
      });

      io.to(`user:${userId}`).emit('achievement:unlocked', {
        achievementId,
        message: 'Parabéns!',
      });
    }
  }
}
```

**Relacionado a:** Backend, Frontend Angular/React

---

### 4️⃣ Business Logic

#### Skill: `stripe-subscription-patterns`
**Propósito:** Implementação de pagamentos com Stripe

**Conteúdo:**
- Webhooks de eventos Stripe
- Billing cycles e cobranças
- Faturas e invoicing
- Gerenciamento de payment methods
- Retry logic para pagamentos falhados
- Cancelamento e reembolsos

**Exemplos:**
```typescript
// Webhook para novo pagamento bem-sucedido
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'customer.subscription.updated':
      await updateSubscription(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }
});

// Criar assinatura
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{ price: 'price_premium_monthly' }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});
```

**Relacionado a:** Backend payments

---

#### Skill: `oauth2-pkce-implementation`
**Propósito:** Implementar OAuth2 com PKCE

**Conteúdo:**
- Fluxo PKCE (Proof Key for Code Exchange)
- Geração de code_challenge e code_verifier
- State management para CSRF protection
- Refresh tokens com rotação
- Revogação de tokens
- Integração com Google OAuth

**Exemplos:**
```typescript
// Frontend: Iniciar PKCE flow
const generatePKCE = () => {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = base64UrlEncode(sha256(codeVerifier));
  sessionStorage.setItem('pkce_verifier', codeVerifier);
  return codeChallenge;
};

const codeChallenge = generatePKCE();
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.append('client_id', CLIENT_ID);
authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
authUrl.searchParams.append('scope', 'openid profile email');
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('code_challenge', codeChallenge);
authUrl.searchParams.append('code_challenge_method', 'S256');
authUrl.searchParams.append('state', generateRandomString(32));

window.location.href = authUrl.toString();

// Backend: Trocar código por token
const codeVerifier = request.session.pkce_verifier;
const response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    code: authorizationCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
  }),
});

const { access_token, refresh_token, expires_in } = await response.json();
```

**Relacionado a:** Backend auth, Security

---

## 📅 Timeline Sugerido

### Sprint 1 (Semana 1-2)
1. `livrya-audio-processing` - ✏️ Em Progresso
2. `livrya-tts-optimization` - ⏳ Planejado
3. `livrya-audio-streaming` - ⏳ Planejado

### Sprint 2 (Semana 3-4)
4. `socket-io-rooms-management` - ⏳ Planejado
5. `socket-io-security` - ⏳ Planejado

### Sprint 3 (Semana 5-6)
6. `social-feed-architecture` - ⏳ Planejado
7. `notification-system` - ⏳ Planejado
8. `gamification-patterns` - ⏳ Planejado

### Sprint 4 (Semana 7-8)
9. `stripe-subscription-patterns` - ⏳ Planejado
10. `oauth2-pkce-implementation` - ⏳ Planejado

---

## 📋 Estrutura Padrão de um Skill

Cada skill deve ter:

```
/skills/project-specific/[skill-name]/
├── SKILL.md                          # Arquivo principal
│   ├── Frontmatter YAML
│   │   - name
│   │   - description
│   │   - keywords
│   ├── Overview
│   ├── Key Concepts
│   ├── Implementation Patterns
│   ├── Code Examples
│   ├── Best Practices
│   └── Common Pitfalls
├── references/
│   ├── gemini-api-docs.md
│   ├── ffmpeg-commands.md
│   └── configuration.md
└── assets/
    ├── templates/
    └── examples/
```

---

## 🎓 Conteúdo de Cada Skill

### Seção: Overview
- O que é o skill
- Por que é importante
- Casos de uso em Livrya

### Seção: Key Concepts
- Conceitos fundamentais
- Fluxos de dados
- Componentes principais

### Seção: Implementation Patterns
- Padrões recomendados
- Decisões arquiteturais
- Trade-offs

### Seção: Code Examples
- Exemplos práticos
- Snippets TypeScript
- Exemplos de configuração

### Seção: Best Practices
- Do's and don'ts
- Performance tips
- Security considerations

### Seção: Common Pitfalls
- Erros comuns
- Troubleshooting
- Debugging strategies

---

## ✅ Critérios de Qualidade

Cada skill deve:
- ✅ Ter pelo menos 3 exemplos de código funcionais
- ✅ Incluir referências a recursos do projeto
- ✅ Cobrir casos de uso específicos de Livrya
- ✅ Incluir links para documentação externa relevante
- ✅ Ter pelo menos uma seção de troubleshooting
- ✅ Ser testado e validado pelo time

---

## 🚀 Próximos Passos

1. ✅ Fase 1: Reorganização de skills
2. 📋 Fase 2: Criar novas skills (ESTE DOCUMENTO)
3. ⏳ Fase 3: Atualizar skills existentes com best practices
4. ⏳ Fase 4: Documentação e treinamento de time

---

## 📞 Responsabilidades

- **Fase 2.1-2.3 (Audio):** Backend team
- **Fase 2.4-2.5 (Real-time):** Backend team
- **Fase 2.6-2.8 (Social):** Backend + Frontend team
- **Fase 2.9-2.10 (Business):** Backend team

---

**Status:** 📋 Planejado
**Próximo:** Começar Sprint 1 com Phase 2.1

Para executar Phase 2, consultar: `PHASE2_EXECUTION.md` (a ser criado)

https://claude.ai/code/session_01KVyYJPvKhNMC9XDN6MV46D
