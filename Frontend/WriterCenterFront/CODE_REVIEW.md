# Code Review — Livrya Writer's Studio (WriterCenterFront)

**Data**: 2026-02-14
**Revisor**: Revisão Automatizada
**Escopo**: Análise completa do código-fonte vs. diretrizes de desenvolvimento documentadas
**Documentos de referência**:
- `docs/LivryaWriterStudioReact.md` — Plano de Separação e Arquitetura
- `docs/Livrya Conceito Ux.md` — Conceito de UX v2.0
- `docs/SPRINTS_BACKLOG.md` — Sprint Backlog e Gap Analysis
- `docs/protótipo.jsx` — Protótipo de referência

---

## 1. Resumo das Diretrizes de Desenvolvimento

### 1.1 Arquitetura Definida

O projeto é um **Writer's Studio React 19** extraído do monolito Angular, com:

- **Stack**: React 19 + Vite 6 + TypeScript 5.7 + Tailwind CSS 4
- **Estado**: Zustand para estado global (auth, studio, ui)
- **Data Fetching**: TanStack Query v5 com hooks por recurso
- **UI**: Radix UI + componentes customizados
- **Real-time**: Socket.io para progresso de narração
- **Auth**: OAuth 2.0 + PKCE (SSO com Livrya App Angular)
- **Testes**: Vitest + Testing Library + Playwright (E2E)
- **Formulários**: React Hook Form + Zod

### 1.2 Layout de 3 Zonas

A documentação define um layout **tela única** com:
1. **LeftSidebar** (264px) — Capítulos, Personagens, Ferramentas
2. **Canvas Central** — Texto fluindo como livro, edição inline
3. **RightPanel** (288px) — IA Chat, Mídia, Propriedades
4. **TopBar** (fixa, 48px) e **StatusBar** (36px)

### 1.3 Padrões de UX Exigidos

- Edição **inline** (sem modais para editar falas)
- Tags SSML abstraídas em **botões visuais** (escritor nunca vê XML)
- Tipografia **serifada** no canvas (Source Serif 4)
- Tipografia **sans-serif** nos controles (DM Sans)
- **Tema escuro** com cor de destaque amber
- **Modo Foco** que esconde sidebars
- **Auto-save** para não perder trabalho
- **Atalhos de teclado** (Ctrl+Enter, Esc, etc.)
- **Drag & drop** para reordenação de falas e capítulos

### 1.4 Contrato de API

A documentação especifica endpoints existentes no backend (CRUD de books, chapters, speeches, characters, voices, narração, ferramentas IA) e endpoints novos necessários (ai/chat, speeches/audio individual, scene-image, ambient-audio, soundtrack, batch-update).

---

## 2. Code Review Detalhado

### 2.1 Arquitetura e Estrutura de Diretórios

**Veredicto**: ✅ CONFORME

A estrutura implementada segue fielmente o plano documentado:

```
src/
├── app/           ✅ Router + App
├── auth/          ✅ AuthGuard + AuthCallback (OAuth PKCE)
├── features/
│   ├── book-selector/  ✅ Seleção de livro
│   ├── dashboard/      ✅ Dashboard do autor (extra, não documentado mas útil)
│   └── studio/         ✅ Layout 3 zonas completo
│       ├── components/
│       │   ├── Canvas/       ✅ SpeechBlock, DnD, TagToolbar
│       │   ├── LeftSidebar/  ✅ ChapterTree, CharacterList, Tools
│       │   ├── RightPanel/   ✅ AiChat, MediaPanel, PropertiesPanel
│       │   ├── TopBar/       ✅ Navegação, seleção, exportação
│       │   └── StatusBar/    ✅ Estatísticas
│       └── hooks/            ✅ useStudio, useSpeechEditor, useAutoSave
├── shared/
│   ├── api/       ✅ HTTP + WebSocket + Endpoints
│   ├── hooks/     ✅ TanStack Query hooks por recurso
│   ├── stores/    ✅ Zustand (auth, studio, ui)
│   ├── types/     ✅ TypeScript types completos
│   └── lib/       ✅ Utilitários
└── styles/        ✅ CSS global
```

---

### 2.2 Autenticação (OAuth 2.0 + PKCE)

**Veredicto**: ⚠️ PARCIALMENTE CONFORME — 4 problemas encontrados

#### Problema 2.2.1 — Token não restaurado ao recarregar a página (CRÍTICO)

