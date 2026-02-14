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

## 2. Code Review Detalhado (Revisão Inicial)

### 2.1 Arquitetura e Estrutura de Diretórios — ✅ CONFORME

A estrutura implementada segue fielmente o plano documentado:

```
src/
├── app/           ✅ Router + App
├── auth/          ✅ AuthGuard + AuthCallback (OAuth PKCE)
├── features/
│   ├── book-selector/  ✅ Seleção de livro
│   ├── dashboard/      ✅ Dashboard do autor
│   └── studio/         ✅ Layout 3 zonas completo
│       ├── components/
│       │   ├── Canvas/       ✅ SpeechBlock, DnD, TagToolbar
│       │   ├── LeftSidebar/  ✅ ChapterTree, CharacterList, Tools
│       │   ├── RightPanel/   ✅ AiChat, MediaPanel, PropertiesPanel
│       │   ├── TopBar/       ✅ Navegação, seleção, exportação
│       │   └── StatusBar/    ✅ Estatísticas
│       ├── hooks/            ✅ useStudio, useSpeechEditor, useAutoSave
│       └── context/          ✅ NarrationContext, CharacterWizardContext (NOVO)
├── shared/
│   ├── api/       ✅ HTTP + WebSocket + Endpoints
│   ├── hooks/     ✅ TanStack Query hooks por recurso
│   ├── stores/    ✅ Zustand (auth, studio, ui)
│   ├── types/     ✅ TypeScript types completos
│   └── lib/       ✅ Utilitários
└── styles/        ✅ CSS global
```

---

## 3. Resultado da Reavaliação Pós-Rebase com Main

Após o rebase com `origin/main`, reavaliamos todos os 15 pontos de atenção identificados na revisão inicial.

### 3.1 Tabela de Status

| # | Problema | Severidade | Status | Detalhes |
|---|----------|------------|--------|----------|
| 1 | Token exposto na URL (TopBar.tsx) | CRÍTICO | ✅ **CORRIGIDO** | Agora usa `fetch()` com header `Authorization: Bearer` e faz download via blob |
| 2 | WebSocket usa localStorage (websocket.ts) | CRÍTICO | ✅ **CORRIGIDO** | Agora usa `getAccessToken()` do módulo http |
| 3 | Token não restaurado ao recarregar (auth.store.ts) | CRÍTICO | ✅ **CORRIGIDO** | `partialize` agora inclui `tokens` na persistência |
| 4 | TagToolbar insere XML bruto | IMPORTANTE | ⚠️ **PENDENTE** | Ainda insere tags SSML brutas — Sprint 4 (F4.2) |
| 5 | Anti-pattern state sync Canvas | IMPORTANTE | ✅ **CORRIGIDO** | Agora usa `useEffect` com dependência em `speeches` |
| 6 | Endpoint reorder hardcoded (useChapters.ts) | IMPORTANTE | ⚠️ **PARCIAL** | Comentários de confusão removidos, mas URL ainda hardcoded |
| 7 | Console.log de debug (useChapters.ts) | IMPORTANTE | ⚠️ **PARCIAL** | Reduzido de 5 logs para 2 (`console.warn` e `console.error`) |
| 8 | Inconsistência env vars AuthCallback | IMPORTANTE | ✅ **CORRIGIDO** | Agora usa `env.ssoRedirectUri` corretamente |
| 9 | useNarration instanciado duplicado | IMPORTANTE | ✅ **CORRIGIDO** | Elevado para `NarrationContext` — ambos consomem via `useNarrationContext()` |
| 10 | Fontes Source Serif 4 / DM Sans | IMPORTANTE | ❌ **PENDENTE** | Nenhuma fonte configurada — CSS usa Inter/system-ui |
| 11 | Falta limpeza PKCE em caso de erro | MENOR | ✅ **CORRIGIDO** | `sessionStorage.removeItem()` no bloco `catch` |
| 12 | eslint-disable sem justificativa | MENOR | ✅ **CORRIGIDO** | Mantido com comentário explicativo adequado |
| 13 | Module-level counter AiChat | MENOR | ❌ **PENDENTE** | Ainda usa `let msgCounter = 0` no escopo do módulo |
| 14 | Endpoints mídia duplicados | MENOR | ✅ **CORRIGIDO** | Duplicações removidas do endpoints.ts |
| 15 | `window.confirm` em vez de Radix Dialog | MENOR | ❌ **PENDENTE** | 2 ocorrências em TopBar.tsx:156 e SpeechBlock.tsx:308 |

