# Fase 2 - Implementação Completa - Guia de Integração Rápida

## ✅ Services Já Integrados

1. ✅ **BooksService** - create, update, delete
2. ✅ **ChaptersService** - create, update, delete, reorder

## 🔄 Próximos Services - Padrão de Integração

### 3. CharactersService

```typescript
// Adicionar ao topo
import { auditService } from './audit.service';

// Modificar CreateCharacterDto
export interface CreateCharacterDto {
    // ... campos existentes
    userId?: string;
    userEmail?: string;
}

// No método create
const character = await prisma.character.create({ data });

if (data.userId && data.userEmail) {
    auditService.logCreate(
        data.userId,
        data.userEmail,
        'Character',
        character.id,
        { name: character.name, voiceId: character.voiceId }
    ).catch(err => console.error('[AUDIT]', err));
}

// No método update (adicionar userId, userEmail aos parâmetros)
const before = { name: character.name, voiceId: character.voiceId };
// ... update
if (userId && userEmail) {
    auditService.logUpdate(userId, userEmail, 'Character', id, { before, after })
        .catch(err => console.error('[AUDIT]', err));
}

// No método delete
if (userId && userEmail) {
    auditService.logDelete(userId, userEmail, 'Character', id, { name: character.name })
        .catch(err => console.error('[AUDIT]', err));
}
```

### 4. SpeechesService

```typescript
// Similar ao Characters
auditService.logCreate(userId, userEmail, 'Speech', speech.id, { text: speech.text.substring(0, 100) })
auditService.logUpdate(userId, userEmail, 'Speech', id, { before, after })
auditService.logDelete(userId, userEmail, 'Speech', id, { text: speech.text.substring(0, 100) })
```

### 5. PostService (Social)

```typescript
// create
auditService.log({
    userId,
    userEmail,
    action: 'POST_CREATE' as any,
    category: 'SOCIAL' as any,
    severity: 'MEDIUM' as any,
    resource: 'Post',
    resourceId: post.id,
    description: `Post criado`,
    metadata: { type: post.type, content: post.content.substring(0, 100) }
}).catch(err => console.error('[AUDIT]', err));

// update
auditService.log({
    userId,
    userEmail,
    action: 'POST_UPDATE' as any,
    category: 'SOCIAL' as any,
    severity: 'MEDIUM' as any,
    resource: 'Post',
    resourceId: id,
    description: `Post atualizado`,
    metadata: { before, after }
}).catch(err => console.error('[AUDIT]', err));

// delete
auditService.log({
    userId,
    userEmail,
    action: 'POST_DELETE' as any,
    category: 'SOCIAL' as any,
    severity: 'MEDIUM' as any,
    resource: 'Post',
    resourceId: id,
    description: `Post deletado`,
    metadata: { type: post.type }
}).catch(err => console.error('[AUDIT]', err));
```

### 6. CommentService

```typescript
// create
auditService.log({
    userId,
    userEmail,
    action: 'COMMENT_CREATE' as any,
    category: 'SOCIAL' as any,
    severity: 'LOW' as any,
    resource: 'Comment',
    resourceId: comment.id,
    description: `Comentário criado`,
    metadata: { postId: comment.postId, content: comment.content.substring(0, 100) }
}).catch(err => console.error('[AUDIT]', err));

// delete
auditService.log({
    userId,
    userEmail,
    action: 'COMMENT_DELETE' as any,
    category: 'SOCIAL' as any,
    severity: 'LOW' as any,
    resource: 'Comment',
    resourceId: id,
    description: `Comentário deletado`
}).catch(err => console.error('[AUDIT]', err));
```

### 7. LikeService

```typescript
// toggle (like/unlike)
const action = isLiking ? 'LIKE_TOGGLE' : 'LIKE_TOGGLE';
auditService.log({
    userId,
    userEmail,
    action: action as any,
    category: 'SOCIAL' as any,
    severity: 'LOW' as any,
    resource: 'Like',
    resourceId: postId,
    description: isLiking ? `Post curtido` : `Curtida removida`,
    metadata: { postId, action: isLiking ? 'like' : 'unlike' }
}).catch(err => console.error('[AUDIT]', err));
```

### 8. FollowService

```typescript
// toggle (follow/unfollow)
auditService.log({
    userId,
    userEmail,
    action: 'FOLLOW_TOGGLE' as any,
    category: 'SOCIAL' as any,
    severity: 'LOW' as any,
    resource: 'Follow',
    resourceId: followingId,
    description: isFollowing ? `Seguindo usuário` : `Deixou de seguir`,
    metadata: { followingId, action: isFollowing ? 'follow' : 'unfollow' }
}).catch(err => console.error('[AUDIT]', err));
```

### 9. MessageService

```typescript
// send
auditService.log({
    userId,
    userEmail,
    action: 'MESSAGE_SEND' as any,
    category: 'MESSAGE' as any,
    severity: 'LOW' as any,
    resource: 'Message',
    resourceId: message.id,
    description: `Mensagem enviada`,
    metadata: { receiverId: message.receiverId }
}).catch(err => console.error('[AUDIT]', err));

// delete
auditService.log({
    userId,
    userEmail,
    action: 'MESSAGE_DELETE' as any,
    category: 'MESSAGE' as any,
    severity: 'LOW' as any,
    resource: 'Message',
    resourceId: id,
    description: `Mensagem deletada`
}).catch(err => console.error('[AUDIT]', err));
```

### 10. ProfileService

