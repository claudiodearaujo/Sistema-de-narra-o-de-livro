---
description: Estrutura e informações essenciais do projeto Sistema de Narração de Livros (Livrya)
---

# Projeto Livrya - Guia de Estrutura

## Visão Geral

Sistema completo de narração de livros com rede social integrada. Composto por **1 backend** e **2 frontends**.

## Estrutura de Diretórios

```
c:\desenv\Sistema-de-narra-o-de-livro\
├── Backend/                    # API Node.js/Express
├── Frontend/
│   ├── LivryaFrontSocial/     # Angular - Rede Social Principal
│   └── WriterCenterFront/     # React/Vite - Studio de Escritores
└── .agent/skills/             # Skills do Claude Code
```

---

## Backend (Node.js/Express/TypeScript)

**Caminho:** `Backend/`
**Porta:** 3000
**Comando:** `npm run dev`

### Arquivos Críticos

| Arquivo | Descrição |
|---------|-----------|
| `src/index.ts` | Entry point, registro de rotas, CORS |
| `prisma/schema.prisma` | Schema do banco de dados |
| `prisma/seed.ts` | Seed de dados iniciais |
| `prisma.config.ts` | Configuração Prisma 7 (DATABASE_URL + DIRECT_URL) |
| `.env` | Variáveis de ambiente |

### Estrutura de Código

```
Backend/src/
├── controllers/      # Request handlers
├── services/         # Lógica de negócio
├── routes/           # Definição de rotas
├── middleware/       # Auth, audit, validation
├── queues/           # BullMQ workers (Redis)
├── websocket/        # Real-time notifications
└── utils/            # Helpers (jwt, crypto, etc)
```

### Dependências Chave

- **Prisma 7.2.0** - ORM (NUNCA alterar versão)
- **Express** - Framework HTTP
- **BullMQ** - Filas com Redis
- **Gemini API** - TTS e AI features

### Database

- **Supabase PostgreSQL**
- Pooler: porta 6543 (`DATABASE_URL`)
- Direct: porta 5432 (`DIRECT_URL`) - para migrations

---

## LivryaFrontSocial (Angular)

**Caminho:** `Frontend/LivryaFrontSocial/`
**Porta:** 4200
**Comando:** `npm start`

### Arquivos Críticos

| Arquivo | Descrição |
|---------|-----------|
| `src/app/app.routes.ts` | Rotas principais |
| `src/app/features/auth/` | Autenticação (login, signup, SSO) |
| `src/app/core/services/` | Services globais |
| `src/environments/` | Configuração de ambiente |
| `angular.json` | Configuração do build |

### Estrutura de Features

```
src/app/features/
├── auth/             # Login, Signup, SSO
├── social/           # Feed, Posts, Comments
├── writer/           # Gestão de livros
├── reading/          # Campanhas de leitura
├── groups/           # Grupos literários
├── messages/         # Chat direto
└── shared/           # Componentes compartilhados
```

### Stack

- **Angular 20** (Standalone components)
- **PrimeNG** - UI Components
- **Transloco** - I18n
- **Signals** - State management

---

## WriterCenterFront (React/Vite)

**Caminho:** `Frontend/WriterCenterFront/`
**Porta:** 5173
**Comando:** `npm run dev`

### Arquivos Críticos

| Arquivo | Descrição |
|---------|-----------|
| `src/App.tsx` | Entry point |
| `src/auth/` | AuthGuard, AuthCallback (SSO PKCE) |
| `src/shared/stores/` | Zustand stores |
| `src/shared/api/endpoints.ts` | URLs da API |
| `.env` | Variáveis (SSO_URL, API_URL, etc) |

### Stack

- **React 18** + TypeScript
- **Vite** - Build tool
- **Zustand** - State management
- **TailwindCSS** - Styling

---

## Autenticação

### Fluxo SSO OAuth2 PKCE

1. **WriterCenterFront** → Redireciona para `LivryaFrontSocial/auth/sso/authorize`
2. **LivryaFrontSocial** → Mostra tela de consentimento
3. **Backend** `/oauth/authorize` → Gera authorization code
4. **WriterCenterFront** → Recebe code, troca por tokens em `/oauth/token`

### Endpoints OAuth

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/oauth/authorize` | GET | Redirect para frontend SSO |
| `/oauth/authorize` | POST | Gera authorization code (auth required) |
| `/oauth/token` | POST | Troca code por tokens |
| `/oauth/userinfo` | GET | Retorna dados do usuário (auth required) |

### Cliente OAuth Configurado

- **client_id:** `livrya-writer-studio`
- **redirect_uris:** `http://localhost:5173/auth/callback`, `https://writer.livrya.com/auth/callback`
- **scopes:** `openid`, `profile`, `books`, `chapters`, `characters`, `speeches`

---

## Variáveis de Ambiente

### Backend (.env)

```bash
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...@pooler.supabase.com:5432/postgres
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GEMINI_API_KEY=...
REDIS_URL=redis://...
```

### WriterCenterFront (.env)

```bash
VITE_API_URL=http://localhost:3000
VITE_SSO_URL=http://localhost:4200/auth/sso/authorize
VITE_SSO_CLIENT_ID=livrya-writer-studio
VITE_SSO_REDIRECT_URI=http://localhost:5173/auth/callback
```

---

## Comandos Úteis

### Backend
```bash
npm run dev          # Inicia servidor
npm run build        # Compila TypeScript
npm run seed         # Popula banco
npx prisma generate  # Regenera Prisma Client
npx prisma db push   # Aplica schema (pode travar - ver skill prisma-supabase-migrations)
```

### LivryaFrontSocial
```bash
npm start            # Inicia dev server (4200)
npm run build        # Build produção
npx ng g c <name>    # Gera componente
```

### WriterCenterFront
```bash
npm run dev          # Inicia dev server (5173)
npm run build        # Build produção
```

---

## Notas Importantes

1. **Prisma 7.2.0** - Versão fixa, não alterar
2. **Migrations** - Se `prisma db push` travar, usar script direto (ver skill `prisma-supabase-migrations`)
3. **CORS** - Origens permitidas definidas em `Backend/src/index.ts`
4. **Tokens** - JWT com refresh tokens, stored em localStorage/sessionStorage
5. **Real-time** - WebSocket server em `Backend/src/websocket/`
