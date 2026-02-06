# Livrya Writer's Studio — Plano de Separação

**Versão**: 1.0  
**Data**: 2026-02-06  
**Escopo**: Extração do módulo de escritor para projeto React independente com SSO

---

## 1. Visão Arquitetural

### 1.1 Arquitetura Atual (Monolito Angular)

```
livrya-app (Angular 21)
├── features/
│   ├── auth/          ← Login, registro, sessão
│   ├── social/        ← Feed, perfis, comunidade
│   ├── reader/        ← Leitura de livros publicados
│   ├── writer/        ← MÓDULO A SER EXTRAÍDO
│   ├── store/         ← Loja de livros (Livras)
│   └── admin/         ← Painel administrativo
├── core/
│   ├── services/      ← BookService, ChapterService, etc.
│   ├── guards/        ← authGuard, roleGuard
│   ├── interceptors/  ← Token interceptor
│   └── models/        ← Interfaces TypeScript
└── shared/            ← Componentes reutilizáveis
```

### 1.2 Arquitetura Proposta (Dois Frontends)

```
┌──────────────────────┐     ┌──────────────────────┐
│   livrya-app         │     │  livrya-writer       │
│   (Angular 21)       │     │  (React 19 + Vite)   │
│                      │     │                      │
│  • Social / Feed     │     │  • Writer's Studio   │
│  • Reader            │     │  • Canvas de Escrita  │
│  • Store             │     │  • IA Chat            │
│  • Auth (SSO Server) │     │  • Narração TTS       │
│  • Admin             │     │  • Gestão de Mídia    │
│  • Perfil do Autor   │     │                      │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           │    ┌───────────────┐       │
           └───►│  Backend API  │◄──────┘
                │  (NestJS)     │
                │               │
                │  • REST API   │
                │  • WebSocket  │
                │  • Auth/SSO   │
                │  • TTS        │
                │  • IA Tools   │
                └───────────────┘
```

### 1.3 Justificativas da Separação

| Aspecto | Benefício |
|---|---|
| **DX (Developer Experience)** | React tem ecossistema superior para editores ricos (TipTap, Slate, ProseMirror) |
| **Performance** | Bundle isolado, carrega só o necessário para escrita |
| **Deploy independente** | Atualizações no studio não impactam a rede social |
| **Escalabilidade de time** | Times separados podem trabalhar em paralelo |
| **Experiência do usuário** | App dedicada = otimização total para o fluxo de escrita |
| **Mobile futuro** | React Native para versão mobile do studio |

---

## 2. Autenticação — SSO (Single Sign-On)

### 2.1 Estratégia Recomendada: OAuth 2.0 + PKCE

O Livrya App (Angular) é o **Identity Provider (IdP)** e o Writer's Studio (React) é o **Client**.

```
┌─────────────┐                    ┌──────────────┐
│  Writer      │  1. Redirect      │  Livrya App  │
│  Studio      │──────────────────►│  /auth/sso   │
│  (React)     │                   │  (Angular)   │
│              │  2. User Login    │              │
│              │  (se necessário)  │              │
│              │                   │              │
│              │  3. Auth Code     │              │
│              │◄──────────────────│              │
│              │                   └──────────────┘
│              │
│              │  4. Code → Token
│              │──────────────────►┌──────────────┐
│              │                   │  Backend API │
│              │  5. Access Token  │  /auth/token │
│              │  + Refresh Token  │              │
│              │◄──────────────────│              │
└─────────────┘                   └──────────────┘
```

### 2.2 Fluxo Detalhado

**Passo 1 — Usuário acessa o Writer's Studio**
```
https://write.livrya.com.br
```

**Passo 2 — React verifica sessão**
```typescript
// Se não tem token válido, redireciona para SSO
if (!authStore.isAuthenticated()) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  sessionStorage.setItem('pkce_verifier', codeVerifier);
  
  window.location.href = buildSSOUrl({
    base: 'https://app.livrya.com.br/auth/sso/authorize',
    client_id: 'livrya-writer-studio',
    redirect_uri: 'https://write.livrya.com.br/auth/callback',
    response_type: 'code',
    scope: 'openid profile books chapters characters speeches',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: generateState(),
  });
}
```