**Arquivo**: `src/shared/stores/auth.store.ts:49-54`
**Arquivo**: `src/shared/api/http.ts:80`

O `auth.store.ts` persiste `user` e `isAuthenticated` no localStorage, mas **exclui os tokens** da persistência:

```typescript
partialize: (state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  // ❌ tokens NÃO é persistido
}),
```

O `http.ts` armazena o access token em memória (`accessTokenCache`). Ao recarregar a página:
1. `isAuthenticated = true` (restaurado do localStorage)
2. `accessTokenCache = null` (memória limpa)
3. A primeira request vai sem token → 401

O `AuthGuard` tenta bootstrap via `/oauth/userinfo`, o que pode funcionar se o backend enviar o token pelo cookie httpOnly, mas isso depende de um header customizado `x-access-token` na resposta — um padrão frágil.

**Recomendação**: Ou persistir o access token no store (com cuidado de segurança), ou garantir que o fluxo de refresh via cookie httpOnly funcione de forma confiável antes de considerar o usuário autenticado.

---

#### Problema 2.2.2 — Inconsistência de referência a env vars no AuthCallback

**Arquivo**: `src/auth/AuthCallback.tsx:45-46`

O `AuthCallback` usa `import.meta.env.VITE_SSO_REDIRECT_URI` diretamente em vez do objeto `env` centralizado:

```typescript
redirect_uri: import.meta.env.VITE_SSO_REDIRECT_URI,
client_id: import.meta.env.VITE_SSO_CLIENT_ID,
```

Enquanto o `AuthGuard` usa corretamente `env.ssoRedirectUri` e `env.ssoClientId`.

**Recomendação**: Usar `env.ssoRedirectUri` e `env.ssoClientId` no `AuthCallback` para manter consistência e centralização.

---

#### Problema 2.2.3 — Falta limpeza de PKCE/state em caso de erro

**Arquivo**: `src/auth/AuthCallback.tsx:76-78`

Em caso de erro, o `sessionStorage` com `pkce_verifier` e `oauth_state` **não é limpo**:

```typescript
} catch (err) {
  console.error('Auth callback error:', err);
  setError(err instanceof Error ? err.message : 'Authentication failed');
  // ❌ Não limpa sessionStorage em caso de erro
}
```

Dados de PKCE obsoletos podem causar problemas em tentativas subsequentes.

**Recomendação**: Adicionar limpeza do sessionStorage no bloco `catch` ou em um `finally`.

---

#### Problema 2.2.4 — eslint-disable sem justificativa

**Arquivo**: `src/auth/AuthCallback.tsx:18`

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

O `handleCallback` é chamado no `useEffect` sem ser listado como dependência. Isso pode causar closures obsoletas.

**Recomendação**: Envolver `handleCallback` em `useCallback` com as dependências corretas, ou reestruturar o efeito.

---

### 2.3 Gerenciamento de Estado (Zustand)

**Veredicto**: ✅ CONFORME — com 1 observação

Os três stores estão bem separados por domínio:
- `auth.store.ts` — Estado de autenticação e sessão
- `studio.store.ts` — Livro/capítulo ativo, estado de edição
- `ui.store.ts` — Preferências de UI, seleção, painéis

**Observação 2.3.1** — `studio.store.ts` não é persistido

O `studio.store` não usa `persist`, então ao recarregar a página o livro/capítulo ativo é perdido. Isso é aceitável se a URL contém os IDs (o router usa `/book/:bookId/ch/:chapterId`), mas pode causar flash de conteúdo vazio.

---

### 2.4 Camada de API (HTTP + WebSocket)

**Veredicto**: ⚠️ PARCIALMENTE CONFORME — 3 problemas

#### Problema 2.4.1 — WebSocket usa localStorage para token, HTTP usa memória (INCONSISTENTE)

**Arquivo**: `src/shared/api/websocket.ts:76-77`

```typescript
auth: () => {
  const token = localStorage.getItem('access_token');
  return token ? { token } : {};
},
```

O WebSocket busca o token em `localStorage.getItem('access_token')`, mas o HTTP client armazena em memória (`accessTokenCache`). Como o token nunca é salvo no localStorage, **o WebSocket sempre conecta sem autenticação**.

**Recomendação**: Usar `getAccessToken()` do `http.ts` em vez de `localStorage.getItem('access_token')`.

---

#### Problema 2.4.2 — Endpoints duplicados para mídia

**Arquivo**: `src/shared/api/endpoints.ts:45-47` e `src/shared/api/endpoints.ts:66-71`

