# Sprint 1 — Checklist de Validação

Use este checklist para validar cada parte do Sprint 1.

---

## 🔧 Backend — Configuração

### CORS
- [x] `.env` corrigido com `localhost:5173`
- [x] Linha malformada corrigida
- [ ] Backend reiniciado após mudança
- [ ] Teste: Request do frontend não retorna erro CORS

### OAuth Client
- [x] Script `seed-oauth-client.ts` executado
- [x] Client `livrya-writer-studio` criado
- [ ] Validado no Prisma Studio ou query SQL
- [ ] Redirect URIs incluem `localhost:5173/auth/callback`

---

## 🧪 Backend — Testes de API

### Refresh Token
- [ ] Backend rodando em `localhost:3000`
- [ ] Login realizado com sucesso
- [ ] `refresh_token` obtido
- [ ] `POST /api/auth/refresh` retorna novo `access_token`
- [ ] Novo `access_token` funciona em endpoint protegido

**Comandos**:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

# Refresh (cole o refresh_token)
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"COLE_AQUI"}'
```

---

### OAuth Flow — Step 1: Authorize (GET)
- [ ] Request enviado
- [ ] Retorna redirect 302
- [ ] Redirect URL contém parâmetros OAuth

**Comando**:
```bash
curl -v "http://localhost:3000/api/oauth/authorize?client_id=livrya-writer-studio&redirect_uri=http://localhost:5173/auth/callback&response_type=code&scope=openid%20profile%20books&state=test123&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256"
```

---

### OAuth Flow — Step 2: Authorize (POST)
- [ ] Login realizado
- [ ] `access_token` obtido
- [ ] Request com Authorization header enviado
- [ ] Retorna `{ code, state }`
- [ ] `code` é string de 64 caracteres hex

**Comando**:
```bash
# Primeiro login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

# Depois authorize (cole access_token)
curl -X POST http://localhost:3000/api/oauth/authorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer COLE_ACCESS_TOKEN" \
  -d '{
    "client_id": "livrya-writer-studio",
    "redirect_uri": "http://localhost:5173/auth/callback",
    "scope": "openid profile books",
    "state": "test123",
    "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    "code_challenge_method": "S256"
  }'
```

---

### OAuth Flow — Step 3: Token Exchange
- [ ] `code` do passo anterior obtido
- [ ] Request enviado
- [ ] Retorna `{ access_token, refresh_token, token_type, expires_in }`
- [ ] `token_type` é `"Bearer"`
- [ ] `expires_in` é `3600`

**Comando**:
```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "COLE_CODE_AQUI",
    "redirect_uri": "http://localhost:5173/auth/callback",
    "client_id": "livrya-writer-studio",
    "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  }'
```

---

### OAuth Flow — Step 4: UserInfo
- [ ] `access_token` do passo anterior obtido
- [ ] Request enviado
- [ ] Retorna dados do usuário (id, email, name, etc.)
- [ ] Não retorna campos sensíveis (password, tokens)

**Comando**:
```bash
curl http://localhost:3000/api/oauth/userinfo \
  -H "Authorization: Bearer COLE_ACCESS_TOKEN"
```

---

## 🎨 Frontend — Testes Integrados

### Inicialização
- [ ] Backend rodando em `localhost:3000`
- [ ] Frontend rodando em `localhost:5173`
- [ ] Console do browser sem erros CORS
- [ ] DevTools Network tab aberta

---

### F1.1 — SSO Login Flow
- [ ] Acessar `http://localhost:5173`
- [ ] Redireciona para SSO (backend ou Angular frontend)
- [ ] Fazer login com credenciais válidas
- [ ] Redireciona de volta para `localhost:5173/auth/callback?code=...&state=...`
- [ ] `AuthCallback` processa code
- [ ] Tokens salvos (verificar localStorage ou DevTools)
- [ ] Redireciona para `/` (BookSelector)
- [ ] Não há erros no console

**Validação adicional**:
- [ ] Refresh da página mantém sessão
- [ ] Logout funciona
- [ ] Re-login funciona

---