**Passo 3 — Livrya App autentica (se necessário)**
- Se o usuário já está logado no Livrya App → redireciona imediatamente com code
- Se não → mostra tela de login → após sucesso, redireciona com code

**Passo 4 — Callback no Writer's Studio**
```typescript
// /auth/callback
const code = searchParams.get('code');
const state = searchParams.get('state');
const verifier = sessionStorage.getItem('pkce_verifier');

const tokens = await api.post('/auth/token', {
  grant_type: 'authorization_code',
  code,
  redirect_uri: 'https://write.livrya.com.br/auth/callback',
  client_id: 'livrya-writer-studio',
  code_verifier: verifier,
});

authStore.setTokens(tokens.access_token, tokens.refresh_token);
```

**Passo 5 — Sessão compartilhada**
- Access token (JWT, 15min) armazenado em memória
- Refresh token (httpOnly cookie, 7 dias) para renovação silenciosa
- Logout em qualquer app invalida a sessão em ambos

### 2.3 O que o Backend Precisa

| Endpoint | Descrição |
|---|---|
| `GET /auth/sso/authorize` | Inicia fluxo OAuth, valida client_id, gera authorization code |
| `POST /auth/token` | Troca code por tokens (access + refresh), valida PKCE |
| `POST /auth/token/refresh` | Renova access token via refresh token |
| `POST /auth/logout` | Revoga tokens, invalida sessão em todos os clients |
| `GET /auth/userinfo` | Retorna perfil do usuário autenticado |

### 2.4 Registro do Client no Backend

```typescript
// Configuração do Writer Studio como client OAuth
{
  client_id: 'livrya-writer-studio',
  client_name: 'Livrya Writer\'s Studio',
  redirect_uris: [
    'https://write.livrya.com.br/auth/callback',
    'http://localhost:5173/auth/callback'  // dev
  ],
  allowed_scopes: ['openid', 'profile', 'books', 'chapters', 
                   'characters', 'speeches', 'narration', 'ai-tools'],
  token_endpoint_auth_method: 'none',  // Public client (SPA), usa PKCE
  grant_types: ['authorization_code', 'refresh_token'],
}
```

---

## 3. Stack Tecnológica do Writer's Studio

### 3.1 Dependências Core

| Categoria | Tecnologia | Justificativa |
|---|---|---|
| **Framework** | React 19 | Ecossistema rico para editores, hooks, concurrent features |
| **Build** | Vite 6 | HMR ultrarrápido, build otimizado |
| **Linguagem** | TypeScript 5.7 | Tipagem forte, compatível com modelos do Angular |
| **Roteamento** | React Router 7 | Padrão de mercado, lazy loading nativo |
| **Estado Global** | Zustand | Leve, sem boilerplate, integra com signals pattern |
| **Estilização** | Tailwind CSS 4 | Consistência com o Livrya App |
| **UI Components** | Radix UI + shadcn/ui | Acessíveis, sem estilo fixo, customizáveis |
| **Editor de Texto** | TipTap (ProseMirror) | Editor rico extensível, ideal para o canvas |
| **Requisições** | TanStack Query v5 | Cache, refetch, otimistic updates |
| **WebSocket** | Socket.io Client | Compatível com backend existente |
| **Formulários** | React Hook Form + Zod | Validação type-safe |
| **Testes** | Vitest + Testing Library + Playwright | Stack moderna completa |
| **i18n** | react-i18next | Compatível com chaves de tradução existentes |
| **Ícones** | Lucide React | Mesmo do protótipo |

### 3.2 Estrutura de Diretórios