```typescript
// update
auditService.log({
    userId,
    userEmail,
    action: 'PROFILE_UPDATE' as any,
    category: 'PROFILE' as any,
    severity: 'MEDIUM' as any,
    resource: 'Profile',
    resourceId: userId,
    description: `Perfil atualizado`,
    metadata: { before, after }
}).catch(err => console.error('[AUDIT]', err));

// avatar upload
auditService.log({
    userId,
    userEmail,
    action: 'AVATAR_UPLOAD' as any,
    category: 'PROFILE' as any,
    severity: 'LOW' as any,
    resource: 'Profile',
    resourceId: userId,
    description: `Avatar atualizado`,
    metadata: { avatarUrl }
}).catch(err => console.error('[AUDIT]', err));
```

## 🛡️ Middlewares de Segurança

### rate-limit.middleware.ts

```typescript
// Quando rate limit é excedido
import { auditService } from '../services/audit.service';

// No handler de rate limit exceeded:
auditService.logRateLimitExceeded(
    req.user?.id,
    req.user?.email,
    req.originalUrl,
    req.auditContext?.ipAddress || 'unknown'
).catch(err => console.error('[AUDIT]', err));
```

### role.middleware.ts

```typescript
// Quando permissão é negada
import { auditService } from '../services/audit.service';

// No handler de permission denied:
auditService.logPermissionDenied(
    req.user.id,
    req.user.email,
    req.originalUrl,
    `Required role: ${requiredRole}, User role: ${req.user.role}`
).catch(err => console.error('[AUDIT]', err));
```

### plan-limits.middleware.ts

```typescript
// Quando limite do plano é atingido
import { auditService } from '../services/audit.service';

// No handler de plan limit reached:
auditService.logPlanLimitReached(
    req.user.id,
    req.user.email,
    limitType // ex: 'books', 'chapters', 'tts_minutes'
).catch(err => console.error('[AUDIT]', err));
```

## 📋 Checklist de Implementação

### Core Content
- [x] BooksService
- [x] ChaptersService
- [ ] CharactersService
- [ ] SpeechesService
- [ ] NarrationService (start, complete, fail)

### Social
- [ ] PostService
- [ ] CommentService
- [ ] LikeService
- [ ] FollowService
- [ ] MessageService

### User & Profile
- [ ] ProfileService

### Groups & Campaigns
- [ ] GroupService
- [ ] CampaignService
- [ ] StoryService

### Financial
- [ ] SubscriptionService
- [ ] LivraService

### Security Middlewares
- [ ] rate-limit.middleware.ts
- [ ] role.middleware.ts
- [ ] plan-limits.middleware.ts

## 🎯 Ações Específicas por Service

### NarrationService

```typescript
// start
auditService.log({
    userId, userEmail,
    action: 'NARRATION_START' as any,
    category: 'NARRATION' as any,
    severity: 'MEDIUM' as any,
    resource: 'Narration',
    resourceId: narration.id,
    description: `Narração iniciada`,
    metadata: { chapterId }
}).catch(err => console.error('[AUDIT]', err));

// complete
auditService.log({
    userId, userEmail,
    action: 'NARRATION_COMPLETE' as any,
    category: 'NARRATION' as any,
    severity: 'MEDIUM' as any,
    resource: 'Narration',
    resourceId: narration.id,
    description: `Narração concluída`,
    metadata: { chapterId, outputUrl: narration.outputUrl }
}).catch(err => console.error('[AUDIT]', err));

// fail
auditService.log({
    userId, userEmail,
    action: 'NARRATION_FAIL' as any,
    category: 'NARRATION' as any,
    severity: 'HIGH' as any,
    resource: 'Narration',
    resourceId: narration.id,
    description: `Narração falhou`,
    success: false,
    errorMessage: error.message,
    metadata: { chapterId }
}).catch(err => console.error('[AUDIT]', err));
```

### SubscriptionService

```typescript
// create
action: 'SUBSCRIPTION_CREATE' as any,
category: 'FINANCIAL' as any,
severity: 'CRITICAL' as any,

// cancel
action: 'SUBSCRIPTION_CANCEL' as any,
category: 'FINANCIAL' as any,
severity: 'CRITICAL' as any,

// upgrade
action: 'SUBSCRIPTION_UPGRADE' as any,
category: 'FINANCIAL' as any,
severity: 'CRITICAL' as any,

// downgrade
action: 'SUBSCRIPTION_DOWNGRADE' as any,
category: 'FINANCIAL' as any,
severity: 'CRITICAL' as any,
```

### LivraService

```typescript
// purchase
action: 'LIVRA_PURCHASE' as any,
category: 'FINANCIAL' as any,
severity: 'CRITICAL' as any,

// spend
action: 'LIVRA_SPEND' as any,
category: 'FINANCIAL' as any,
severity: 'MEDIUM' as any,

// earn
action: 'LIVRA_EARN' as any,
category: 'FINANCIAL' as any,
severity: 'LOW' as any,
```

## ⚠️ Notas Importantes

1. **Sempre usar fire-and-forget**: `.catch(err => console.error('[AUDIT]', err))`
2. **Metadata limitado**: Não logar dados muito grandes (limitar strings a 100-200 chars)
3. **Severidade apropriada**:
   - LOW: Leituras, likes, follows
   - MEDIUM: Criações, atualizações
   - HIGH: Exclusões, mudanças de senha
   - CRITICAL: Ações financeiras, admin
4. **User context**: Sempre passar userId e userEmail quando disponível
5. **Resource names**: Usar PascalCase singular (Book, Chapter, Character)

## 🚀 Status

**Implementados**: 2/17 (11.8%)
- ✅ BooksService
- ✅ ChaptersService

**Pendentes**: 15 services + 3 middlewares
