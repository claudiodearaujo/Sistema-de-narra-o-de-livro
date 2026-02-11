# Sprint 1 — Progresso Atual

**Última atualização**: 2026-02-11 18:15  
**Status**: 🟢 Em andamento — 25% completo

---

## ✅ Tarefas Completadas

### Backend

#### ✅ B1.1 — CORS Configuration Fixed
**Concluído em**: 2026-02-11 18:13

**Mudanças**:
- Corrigido erro de formatação em `backend/.env` linha 1
- Adicionado `http://localhost:5173` aos allowed origins
- Corrigido duplicação de domínio `livrya.com.br`

**Antes**:
```
ALLOWED_ORIGINS=http://localhost:4200,https://www.livrya.com.br,https://livrya.com.brhttp://localhost:3000
```

**Depois**:
```
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:5173,https://www.livrya.com.br,https://livrya.com.br
```

**Validação**: ✅ Arquivo atualizado

---

#### ✅ B1.2 — OAuth Client Seeded
**Concluído em**: 2026-02-11 18:15

**Comando executado**:
```bash
npx ts-node prisma/seed-oauth-client.ts
```

**Resultado**:
```
🔐 Seeding OAuth client...
✅ OAuth client "livrya-writer-studio" created/updated
🎉 OAuth seed complete!
```

**Client criado**:
- `client_id`: `livrya-writer-studio`
- `name`: `Writer Studio`
- `allowed_redirect_uris`: 
  - `http://localhost:5173/auth/callback`
  - `https://writer.livrya.com.br/auth/callback`
- `allowed_scopes`: `openid`, `profile`, `books`, `chapters`, `characters`, `speeches`
- `is_active`: `true`

**Validação**: ✅ Client criado no banco de dados

---

## ⏳ Próximas Tarefas

### Backend

#### B1.3 — Validar Endpoint de Refresh Token
**Status**: Pronto para testar  
**Estimativa**: 30 minutos

**Ações necessárias**:
1. Criar usuário de teste (se não existir)
2. Fazer login para obter tokens
3. Testar refresh endpoint
4. Validar que novo access_token funciona

**Comandos de teste**:
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<TOKEN>"}'
```

---

#### B1.4 — Validar Fluxo OAuth Completo
**Status**: Pronto para testar  
**Estimativa**: 1 hora

**Passos**:
1. GET `/oauth/authorize` → deve redirecionar
2. POST `/oauth/authorize` (autenticado) → retorna code
3. POST `/oauth/token` → troca code por tokens
4. GET `/oauth/userinfo` → retorna dados do usuário

---

### Frontend

#### F1.1 — Teste SSO End-to-End
**Status**: Aguardando backend validado  
**Estimativa**: 2 horas

**Pré-requisitos**:
- ✅ CORS configurado
- ✅ OAuth client criado
- ⏳ OAuth flow validado no backend

**Passos**:
1. Iniciar backend: `npm run dev` (porta 3000)
2. Iniciar frontend: `npm run dev` (porta 5173)
3. Acessar `http://localhost:5173`
4. Validar fluxo completo de login

---

#### F1.2 — Teste CRUD Completo
**Status**: Aguardando F1.1  
**Estimativa**: 2 horas

**Cenários**:
- Livros: listar, selecionar
- Capítulos: criar, editar, deletar, reordenar
- Falas: criar, editar, deletar, reordenar
- Personagens: criar, editar, deletar, preview voz

---

#### F1.3 — Teste WebSocket Narração
**Status**: Aguardando F1.1  
**Estimativa**: 1 hora

**Validar**:
- Conexão WebSocket com auth
- Eventos de narração em tempo real
- Progresso visual no UI
- Cancelamento de narração

---

## 📊 Progresso Geral

| Categoria | Completas | Total | % |
|-----------|-----------|-------|---|
| **Backend** | 2 | 4 | 50% |
| **Frontend** | 0 | 4 | 0% |
| **Total** | 2 | 8 | **25%** |

---

## 🎯 Próximo Passo Imediato

**Tarefa**: B1.3 — Validar Refresh Token

**Ação**: Testar o endpoint `/api/auth/refresh` com cURL para garantir que funciona antes de testar no frontend.

**Comando sugerido**:
```bash
# Primeiro, precisamos criar um usuário de teste ou usar um existente
# Depois fazer login e testar refresh
```

---

## 🐛 Issues Encontrados

### 1. ✅ CORS Malformado (RESOLVIDO)
**Problema**: Linha 1 do `.env` tinha erro de formatação  
**Solução**: Corrigido em B1.1  
**Status**: ✅ Resolvido

### 2. ⚠️ FRONTEND_URL não configurado
**Problema**: `oauth.controller.ts` usa `process.env.FRONTEND_URL` que não está no `.env`  
**Impacto**: Redirect do OAuth pode não funcionar corretamente  
**Solução sugerida**: Adicionar ao `.env`:
```
FRONTEND_URL=http://localhost:4200
WRITER_STUDIO_URL=http://localhost:5173
```

**Status**: ⏳ Pendente

---

## 📝 Notas

- O backend já tem toda infraestrutura OAuth implementada
- O frontend já tem todos os componentes prontos
- Principal trabalho agora é **validação e testes**
- Não há código novo a escrever, apenas configuração e validação