Os endpoints de mídia estão definidos em dois lugares:

```typescript
// Em speeches:
audio: (id: string) => `/speeches/${id}/audio`,
sceneImage: (id: string) => `/speeches/${id}/scene-image`,
ambientAudio: (id: string) => `/speeches/${id}/ambient-audio`,

// Em media:
sceneImage: (speechId: string) => `/speeches/${speechId}/scene-image`,
ambientAudio: (speechId: string) => `/speeches/${speechId}/ambient-audio`,
```

`speeches.sceneImage` e `media.sceneImage` geram a mesma URL. Isso cria ambiguidade sobre qual usar.

**Recomendação**: Remover a duplicação. Manter os endpoints de mídia por fala em `speeches` e os de capítulo em `media` (ou consolidar num grupo só).

---

#### Problema 2.4.3 — Endpoint de reorder de capítulos hardcoded

**Arquivo**: `src/shared/hooks/useChapters.ts:119`

```typescript
await http.put(`/books/${bookId}/chapters/reorder`, dto);
```

O endpoint é construído manualmente com string literal em vez de usar `endpoints.chapters.reorder`. O hook inclusive tem comentários extensos de debug mostrando confusão:

```typescript
// Endpoint correto para reorder chapters de um livro seria /books/{id}/chapters/reorder ou similar
// Mas o endpoint.ts tem: reorder: (chapterId: string) => `/chapters/${chapterId}/reorder`
// Isso parece estranho para reordenar A LISTA de capítulos...
```

**Recomendação**: Corrigir `endpoints.chapters.reorder` para aceitar `bookId` e gerar `/books/${bookId}/chapters/reorder`, ou adicionar um endpoint separado para reordenação de lista.

---

### 2.5 Hooks TanStack Query

**Veredicto**: ✅ BOM — com 2 observações

Os hooks estão bem estruturados com:
- Query keys consistentes e organizadas
- `staleTime: 30_000` adequado para dados deste tipo
- Invalidação de queries correta no `onSuccess` de mutations
- Hook de narração com WebSocket bem integrado

#### Observação 2.5.1 — Console.log de debug em produção

**Arquivo**: `src/shared/hooks/useChapters.ts:17-35`

O hook `useChapters` contém múltiplos `console.log` de debug que não deveriam ir para produção:

```typescript
console.log('[useChapters] Fetching chapters for bookId:', bookId);
console.log('[useChapters] Endpoint:', endpoint);
console.log('[useChapters] Base URL:', http.defaults.baseURL);
console.log('[useChapters] Response status:', response.status);
console.log('[useChapters] Chapters loaded:', chapters.length);
```

**Recomendação**: Remover esses logs ou migrar para o `debugLogger` já existente no projeto.

---

#### Observação 2.5.2 — useDeleteSpeech recebe chapterId desnecessariamente

**Arquivo**: `src/shared/hooks/useSpeeches.ts:73`

```typescript
mutationFn: async ({ id, chapterId: _chapterId }: { id: string; chapterId: string })
```

O `_chapterId` é prefixado com underscore indicando que não é usado no `mutationFn`, mas é necessário no `onSuccess` para invalidar queries. Uma interface mais clara seria separar os dados de mutação da metainfo de invalidação.

---

### 2.6 Canvas e SpeechBlock

**Veredicto**: ✅ BOM — com 2 problemas

O Canvas implementa corretamente:
- Drag & drop com `@dnd-kit`
- Edição inline de falas
- Estado otimista durante reordenação
- Indicadores de progresso de narração em tempo real

#### Problema 2.6.1 — Anti-pattern de state sync no Canvas (IMPORTANTE)

**Arquivo**: `src/features/studio/components/Canvas/Canvas.tsx:50-55`

```typescript
const [localSpeeches, setLocalSpeeches] = useState(speeches ?? []);

// Update local state when speeches data changes
if (speeches && speeches !== localSpeeches) {
  setLocalSpeeches(speeches);
}
```

Este padrão de sincronização de estado derivado dentro do corpo do render é um anti-pattern que pode causar loops de re-render ou glitches de UI. O `setState` durante o render é aceito pelo React mas deve ser feito com cuidado.

**Recomendação**: Usar `useMemo` para derivar o estado local ou `useEffect` para sincronizar, ou melhor ainda, usar a API de `useSyncExternalStore` ou simplesmente trabalhar com os dados do query diretamente, usando estado local apenas durante o drag.

---