```
livrya-writer/
├── public/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── router.tsx                 # Definição de rotas
│   │   ├── providers.tsx              # Context providers
│   │   └── App.tsx                    # Root component
│   │
│   ├── assets/                        # Imagens, SVGs
│   │
│   ├── auth/                          # Módulo de autenticação
│   │   ├── AuthCallback.tsx           # Página /auth/callback
│   │   ├── AuthGuard.tsx              # Proteção de rotas
│   │   ├── auth.store.ts              # Estado de autenticação (Zustand)
│   │   ├── auth.service.ts            # Chamadas OAuth
│   │   └── auth.types.ts              # Tipos
│   │
│   ├── features/
│   │   ├── studio/                    # Tela principal (Writer's Studio)
│   │   │   ├── StudioPage.tsx         # Layout com 3 zonas
│   │   │   ├── components/
│   │   │   │   ├── TopBar.tsx
│   │   │   │   ├── StatusBar.tsx
│   │   │   │   ├── LeftSidebar/
│   │   │   │   │   ├── ChapterTree.tsx
│   │   │   │   │   ├── CharacterList.tsx
│   │   │   │   │   └── ChapterTools.tsx
│   │   │   │   ├── Canvas/
│   │   │   │   │   ├── WritingCanvas.tsx
│   │   │   │   │   ├── SpeechBlock.tsx
│   │   │   │   │   ├── NewSpeechInput.tsx
│   │   │   │   │   └── TagToolbar.tsx
│   │   │   │   └── RightPanel/
│   │   │   │       ├── AiChat.tsx
│   │   │   │       ├── MediaPanel.tsx
│   │   │   │       └── PropertiesPanel.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useStudio.ts       # Estado da tela principal
│   │   │   │   ├── useSpeechEditor.ts # Lógica do editor inline
│   │   │   │   └── useKeyboardShortcuts.ts
│   │   │   └── studio.store.ts        # Estado do studio (Zustand)
│   │   │
│   │   ├── book-selector/             # Seleção inicial de livro
│   │   │   └── BookSelectorPage.tsx
│   │   │
│   │   └── character-editor/          # Editor de personagens (modal/drawer)
│   │       └── CharacterEditor.tsx
│   │
│   ├── shared/
│   │   ├── api/
│   │   │   ├── http.ts                # Axios instance com interceptor
│   │   │   ├── websocket.ts           # Socket.io client
│   │   │   └── endpoints.ts           # Constantes de endpoints
│   │   ├── components/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── VoiceSelector.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── hooks/
│   │   │   ├── useBooks.ts            # TanStack Query hooks
│   │   │   ├── useChapters.ts
│   │   │   ├── useCharacters.ts
│   │   │   ├── useSpeeches.ts
│   │   │   ├── useNarration.ts
│   │   │   └── useAiTools.ts
│   │   ├── stores/
│   │   │   └── ui.store.ts            # Preferências de UI
│   │   └── types/
│   │       ├── book.types.ts          # Interfaces (espelho do Angular)
│   │       ├── chapter.types.ts
│   │       ├── character.types.ts
│   │       ├── speech.types.ts
│   │       └── voice.types.ts
│   │
│   ├── styles/
│   │   └── globals.css                # Tailwind + custom styles
│   │
│   └── main.tsx                       # Entry point
│
├── e2e/                               # Playwright tests
├── .env                               # Variáveis de ambiente
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## 4. Contrato de API — O que já Existe vs. O que Falta

### 4.1 Endpoints Existentes (Reutilizáveis)

Estes endpoints do backend atual são consumidos diretamente pelo Writer's Studio sem alteração:

| Endpoint | Método | Uso no Studio |
|---|---|---|
| `/api/books` | GET | Seletor de livro |
| `/api/books/{id}` | GET, PUT | Dados do livro ativo |
| `/api/books/{id}/stats` | GET | Estatísticas na sidebar |
| `/api/books/{bookId}/chapters` | GET | Árvore de capítulos |
| `/api/chapters/{id}` | GET, PUT, DELETE | Propriedades do capítulo |
| `/api/chapters/{chapterId}/speeches` | GET | Carregar falas no canvas |
| `/api/speeches` | POST | Criar fala inline |
| `/api/speeches/{id}` | PUT, DELETE | Editar/excluir fala |
| `/api/chapters/{chapterId}/speeches/reorder` | PUT | Reordenar falas (drag) |
| `/api/chapters/{chapterId}/speeches/bulk` | POST | Importação em lote |
| `/api/books/{bookId}/characters` | GET | Lista de personagens |
| `/api/characters/{id}` | GET, PUT, POST, DELETE | CRUD personagem |
| `/api/characters/{id}/preview-audio` | POST | Preview de voz |
| `/api/voices` | GET | Lista de 30 vozes Gemini |
| `/api/voices/preview` | POST | Preview de voz com texto |
| `/api/chapters/{id}/narration/start` | POST | Iniciar TTS |
| `/api/chapters/{id}/narration/cancel` | POST | Cancelar TTS |
| `/api/chapters/{id}/narration/status` | GET | Status narração |
| `/api/speeches/tools/spell-check` | POST | Correção ortográfica |
| `/api/speeches/tools/suggestions` | POST | Sugestões IA |
| `/api/speeches/tools/character-context` | POST | Enriquecimento contexto |
| `/api/speeches/tools/emotion-image` | POST | Gerar imagem emoção |
| `/api/ssml/validate` | POST | Validar SSML |

### 4.2 Endpoints Novos Necessários

| Endpoint | Método | Descrição |
|---|---|---|
| `/auth/sso/authorize` | GET | Autorização OAuth (novo) |
| `/auth/token` | POST | Troca code por tokens (novo ou adaptar) |
| `/auth/token/refresh` | POST | Refresh token (novo ou adaptar) |
| `/auth/userinfo` | GET | Dados do usuário autenticado (novo ou adaptar) |
| `/api/speeches/{id}/audio` | POST | Gerar áudio individual (simplificar o existente) |
| `/api/speeches/{id}/scene-image` | POST | Gerar imagem de cena (novo) |
| `/api/speeches/{id}/ambient-audio` | POST | Gerar áudio ambiente (novo) |
| `/api/chapters/{id}/soundtrack` | GET, PUT | Trilha sonora do capítulo (novo) |
| `/api/speeches/batch-update` | PUT | Atualizar múltiplas falas de uma vez (novo) |
| `/api/ai/chat` | POST (stream) | Chat com IA para o painel lateral (novo) |

### 4.3 WebSocket — Mesmos Eventos

Os eventos WebSocket existentes funcionam sem alteração:

```
narration:started   → { jobId, chapterId, totalSpeeches }
narration:progress  → { jobId, currentIndex, totalSpeeches }
narration:completed → { jobId, chapterId, audioUrl, duration }
narration:failed    → { jobId, error }
```

**Novo evento sugerido:**
```
ai:stream           → { requestId, chunk, done }  // Streaming do chat IA
```

---

## 5. CORS e Domínios

### 5.1 Estrutura de Domínios

| Serviço | Domínio | Ambiente |
|---|---|---|
| Livrya App (Angular) | `app.livrya.com.br` | Produção |
| Writer's Studio (React) | `write.livrya.com.br` | Produção |
| API Backend | `api.livrya.com.br` | Produção |
| Livrya App (dev) | `localhost:4200` | Desenvolvimento |
| Writer's Studio (dev) | `localhost:5173` | Desenvolvimento |
| API Backend (dev) | `localhost:3000` | Desenvolvimento |

### 5.2 Configuração CORS no Backend

```typescript
// main.ts (NestJS)
app.enableCors({
  origin: [
    'https://app.livrya.com.br',
    'https://write.livrya.com.br',
    // Dev
    'http://localhost:4200',
    'http://localhost:5173',
  ],
  credentials: true,  // Para cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Id'],
});
```

### 5.3 Cookies Cross-Domain

Para refresh tokens via httpOnly cookies entre subdomínios:

```typescript
// Backend ao setar cookie
response.cookie('refresh_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',         // Necessário para cross-site
  domain: '.livrya.com.br', // Compartilhado entre subdomínios
  path: '/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
});
```

---

## 6. Modelos Compartilhados (Shared Types)

### 6.1 Estratégia: Pacote NPM Interno

Criar um pacote `@livrya/types` para compartilhar interfaces entre Angular e React:

```
livrya-types/
├── src/
│   ├── book.ts
│   ├── chapter.ts
│   ├── character.ts
│   ├── speech.ts
│   ├── voice.ts
│   ├── user.ts
│   └── index.ts
├── package.json        # @livrya/types
└── tsconfig.json
```

**Publicação**: npm private registry ou GitHub Packages ou simplesmente como git submodule.

**Consumo**:
```json
// livrya-app/package.json (Angular)
"@livrya/types": "workspace:*"

