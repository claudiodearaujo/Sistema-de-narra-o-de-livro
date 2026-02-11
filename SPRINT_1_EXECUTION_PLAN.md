# Sprint 1 — Integração Core (CRUD + Auth Validation)
## Plano de Execução Detalhado

**Data de início**: 2026-02-11  
**Duração estimada**: 1 semana  
**Status**: 🚀 Em execução

---

## ✅ Análise Prévia Completa

### Estado Atual do Backend

| Item | Status | Observações |
|------|--------|-------------|
| **OAuth Infrastructure** | ✅ Completo | Models, service, controller prontos |
| **CORS Configuration** | ⚠️ Precisa ajuste | Falta adicionar `localhost:5173` |
| **OAuth Client Seed** | ✅ Existe | Script `seed-oauth-client.ts` pronto |
| **Refresh Token Flow** | ✅ Implementado | Em `auth.routes.ts` |
| **WebSocket CORS** | ⚠️ Precisa ajuste | Falta adicionar `localhost:5173` |

### Estado Atual do Frontend

| Item | Status | Observações |
|------|--------|-------------|
| **OAuth PKCE Flow** | ✅ Implementado | `AuthGuard`, `AuthCallback` prontos |
| **HTTP Interceptor** | ✅ Implementado | Auto-refresh token funcional |
| **TanStack Query Hooks** | ✅ Implementados | Todos os hooks CRUD prontos |
| **WebSocket Client** | ✅ Implementado | Socket.io client configurado |
| **Components** | ✅ Implementados | Canvas, SpeechBlock, etc. |

---

## 📋 Tarefas do Sprint 1

### 🔧 Backend Tasks

#### B1.1 — Atualizar CORS para incluir WriterStudio (Dev)
**Status**: ⏳ Pendente  
**Estimativa**: 15 minutos  
**Prioridade**: 🔴 Crítica

**Arquivo**: `backend/.env`

**Ação**:
```bash
# Linha 1 atual (tem erro de formatação):
ALLOWED_ORIGINS=http://localhost:4200,https://www.livrya.com.br,https://livrya.com.brhttp://localhost:3000

# Corrigir para:
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:5173,https://www.livrya.com.br,https://livrya.com.br
```

**Validação**:
- [ ] Reiniciar backend
- [ ] Testar request do frontend em `localhost:5173`
- [ ] Verificar que não há erro CORS no console

---

#### B1.2 — Executar Seed do OAuth Client
**Status**: ⏳ Pendente  
**Estimativa**: 10 minutos  
**Prioridade**: 🔴 Crítica

**Comando**:
```bash
cd backend
npx ts-node prisma/seed-oauth-client.ts
```

**Validação**:
- [ ] Script executa sem erros
- [ ] Client `livrya-writer-studio` criado/atualizado
- [ ] Redirect URIs incluem `http://localhost:5173/auth/callback`

---

#### B1.3 — Validar Endpoint de Refresh Token
**Status**: ⏳ Pendente  
**Estimativa**: 30 minutos  
**Prioridade**: 🟡 Alta

**Arquivo**: `backend/src/routes/auth.routes.ts`

**Verificar**:
1. Endpoint `POST /api/auth/refresh` existe ✅
2. Aceita refresh token no body ou cookie
3. Retorna novo access_token e refresh_token

**Teste Manual**:
```bash
# 1. Login para obter tokens
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Usar refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN_AQUI>"}'
```

**Validação**:
- [ ] Retorna `{ access_token, refresh_token }`
- [ ] Novo access_token é válido
- [ ] Refresh token antigo é invalidado (opcional)

---

#### B1.4 — Validar Fluxo OAuth Completo
**Status**: ⏳ Pendente  
**Estimativa**: 1 hora  
**Prioridade**: 🔴 Crítica

**Passos**:

1. **Authorize (GET)**
```bash
curl "http://localhost:3000/api/oauth/authorize?client_id=livrya-writer-studio&redirect_uri=http://localhost:5173/auth/callback&response_type=code&scope=openid%20profile%20books&state=random123&code_challenge=CHALLENGE&code_challenge_method=S256"
```