#### Problema 2.6.2 — TagToolbar expõe XML SSML ao usuário (VIOLA DIRETRIZ DE UX)

**Arquivo**: `src/features/studio/components/Canvas/TagToolbar.tsx:23-62`

A documentação de UX (seção 1.4) é enfática:

> "Escritores não são desenvolvedores. Tags SSML criam uma barreira técnica desnecessária."
> "As tags SSML são abstraídas em botões visuais"

No entanto, a implementação insere **XML bruto** diretamente no texto:

```typescript
{ label: 'Pausa', tag: '<break time="500ms"/>', ... },
{ label: 'Ênfase', tag: '<emphasis level="moderate"> </emphasis>', ... },
{ label: 'Tom+',   tag: '<prosody pitch="+2st"> </prosody>', ... },
{ label: 'Sussurro', tag: '<amazon:effect name="whispered"> </amazon:effect>', ... },
```

O Sprint Backlog (`SPRINTS_BACKLOG.md`) confirma que isso está em 60% de implementação e que "a lógica de inserção/conversão SSML ↔ visual é a funcionalidade mais complexa do frontend ainda não implementada".

**Status**: Gap reconhecido. A camada de abstração visual que converte marcadores visuais (ex: `⏸ 500ms`) em XML SSML nos bastidores ainda não foi implementada (Sprint 4, task F4.2).

---

### 2.7 AiChat (Streaming SSE)

**Veredicto**: ✅ BOM — com 1 problema

A implementação de streaming SSE é funcional e bem feita:
- Parsing de `data: {...}\n\n` via `ReadableStream`
- Fallback para resposta JSON se `response.body` ausente
- Acúmulo progressivo de tokens
- Ações rápidas integradas

#### Problema 2.7.1 — Module-level mutable state para IDs de mensagem

**Arquivo**: `src/features/studio/components/RightPanel/AiChat.tsx:23-24`

```typescript
let msgCounter = 0;
const nextId = () => String(++msgCounter);
```

Um contador mutável no escopo do módulo é compartilhado entre todas as instâncias do componente. Se o componente for montado/desmontado várias vezes (troca de aba), os IDs continuam incrementando, o que não é um bug mas é um padrão frágil.

**Recomendação**: Usar `useRef` para o contador, ou `crypto.randomUUID()`.

---

### 2.8 Auto-Save

**Veredicto**: ✅ CONFORME

O hook `useAutoSave` implementa corretamente:
- Debounce de 3 segundos
- Verificação de `isDirty` e `editingSpeechId`
- Proteção contra save de texto vazio
- Cleanup do timeout no unmount
- Error handling que mantém `isDirty = true` se falhar

---

### 2.9 Segurança

**Veredicto**: ⚠️ 2 problemas

#### Problema 2.9.1 — Token exposto na URL (CRÍTICO)

**Arquivo**: `src/features/studio/components/TopBar/TopBar.tsx:291`

```typescript
window.open(`${env.apiUrl}/chapters/${activeChapterId}/export/print?token=${getAccessToken()}`, '_blank')
```

O access token JWT é incluído como **query parameter** na URL. Isso é um risco de segurança:
- O token fica visível na barra de endereço
- Fica no histórico do navegador
- Pode ser logado por proxies e servidores web
- Pode ser enviado em headers `Referer`

**Recomendação**: Usar um endpoint que aceite o token via header Authorization, ou gerar um token de curta duração específico para download/impressão.

---

#### Problema 2.9.2 — `window.confirm` para ações destrutivas

**Arquivo**: `src/features/studio/components/Canvas/SpeechBlock.tsx:308`
**Arquivo**: `src/features/studio/components/TopBar/TopBar.tsx:156`

```typescript
if (window.confirm('Tem certeza que deseja excluir esta fala?')) {
```

Usar `window.confirm` é funcional mas inconsistente com o resto da UI que usa Radix UI. Um dialog customizado manteria a consistência visual e permitiria melhor UX (ex: informar qual fala será excluída).

---

### 2.10 Tipografia e Estilização

**Veredicto**: ⚠️ PARCIALMENTE CONFORME

#### Problema 2.10.1 — Fontes do protótipo não aplicadas no código

**Arquivo**: `docs/protótipo.jsx:397` define:
```jsx
fontFamily: "'Source Serif 4', 'Lora', Georgia, serif"  // Canvas
fontFamily: "'DM Sans', sans-serif"                      // Controles
```