// livrya-writer/package.json (React)
"@livrya/types": "workspace:*"
```

### 6.2 Alternativa Simples: Copiar Interfaces

Se a complexidade do monorepo não se justifica inicialmente, copiar as interfaces TypeScript do Angular para o React mantendo os mesmos nomes e estruturas. O backend é a fonte de verdade — ambos os frontends consomem os mesmos DTOs.

---

## 7. Navegação entre Apps

### 7.1 Pontos de Transição

| De | Para | Trigger |
|---|---|---|
| Livrya App → Writer's Studio | Botão "Escrever" no perfil do autor | `window.location.href` para `write.livrya.com.br/book/{id}` |
| Livrya App → Writer's Studio | Card de livro em rascunho | Link direto com bookId |
| Writer's Studio → Livrya App | Botão "Voltar para Livrya" | `window.location.href` para `app.livrya.com.br` |
| Writer's Studio → Livrya App | Publicar livro → ver na loja | Redirect com parâmetro |

### 7.2 Deep Links

O Writer's Studio suporta links diretos:

```
write.livrya.com.br/                     → Seletor de livro
write.livrya.com.br/book/{bookId}         → Studio com livro aberto
write.livrya.com.br/book/{bookId}/ch/{n}  → Studio no capítulo N
```

Se o usuário não está autenticado, o SSO fluxo redireciona e retorna ao deep link original.

---

## 8. Deploy e Infraestrutura

### 8.1 Hospedagem

| Opção | Prós | Contras |
|---|---|---|
| **Vercel** | Deploy automático, edge network, preview deploys | Custo em escala |
| **AWS S3 + CloudFront** | Controle total, custo previsível | Mais configuração |
| **Mesma infra do Angular** (Nginx) | Simplicidade, um servidor | Acoplamento de deploy |

**Recomendação**: Vercel para o Writer's Studio (SPA pura, ideal para edge) ou S3 + CloudFront se quiser manter tudo na AWS.

### 8.2 CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy Writer's Studio

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      
      - name: Deploy
        # Vercel, S3, ou outro
```