### 3.2 Resumo de Progresso

| Status | Quantidade |
|--------|-----------|
| ✅ Corrigidos | **10** (67%) |
| ⚠️ Parcialmente corrigidos | **2** (13%) |
| ❌ Pendentes | **3** (20%) |

### 3.3 Novas Features Adicionadas (via main)

| Feature | Descrição |
|---------|-----------|
| **NarrationContext** | Contexto React que centraliza estado de narração (resolve ponto #9) |
| **CharacterWizardContext** | Contexto para modal de wizard de personagens |
| **useWizardAutoSave** | Hook de auto-save para dados do wizard de personagens |
| **Character Wizard** | Suite completa de wizard para cadastro de personagens com testes |

---

## 4. Plano de Desenvolvimento — Pontos Pendentes

### Sprint A — Correções Rápidas (Estimativa: 1 dia)

Itens que podem ser resolvidos rapidamente sem impacto arquitetural.

#### A.1 — Substituir module-level counter no AiChat

**Arquivo**: `src/features/studio/components/RightPanel/AiChat.tsx`
**Problema**: `let msgCounter = 0` no escopo do módulo é compartilhado entre instâncias.

**Plano de implementação**:
1. Substituir o `let msgCounter` por `useRef(0)` dentro do componente `AiChat`
2. Atualizar `nextId()` para ser um `useCallback` que usa `counterRef.current++`
3. Alternativa mais simples: usar `crypto.randomUUID()` para gerar IDs únicos

**Arquivos a alterar**: `AiChat.tsx` (1 arquivo)

---

#### A.2 — Substituir `window.confirm` por ConfirmDialog Radix

**Arquivos**: `SpeechBlock.tsx:308`, `TopBar.tsx:156`
**Problema**: `window.confirm()` quebra a consistência visual com o tema dark/Radix.

**Plano de implementação**:
1. Criar componente `src/shared/components/ConfirmDialog.tsx` usando `@radix-ui/react-alert-dialog`
   - Props: `open`, `onConfirm`, `onCancel`, `title`, `description`, `confirmLabel`, `variant` ('danger' | 'default')
   - Estilo consistente com tema zinc/amber
2. Em `SpeechBlock.tsx`: substituir `window.confirm` por state `showDeleteConfirm` + `<ConfirmDialog>`
3. Em `TopBar.tsx`: substituir `window.confirm` do delete em lote pelo mesmo componente

**Arquivos a alterar**: 3 (1 novo + 2 existentes)

**Exemplo de API**:
```tsx
<ConfirmDialog
  open={showDeleteConfirm}
  onOpenChange={setShowDeleteConfirm}
  title="Excluir fala"
  description="Tem certeza que deseja excluir esta fala? Esta ação não pode ser desfeita."
  confirmLabel="Excluir"
  variant="danger"
  onConfirm={() => actions.deleteSpeech.mutate(speech)}
/>
```

---

#### A.3 — Limpar console.warn/error residuais em useChapters

**Arquivo**: `src/shared/hooks/useChapters.ts:29,34`
**Problema**: Logs de warn/error em produção sem flag de debug.

**Plano de implementação**:
1. Remover `console.warn` na linha 29 (formato inesperado é tratado pelo fallback `[]`)
2. Manter `console.error` na linha 34 mas envolver em verificação de modo desenvolvimento:
   ```typescript
   if (import.meta.env.DEV) {
     console.error('[useChapters] Error fetching chapters:', error);
   }
   ```
3. Ou remover completamente (o TanStack Query já captura e expõe erros via `isError`)

**Arquivos a alterar**: 1

---

#### A.4 — Centralizar endpoint de reorder no endpoints.ts

**Arquivo**: `src/shared/hooks/useChapters.ts:105` e `src/shared/api/endpoints.ts`

**Plano de implementação**:
1. Em `endpoints.ts`, adicionar:
   ```typescript
   chapters: {
     ...existing,
     reorderByBook: (bookId: string) => `/books/${bookId}/chapters/reorder`,
   }
   ```
2. Em `useChapters.ts`, substituir:
   ```typescript
   // De:
   await http.put(`/books/${bookId}/chapters/reorder`, dto);
   // Para:
   await http.put(endpoints.chapters.reorderByBook(bookId), dto);
   ```

**Arquivos a alterar**: 2

---

### Sprint B — Configuração de Fontes (Estimativa: 2-3 horas)

#### B.1 — Configurar fontes Source Serif 4 e DM Sans

**Problema**: O protótipo e a documentação de UX especificam fontes que não estão configuradas.

**Plano de implementação**:

1. **Adicionar Google Fonts no `index.html`**:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
   ```

2. **Atualizar `src/styles/index.css`**:
   ```css
   body {
     font-family: 'DM Sans', Inter, system-ui, sans-serif;
   }

   .font-serif-canvas {
     font-family: 'Source Serif 4', 'Lora', Georgia, serif;
   }
   ```

3. **Aplicar no Canvas** — Adicionar classe `font-serif-canvas` ao container de texto em:
   - `Canvas.tsx` — container principal do canvas
   - `SpeechBlock.tsx` — área de texto da fala (tanto modo leitura quanto textarea de edição)

4. **Verificar** que controles (TopBar, StatusBar, LeftSidebar, RightPanel) usam DM Sans via o body default.

**Arquivos a alterar**: 4 (`index.html`, `index.css`, `Canvas.tsx`, `SpeechBlock.tsx`)

---

### Sprint C — Abstração Visual SSML (Estimativa: 2-3 dias)

> Corresponde ao Sprint 4, Task F4.2 do backlog original.

#### C.1 — TagToolbar: Camada de Abstração Visual ↔ SSML

**Problema**: O TagToolbar insere XML SSML bruto no texto, violando a diretriz de UX.

**Plano de implementação**:

1. **Definir formato de marcador visual**:
   ```
   ⏸500ms         → <break time="500ms"/>
   ⟨ênfase⟩...⟨/ênfase⟩  → <emphasis level="moderate">...</emphasis>
   ⟨tom+2⟩...⟨/tom+2⟩   → <prosody pitch="+2st">...</prosody>
   ```

2. **Criar módulo `src/shared/lib/ssml.ts`** com:
   - `visualToSSML(text: string): string` — converte marcadores visuais para XML SSML
   - `ssmlToVisual(ssml: string): string` — converte XML SSML para marcadores visuais
   - `VISUAL_MARKERS` — mapa de marcadores visuais com seus SSML equivalentes
   - Testes unitários para round-trip conversion

3. **Atualizar `TagToolbar.tsx`**:
   - Botões inserem **marcadores visuais** em vez de XML
   - Tooltip mostra o que o marcador faz, não o XML
   - Marcadores renderizados com estilo visual distinto (badges coloridos inline)

4. **Atualizar `useSpeechEditor.ts`**:
   - Antes de salvar (saveEdit), converter marcadores visuais → SSML
   - Ao carregar para edição (startEdit), converter SSML → marcadores visuais

5. **Atualizar `SpeechBlock.tsx`**:
   - No modo leitura, renderizar marcadores visuais como badges inline (ex: chip `⏸ 500ms` em cinza)

**Arquivos a criar**: 1 (`ssml.ts` + testes)
**Arquivos a alterar**: 3 (`TagToolbar.tsx`, `useSpeechEditor.ts`, `SpeechBlock.tsx`)

**Critério de conclusão**: O escritor nunca vê XML. Marcadores visuais são intuitivos e a conversão round-trip é testada.

---

### Sprint D — Testes e Qualidade (Estimativa: 1-2 semanas)

> Corresponde ao Sprint 7 do backlog original.

#### D.1 — Testes Unitários para Hooks Críticos

**Prioridade**: Hooks que fazem chamadas API e gerenciam estado complexo.

| Hook | Arquivo | Cobertura Necessária |
|------|---------|---------------------|
| `useSpeeches` | `shared/hooks/useSpeeches.ts` | CRUD completo, invalidação de queries |
| `useChapters` | `shared/hooks/useChapters.ts` | CRUD + reorder, parse de resposta |
| `useNarration` | `shared/hooks/useNarration.ts` | WebSocket events, state transitions |
| `useAutoSave` | `studio/hooks/useAutoSave.ts` | Debounce, dirty state, error recovery |
| `useSpeechEditor` | `studio/hooks/useSpeechEditor.ts` | Start/save/cancel, keyboard shortcuts |

**Setup**: Usar `@testing-library/react` com wrapper do QueryClient e mocks de `http`.

#### D.2 — Testes de Stores

| Store | Arquivo | Cobertura |
|-------|---------|-----------|
| `auth.store` | `shared/stores/auth.store.ts` | login, logout, persistence, token sync |
| `studio.store` | `shared/stores/studio.store.ts` | editing lifecycle, dirty state |
| `ui.store` | `shared/stores/ui.store.ts` | panels, selection, focus mode |

#### D.3 — Testes E2E (Playwright)

| Cenário | Descrição |
|---------|-----------|
| Fluxo de Auth | SSO redirect → Callback → Token storage → Acesso |
| CRUD Speeches | Criar → Editar inline → Salvar → Deletar |
| Drag & Drop | Reordenar falas e capítulos |

---

### Sprint E — i18n e CI/CD (Estimativa: 1 semana)

#### E.1 — Internacionalização

1. Instalar `react-i18next` e `i18next`
2. Criar namespace de traduções: `pt-BR.json`, `en.json`, `es.json`
3. Extrair todas as strings hardcoded dos componentes
4. Mapear chaves de tradução com o Angular (consistência entre frontends)

#### E.2 — CI/CD com GitHub Actions

1. Criar `.github/workflows/writer-studio-ci.yml`
2. Pipeline: lint → typecheck → test → build
3. Deploy automático para staging (Vercel/Render)

---

## 5. Priorização Final

```
Sprint A (1 dia)      → Correções rápidas de código
    ├── A.1 AiChat counter (30min)
    ├── A.2 ConfirmDialog Radix (2h)
    ├── A.3 Console logs cleanup (30min)
    └── A.4 Endpoint reorder (30min)

Sprint B (3h)         → Fontes conforme protótipo
    └── B.1 Source Serif 4 + DM Sans (3h)

Sprint C (2-3 dias)   → Abstração SSML visual (Sprint 4 backlog)
    └── C.1 Visual markers ↔ SSML conversion (2-3 dias)

Sprint D (1-2 sem)    → Testes (Sprint 7 backlog)
    ├── D.1 Testes unitários hooks (4 dias)
    ├── D.2 Testes stores (2 dias)
    └── D.3 Testes E2E Playwright (3 dias)

Sprint E (1 sem)      → i18n + CI/CD (Sprint 7-8 backlog)
    ├── E.1 react-i18next setup + extração (3 dias)
    └── E.2 GitHub Actions pipeline (2 dias)
```

---

## 6. Conclusão

Após o rebase com main, o projeto apresenta **melhoria significativa**: 10 dos 15 problemas originais foram corrigidos (67%). Os 3 problemas críticos de segurança (token na URL, WebSocket auth, persistência de sessão) foram **todos resolvidos**.

Os **5 pontos restantes** são:
- 2 parcialmente corrigidos (logs de debug, endpoint hardcoded) — resolvidos no Sprint A
- 3 pendentes (AiChat counter, window.confirm, fontes) — resolvidos nos Sprints A e B

A maior lacuna funcional permanece a **abstração visual SSML** (Sprint C), que é a feature mais complexa do frontend ainda não implementada, seguida pelos **testes** (Sprint D) necessários para atingir a meta de >70% de cobertura.

A arquitetura está sólida, o código segue boas práticas React modernas, e os novos contextos (NarrationContext, CharacterWizardContext) demonstram evolução positiva na gestão de estado compartilhado.