### F1.2.1 — CRUD: Livros
- [ ] `BookSelectorPage` carrega lista de livros
- [ ] Livros exibidos corretamente
- [ ] Clicar em livro redireciona para `/studio/:bookId`
- [ ] `StudioPage` carrega dados do livro

---

### F1.2.2 — CRUD: Capítulos
- [ ] `ChapterTree` carrega capítulos do livro
- [ ] Capítulos exibidos em ordem
- [ ] Clicar em "Novo Capítulo" abre input
- [ ] Criar capítulo funciona
- [ ] Novo capítulo aparece na lista
- [ ] Clicar em capítulo ativa no canvas
- [ ] Editar título inline funciona
- [ ] Deletar capítulo funciona (com confirmação)
- [ ] Drag & drop reordena capítulos
- [ ] Ordem salva no backend

---

### F1.2.3 — CRUD: Falas
- [ ] `Canvas` carrega falas do capítulo ativo
- [ ] Falas exibidas em ordem
- [ ] `NewSpeechInput` permite criar nova fala
- [ ] Selecionar personagem funciona
- [ ] Criar fala funciona
- [ ] Nova fala aparece no canvas
- [ ] Clicar em fala abre edição inline
- [ ] Editar texto funciona
- [ ] Salvar edição funciona (auto-save ou manual)
- [ ] Deletar fala funciona
- [ ] Drag & drop reordena falas
- [ ] Ordem salva no backend

---

### F1.3 — CRUD: Personagens
- [ ] `CharacterList` carrega personagens do livro
- [ ] Personagens exibidos
- [ ] Clicar em "Novo Personagem" abre modal
- [ ] `CharacterEditorModal` exibido
- [ ] Preencher nome funciona
- [ ] Selecionar voz funciona
- [ ] Preview de voz funciona (botão play)
- [ ] Criar personagem funciona
- [ ] Novo personagem aparece na lista
- [ ] Editar personagem funciona
- [ ] Deletar personagem funciona (com confirmação)

---

### F1.4 — WebSocket: Narração
- [ ] WebSocket conecta ao iniciar app
- [ ] Console mostra `[WS] Connected: <socket_id>`
- [ ] Selecionar capítulo com falas
- [ ] Clicar em "Narrar Capítulo" em `ChapterTools`
- [ ] Request `POST /chapters/:id/narration/start` enviado
- [ ] WebSocket recebe `narration:started`
- [ ] WebSocket recebe múltiplos `narration:progress`
- [ ] Progresso exibido em `SpeechBlock` (barra ou %)
- [ ] WebSocket recebe `narration:completed` ou `narration:failed`
- [ ] Áudio final disponível para reprodução
- [ ] Clicar em play reproduz áudio
- [ ] Cancelar narração funciona (se implementado)

---

## 🎯 Critérios de Aceitação Final

### Backend
- [ ] CORS permite `localhost:5173` ✅
- [ ] OAuth client existe no banco ✅
- [ ] Refresh token funciona
- [ ] OAuth flow completo funciona (4 steps)
- [ ] PKCE validation funciona
- [ ] Todos os endpoints CRUD retornam 200/201

### Frontend
- [ ] Login SSO funciona end-to-end
- [ ] Livros carregam
- [ ] Capítulos: criar, editar, deletar, reordenar
- [ ] Falas: criar, editar, deletar, reordenar
- [ ] Personagens: criar, editar, deletar, preview
- [ ] WebSocket conecta e recebe eventos
- [ ] Narração funciona com progresso em tempo real
- [ ] Auto-refresh de token funciona
- [ ] Sem erros 4xx/5xx no console
- [ ] Sem erros CORS no console

---

## 📊 Progresso

**Backend**: ☐☐☐☐ (0/4 testes validados)  
**Frontend**: ☐☐☐☐ (0/4 testes validados)  
**Total**: 0/8 (0%)

---

## 🚀 Próximo Passo

**Agora**: Iniciar backend e executar testes de API (B1.3, B1.4)

```bash
cd backend
npm run dev
```

Depois executar os comandos cURL acima para validar cada endpoint.