### 8.3 Variáveis de Ambiente

```env
# .env.production
VITE_API_URL=https://api.livrya.com.br
VITE_SSO_URL=https://app.livrya.com.br/auth/sso/authorize
VITE_SSO_CLIENT_ID=livrya-writer-studio
VITE_WS_URL=wss://api.livrya.com.br
VITE_APP_URL=https://app.livrya.com.br

# .env.development
VITE_API_URL=http://localhost:3000
VITE_SSO_URL=http://localhost:4200/auth/sso/authorize
VITE_SSO_CLIENT_ID=livrya-writer-studio
VITE_WS_URL=ws://localhost:3000
VITE_APP_URL=http://localhost:4200
```

---

## 9. Migração de Funcionalidades

### 9.1 Fases de Implementação

**Fase 1 — Fundação (2-3 semanas)**
- Setup do projeto React + Vite + Tailwind
- Implementar auth SSO (fluxo OAuth completo)
- Implementar camada HTTP com interceptor de token
- Criar stores Zustand (auth, studio, ui)
- Configurar TanStack Query com hooks básicos
- Layout base das 3 zonas (sem funcionalidade)

**Fase 2 — Canvas de Escrita (2-3 semanas)**
- Componente SpeechBlock com renderização literária
- Edição inline de falas (click-to-edit)
- TagToolbar com botões visuais (Pausa, Ênfase, Tom, etc.)
- Tradução SSML visual ↔ XML nos bastidores
- Criação de nova fala inline com seleção de personagem
- Seleção múltipla de falas + toolbar de ações
- Reordenação de falas (drag & drop)
- Modo Foco

**Fase 3 — Sidebar e Navegação (1-2 semanas)**
- Árvore de capítulos com status
- Lista de personagens
- Troca de capítulo no canvas
- CRUD de capítulos
- Ferramentas do capítulo (trilha, narrar, IA, exportar)
- Estatísticas

**Fase 4 — IA e Narração (2-3 semanas)**
- Painel de chat com IA (streaming)
- Ações rápidas de IA (revisar, sugerir, enriquecer, reescrever)
- Integração WebSocket para progresso de narração
- Gerar áudio TTS por fala e por capítulo
- Player de áudio integrado

**Fase 5 — Mídia e Refinamento (1-2 semanas)**
- Gerar imagem de cena por fala
- Gerar áudio ambiente por fala
- Trilha sonora do capítulo
- Editor de personagens (drawer/modal)
- Atalhos de teclado completos
- Auto-save
- i18n