O protótipo usa `Source Serif 4` no canvas e `DM Sans` nos controles. No código implementado, **nenhuma dessas fontes é configurada** nos componentes ou no CSS global. O código usa apenas as fontes padrão do Tailwind.

A documentação de UX (seção 1.8) especifica:
> "Tipografia serifada (Source Serif 4) no canvas — como escrever em um livro real"
> "Tipografia sans-serif (DM Sans) nos controles — clareza funcional"

**Recomendação**: Configurar as fontes Source Serif 4 e DM Sans via `@font-face` ou Google Fonts e aplicar no canvas e nos controles conforme documentado.

---

### 2.11 Testes

**Veredicto**: ❌ NÃO CONFORME — Cobertura mínima

O Sprint Backlog registra:
- Testes unitários: 20%
- Testes E2E: 0%
- i18n: 0%
- CI/CD: 0%

A documentação define como meta:
> "Coverage > 70%, 3+ fluxos E2E verdes, todas as strings externalizadas em pt-BR"

O `src/test/setup.ts` existe com mocks de localStorage/sessionStorage, mas praticamente nenhum teste foi escrito ainda para os hooks, stores e componentes.

---

### 2.12 Performance e Boas Práticas React

**Veredicto**: ✅ BOM — com 1 observação

Pontos positivos:
- Uso correto de `useCallback` e `useMemo` onde necessário
- Componentes bem granularizados
- Lazy loading de rotas (`React.lazy`)
- Invalidação eficiente de queries

#### Observação 2.12.1 — useNarration instanciado em dois lugares

**Arquivo**: `src/features/studio/components/Canvas/Canvas.tsx:39`
**Arquivo**: `src/features/studio/components/LeftSidebar/LeftSidebar.tsx:32`

O hook `useNarration(activeChapterId)` é chamado tanto no `Canvas` quanto no `LeftSidebar`. Cada chamada cria listeners WebSocket independentes e estado local separado. Isso pode causar:
- Dois conjuntos de event listeners para os mesmos eventos
- Estado de narração dessincronizado entre os componentes

**Recomendação**: Elevar o hook `useNarration` para o `StudioPage` e passar os dados como props, ou criar um contexto de narração.

---

## 3. Resumo de Severidade

### Críticos (devem ser corrigidos antes de produção)

| # | Problema | Arquivo | Seção |
|---|----------|---------|-------|
| 1 | Token exposto na URL como query param | `TopBar.tsx:291` | 2.9.1 |
| 2 | WebSocket usa localStorage para token (sempre vazio) | `websocket.ts:76` | 2.4.1 |
| 3 | Token não restaurado ao recarregar (UX de sessão frágil) | `auth.store.ts:49-54` | 2.2.1 |

### Importantes (impactam qualidade e manutenção)

| # | Problema | Arquivo | Seção |
|---|----------|---------|-------|
| 4 | TagToolbar insere XML bruto (viola diretriz UX) | `TagToolbar.tsx` | 2.6.2 |
| 5 | Anti-pattern de state sync no Canvas | `Canvas.tsx:50-55` | 2.6.1 |
| 6 | Endpoint de reorder hardcoded com comentários de confusão | `useChapters.ts:104-119` | 2.4.3 |
| 7 | Console.log de debug em código de produção | `useChapters.ts:17-35` | 2.5.1 |
| 8 | Inconsistência de env vars no AuthCallback | `AuthCallback.tsx:45-46` | 2.2.2 |
| 9 | useNarration instanciado duplicado | `Canvas.tsx` + `LeftSidebar.tsx` | 2.12.1 |
| 10 | Fontes do protótipo (Source Serif 4, DM Sans) não aplicadas | Global | 2.10.1 |

### Menores (melhorias de qualidade)

| # | Problema | Arquivo | Seção |
|---|----------|---------|-------|
| 11 | Falta limpeza de PKCE em caso de erro | `AuthCallback.tsx:76` | 2.2.3 |
| 12 | eslint-disable sem justificativa | `AuthCallback.tsx:18` | 2.2.4 |
| 13 | Module-level mutable state no AiChat | `AiChat.tsx:23` | 2.7.1 |
| 14 | Endpoints de mídia duplicados | `endpoints.ts` | 2.4.2 |
| 15 | `window.confirm` em vez de dialog customizado | `SpeechBlock.tsx`, `TopBar.tsx` | 2.9.2 |

---

## 4. Status de Conformidade com as Sprints