Deve redirecionar para frontend SSO page.

2. **Authorize (POST)** — Simular usuário autenticado
```bash
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "client_id": "livrya-writer-studio",
    "redirect_uri": "http://localhost:5173/auth/callback",
    "scope": "openid profile books",
    "state": "random123",
    "code_challenge": "CHALLENGE",
    "code_challenge_method": "S256"
  }'
```

Deve retornar `{ code, state }`.

3. **Token Exchange**
```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "<CODE_FROM_STEP_2>",
    "redirect_uri": "http://localhost:5173/auth/callback",
    "client_id": "livrya-writer-studio",
    "code_verifier": "VERIFIER"
  }'
```

Deve retornar `{ access_token, refresh_token, token_type, expires_in }`.

4. **UserInfo**
```bash
curl http://localhost:3000/api/oauth/userinfo \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Deve retornar dados do usuário.

**Validação**:
- [ ] Todos os 4 passos funcionam
- [ ] PKCE validation funciona (code_challenge vs code_verifier)
- [ ] Tokens são válidos
- [ ] UserInfo retorna dados corretos

---

### 🎨 Frontend Tasks

#### F1.1 — Teste Integrado: Login SSO End-to-End
**Status**: ⏳ Pendente  
**Estimativa**: 2 horas  
**Prioridade**: 🔴 Crítica

**Passos**:

1. **Iniciar Frontend**
```bash
cd Frontend/WriterCenterFront
npm run dev
```

2. **Acessar**: `http://localhost:5173`

3. **Fluxo Esperado**:
   - Redireciona para SSO authorize (backend ou Angular frontend)
   - Usuário faz login (se necessário)
   - Redireciona de volta para `http://localhost:5173/auth/callback?code=...&state=...`
   - `AuthCallback.tsx` troca code por tokens
   - Tokens salvos em localStorage/memory
   - Redireciona para `/` (BookSelector)

**Validação**:
- [ ] Redirect para SSO funciona
- [ ] Callback recebe code e state
- [ ] Token exchange funciona
- [ ] Tokens salvos corretamente
- [ ] HTTP interceptor adiciona Authorization header
- [ ] Refresh automático funciona (testar após 1h ou forçar expiration)

---

#### F1.2 — Teste CRUD: Livros → Capítulos → Falas
**Status**: ⏳ Pendente  
**Estimativa**: 2 horas  
**Prioridade**: 🔴 Crítica

**Cenário 1: Selecionar Livro**
- [ ] `BookSelectorPage` carrega lista de livros via `useBooks()`
- [ ] Clicar em livro redireciona para `/studio/:bookId`
- [ ] `StudioPage` carrega livro via `useBook(bookId)`

**Cenário 2: Capítulos**
- [ ] `ChapterTree` carrega capítulos via `useChapters(bookId)`
- [ ] Clicar em "Novo Capítulo" cria capítulo via `useCreateChapter()`
- [ ] Clicar em capítulo ativa no canvas
- [ ] Drag & drop reordena via `useReorderChapters()`
- [ ] Editar título inline funciona via `useUpdateChapter()`
- [ ] Deletar capítulo funciona via `useDeleteChapter()`

**Cenário 3: Falas**
- [ ] `Canvas` carrega falas via `useSpeeches(chapterId)`
- [ ] `NewSpeechInput` cria fala via `useCreateSpeech()`
- [ ] Clicar em fala abre edição inline
- [ ] Salvar edição funciona via `useUpdateSpeech()`
- [ ] Deletar fala funciona via `useDeleteSpeech()`
- [ ] Drag & drop reordena via `useReorderSpeeches()`

---

#### F1.3 — Teste CRUD: Personagens
**Status**: ⏳ Pendente  
**Estimativa**: 1 hora  
**Prioridade**: 🟡 Alta