**Fase 6 — Testes e Lançamento (1-2 semanas)**
- Testes unitários (Vitest + Testing Library)
- Testes E2E (Playwright)
- Testes de integração SSO
- Beta com escritores selecionados
- Monitoramento (Sentry, analytics)
- Deploy produção

### 9.2 Estimativa Total

| Cenário | Estimativa |
|---|---|
| 1 dev fullstack dedicado | 10-14 semanas |
| 2 devs (front + back) | 6-8 semanas |
| Time de 3 (2 front + 1 back) | 4-6 semanas |

---

## 10. Checklist Completo

### Backend
- [ ] Implementar endpoints OAuth (`/auth/sso/authorize`, `/auth/token`, etc.)
- [ ] Registrar Writer's Studio como client OAuth
- [ ] Configurar CORS para novo domínio
- [ ] Configurar cookie domain para `.livrya.com.br`
- [ ] Criar endpoint `/api/ai/chat` com streaming
- [ ] Criar endpoint `/api/speeches/{id}/scene-image`
- [ ] Criar endpoint `/api/speeches/{id}/ambient-audio`
- [ ] Criar endpoint `/api/chapters/{id}/soundtrack`
- [ ] Criar endpoint `/api/speeches/batch-update`
- [ ] Adicionar evento WebSocket `ai:stream`
- [ ] Testes de integração SSO

### Frontend (React)
- [ ] Setup projeto (React 19 + Vite + Tailwind 4 + TypeScript)
- [ ] Implementar fluxo SSO completo (PKCE)
- [ ] Configurar HTTP client com refresh automático
- [ ] Configurar WebSocket client
- [ ] Criar stores Zustand (auth, studio, ui)
- [ ] Criar hooks TanStack Query para cada recurso
- [ ] Implementar layout Writer's Studio (3 zonas)
- [ ] Implementar Canvas de escrita com SpeechBlocks
- [ ] Implementar TagToolbar (SSML visual)
- [ ] Implementar edição inline
- [ ] Implementar nova fala inline
- [ ] Implementar seleção múltipla + toolbar
- [ ] Implementar sidebar com árvore de capítulos
- [ ] Implementar lista de personagens
- [ ] Implementar painel de IA com chat
- [ ] Implementar painel de Mídia
- [ ] Implementar painel de Propriedades
- [ ] Implementar Modo Foco
- [ ] Implementar narração TTS + progresso WebSocket
- [ ] Implementar auto-save
- [ ] Implementar atalhos de teclado
- [ ] Implementar i18n (pt-BR, en, es)
- [ ] Testes unitários (Vitest)
- [ ] Testes E2E (Playwright)
- [ ] Setup CI/CD
- [ ] Deploy staging + produção

### Frontend (Angular — Ajustes)
- [ ] Implementar servidor OAuth SSO (`/auth/sso/authorize`)
- [ ] Adicionar botões "Escrever" que redirecionam para Writer's Studio
- [ ] Remover rotas `/writer/*` após migração completa
- [ ] Manter dados compartilhados (livros, personagens) acessíveis

### Infraestrutura
- [ ] Configurar domínio `write.livrya.com.br`
- [ ] Configurar SSL para novo domínio
- [ ] Configurar CDN (CloudFront ou Vercel)
- [ ] Configurar monitoramento (Sentry)
- [ ] Configurar analytics

---

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Sessão SSO não sincroniza logout | Usuário logado em um e deslogado em outro | Implementar backchannel logout ou polling de sessão |
| Latência cross-origin | UX degradada por CORS preflight | Configurar `Access-Control-Max-Age` alto, usar mesmo domínio raiz |
| Duplicação de lógica | Manutenção duplicada Angular/React | Package `@livrya/types` + backend como fonte de verdade |
| Incompatibilidade de SSML | Tags visuais não mapeiam corretamente | Suite de testes de conversão visual ↔ SSML |
| Migração incompleta | Duas versões funcionando em paralelo | Feature flag no Livrya App para redirecionar gradualmente |

---

**Próximos passos**: Iniciar pela Fase 1 (Fundação) com setup do projeto e fluxo SSO, pois todas as outras fases dependem da autenticação funcionando.