| Sprint | Status | Gaps |
|--------|--------|------|
| **Fundação** | ✅ 100% | - |
| **Types** | ✅ 100% | - |
| **State Management** | ✅ 100% | Observação sobre não-persistência do studio store |
| **HTTP + Interceptors** | ✅ 100% | Token refresh funcional |
| **WebSocket** | ⚠️ 90% | Token de auth não é enviado corretamente |
| **Auth (SSO/PKCE)** | ⚠️ 85% | 4 problemas listados na seção 2.2 |
| **TanStack Query** | ✅ 100% | Hooks completos para todos os recursos |
| **Layout 3 zonas** | ✅ 100% | - |
| **Canvas + Edição Inline** | ✅ 95% | Anti-pattern de state sync |
| **Canvas + DnD** | ✅ 100% | - |
| **TagToolbar (SSML)** | ⚠️ 60% | Falta abstração visual (Sprint 4) |
| **ChapterTree + DnD** | ✅ 100% | - |
| **CharacterList** | ✅ 95% | - |
| **AiChat Streaming** | ✅ 85% | Depende de endpoint backend |
| **MediaPanel** | ⚠️ 40% | Depende de endpoints backend |
| **PropertiesPanel** | ⚠️ 50% | Campos básicos implementados |
| **Auto-save** | ✅ 100% | - |
| **Atalhos** | ✅ 90% | - |
| **TopBar/StatusBar** | ✅ 95% | Token na URL é risco de segurança |
| **Testes Unitários** | ❌ 20% | Meta: >70% |
| **Testes E2E** | ❌ 0% | Meta: 3+ fluxos |
| **i18n** | ❌ 0% | Não iniciado |
| **CI/CD** | ❌ 0% | Não iniciado |

---

## 5. Recomendações Prioritárias

### Prioridade 1 — Segurança (Imediato)

1. **Remover token da URL** em `TopBar.tsx:291`. Criar endpoint de download com token temporário ou usar Authorization header.
2. **Corrigir WebSocket auth** em `websocket.ts:76`. Usar `getAccessToken()` em vez de `localStorage.getItem('access_token')`.

### Prioridade 2 — Estabilidade de Sessão

3. **Resolver restauração de sessão** ao recarregar. O fluxo de bootstrap em `AuthGuard` precisa ser robusto o suficiente para funcionar via cookie httpOnly, ou o token precisa ser persistido de forma segura.
4. **Limpar PKCE/state** no catch do `AuthCallback`.
5. **Padronizar uso de `env.*`** no `AuthCallback` (usar `env.ssoRedirectUri` em vez de `import.meta.env`).

### Prioridade 3 — Qualidade de Código

6. **Remover console.logs** de debug em `useChapters.ts`.
7. **Corrigir endpoint de reorder** e remover comentários de confusão em `useChapters.ts`.
8. **Remover endpoints duplicados** de mídia em `endpoints.ts`.
9. **Refatorar state sync** no `Canvas.tsx` para usar padrão recomendado pelo React.

### Prioridade 4 — UX Conforme Documentação

10. **Implementar abstração visual SSML** (Sprint 4, F4.2) — Esta é a funcionalidade mais complexa pendente.
11. **Configurar fontes** Source Serif 4 e DM Sans conforme protótipo.
12. **Substituir `window.confirm`** por dialogs Radix UI.

### Prioridade 5 — Qualidade Geral

13. **Escrever testes unitários** para hooks críticos (useSpeeches, useChapters, useNarration).
14. **Escrever testes E2E** para fluxo completo de CRUD.
15. **Elevar useNarration** para evitar instâncias duplicadas.
16. **Implementar i18n** com react-i18next.
17. **Configurar CI/CD** com GitHub Actions.

---

## 6. Conclusão

O projeto WriterCenterFront está em **bom estado de implementação** com ~75% do escopo total concluído. A arquitetura segue fielmente o plano documentado, com separação clara de responsabilidades e uso adequado das tecnologias definidas.

Os **3 problemas críticos de segurança** (token na URL, WebSocket sem auth, sessão frágil) devem ser resolvidos antes de qualquer deploy em produção.

Os **gaps de funcionalidade** (TagToolbar SSML, MediaPanel, Testes, i18n) estão corretamente mapeados no Sprint Backlog e têm plano de execução definido.

A qualidade geral do código é **boa**, com patterns React modernos, tipagem TypeScript consistente, e boa separação de concerns. Os problemas encontrados são típicos de um projeto em desenvolvimento ativo e não indicam falhas arquiteturais fundamentais.