**Cenário**:
- [ ] `CharacterList` carrega personagens via `useCharacters(bookId)`
- [ ] Clicar em "Novo Personagem" abre `CharacterEditorModal`
- [ ] Criar personagem funciona via `useCreateCharacter()`
- [ ] Editar personagem funciona via `useUpdateCharacter()`
- [ ] Preview de voz funciona via endpoint `/characters/:id/preview-audio`
- [ ] Deletar personagem funciona via `useDeleteCharacter()`

---

#### F1.4 — Teste WebSocket: Narração
**Status**: ⏳ Pendente  
**Estimativa**: 1 hora  
**Prioridade**: 🟡 Alta

**Cenário**:
1. Selecionar capítulo com falas
2. Clicar em "Narrar Capítulo" em `ChapterTools`
3. `POST /chapters/:id/narration/start` é chamado
4. WebSocket recebe eventos:
   - `narration:started`
   - `narration:progress` (múltiplos)
   - `narration:completed` ou `narration:failed`
5. Progresso exibido no `SpeechBlock`
6. Áudio final disponível para reprodução

**Validação**:
- [ ] WebSocket conecta com auth token
- [ ] Eventos são recebidos em tempo real
- [ ] Progresso atualiza UI
- [ ] Áudio gerado pode ser reproduzido
- [ ] Cancelar narração funciona

---

## 🧪 Critérios de Aceitação

### Backend
- [ ] CORS permite requests de `localhost:5173`
- [ ] OAuth client `livrya-writer-studio` existe no banco
- [ ] Fluxo OAuth completo funciona (authorize → token → userinfo)
- [ ] PKCE validation funciona
- [ ] Refresh token funciona

### Frontend
- [ ] Login SSO funciona end-to-end
- [ ] Todos os CRUDs funcionam (Books, Chapters, Speeches, Characters)
- [ ] Drag & drop funciona (Chapters, Speeches)
- [ ] WebSocket recebe eventos de narração
- [ ] Auto-refresh de token funciona
- [ ] Sem erros 4xx/5xx no console

---

## 🐛 Problemas Conhecidos

### 1. CORS Error no `.env`
**Linha 1 do `.env` tem erro de formatação**:
```
ALLOWED_ORIGINS=http://localhost:4200,https://www.livrya.com.br,https://livrya.com.brhttp://localhost:3000
```

Falta vírgula antes de `http://localhost:3000`.

**Fix**: Corrigir para:
```
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:5173,https://www.livrya.com.br,https://livrya.com.br
```

### 2. Frontend URL no OAuth Controller
**Arquivo**: `backend/src/controllers/oauth.controller.ts` linha 31

```typescript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
```

Precisa adicionar `FRONTEND_URL` no `.env` ou ajustar lógica para aceitar múltiplos frontends.

**Sugestão**: Adicionar no `.env`:
```
FRONTEND_URL=http://localhost:4200
WRITER_STUDIO_URL=http://localhost:5173
```

E ajustar controller para usar `WRITER_STUDIO_URL` quando `client_id === 'livrya-writer-studio'`.

---

## 📊 Progresso

- [ ] B1.1 — CORS Update
- [ ] B1.2 — OAuth Seed
- [ ] B1.3 — Refresh Token Validation
- [ ] B1.4 — OAuth Flow Validation
- [ ] F1.1 — SSO End-to-End Test
- [ ] F1.2 — CRUD Tests (Books/Chapters/Speeches)
- [ ] F1.3 — CRUD Tests (Characters)
- [ ] F1.4 — WebSocket Test

**Total**: 0/8 tarefas completas (0%)

---

## 🚀 Próximos Passos

1. **Corrigir `.env`** — CORS origins
2. **Executar seed OAuth** — Criar client
3. **Testar backend OAuth** — cURL tests
4. **Testar frontend SSO** — Login flow
5. **Testar CRUDs** — Todas as operações
6. **Validar WebSocket** — Narração em tempo real

---

## 📝 Notas

- O backend já tem toda a infraestrutura OAuth pronta
- O frontend já tem todos os hooks e componentes implementados
- O principal trabalho é **validação e testes integrados**
- Não há código novo a escrever, apenas configuração e testes
