# Livrya Writer's Studio — Sprint Backlog

**Data**: 2026-02-11  
**Autor**: Análise Automatizada  
**Objetivo**: Priorizar o trabalho restante com foco nas integrações frontend ↔ backend

---

## Resumo Executivo

### Estado Atual do Projeto

| Área | Status | %  Implementado |
|------|--------|----------------|
| **Fundação (Setup, Build, Config)** | ✅ Completo | 100% |
| **Tipos TypeScript** | ✅ Completo | 100% |
| **State Management (Zustand)** | ✅ Completo | 100% |
| **HTTP Client + Interceptors** | ✅ Completo | 100% |
| **WebSocket Client** | ✅ Completo | 100% |
| **Auth (SSO/OAuth PKCE)** | ✅ Completo (Frontend) | 90%* |
| **TanStack Query Hooks** | ✅ Completo | 100% |
| **Layout Studio (3 zonas)** | ✅ Completo | 100% |
| **Canvas — SpeechBlock + Edição Inline** | ✅ Completo | 95% |
| **Canvas — Drag & Drop** | ✅ Completo | 100% |
| **Canvas — NewSpeechInput** | ✅ Completo | 100% |
| **Canvas — TagToolbar (SSML)** | ⚠️ Parcial | 60% |
| **LeftSidebar — ChapterTree + DnD** | ✅ Completo | 100% |
| **LeftSidebar — CharacterList** | ✅ Completo | 95% |
| **LeftSidebar — ChapterTools** | ⚠️ Parcial | 50% |
| **LeftSidebar — CharacterEditorModal** | ✅ Completo | 90% |
| **RightPanel — AiChat (Streaming)** | ✅ Completo | 85%* |
| **RightPanel — MediaPanel** | ⚠️ Parcial | 40%* |
| **RightPanel — PropertiesPanel** | ⚠️ Parcial | 50% |
| **Auto-save** | ✅ Completo | 100% |
| **Atalhos de Teclado** | ✅ Completo | 90% |
| **TopBar / StatusBar** | ✅ Completo | 95% |
| **BookSelectorPage** | ✅ Completo | 90% |
| **AudioPlayer / SceneImage** | ✅ Completo | 100% |
| **Testes Unitários** | ⚠️ Mínimo | 20% |
| **Testes E2E** | ❌ Não iniciado | 0% |
| **i18n** | ❌ Não iniciado | 0% |
| **CI/CD** | ❌ Não iniciado | 0% |

> `*` = O frontend está pronto mas depende de endpoint no backend que **NÃO existe ainda**.

---

## Análise de Gap: Backend vs Frontend

### Endpoints que o Frontend Consome e o Backend JÁ TEM ✅

| Endpoint | Frontend Hook/Component | Status |
|----------|------------------------|--------|
| `GET /books` | `useBooks()` | ✅ Pronto |
| `GET /books/:id` | `useBook(id)` | ✅ Pronto |
| `GET /books/:id/stats` | `endpoints.books.stats` | ✅ Pronto |
| `GET /books/:bookId/chapters` | `useChapters()` | ✅ Pronto |
| `POST /books/:bookId/chapters` | `useCreateChapter()` | ✅ Pronto |
| `PUT /books/:bookId/chapters/reorder` | `useReorderChapters()` | ✅ Pronto |
| `GET /chapters/:id` | `endpoints.chapters.byId` | ✅ Pronto |
| `PUT /chapters/:id` | `useUpdateChapter()` | ✅ Pronto |
| `DELETE /chapters/:id` | `useDeleteChapter()` | ✅ Pronto |
| `GET /chapters/:chapterId/speeches` | `useSpeeches()` | ✅ Pronto |
| `POST /chapters/:chapterId/speeches` | `useCreateSpeech()` | ✅ Pronto |
| `PUT /chapters/:chapterId/speeches/reorder` | `useReorderSpeeches()` | ✅ Pronto |
| `POST /chapters/:chapterId/speeches/bulk` | `useBatchSpeechAudio()` | ✅ Pronto |
| `GET /speeches/:id` | `endpoints.speeches.byId` | ✅ Pronto |
| `PUT /speeches/:id` | `useUpdateSpeech()` | ✅ Pronto |
| `DELETE /speeches/:id` | `useDeleteSpeech()` | ✅ Pronto |
| `GET /books/:bookId/characters` | `useCharacters()` | ✅ Pronto |
| `POST /books/:bookId/characters` | `useCreateCharacter()` | ✅ Pronto |
| `PUT /characters/:id` | `useUpdateCharacter()` | ✅ Pronto |
| `DELETE /characters/:id` | `useDeleteCharacter()` | ✅ Pronto |
| `POST /characters/:id/preview-audio` | `CharacterEditorModal` | ✅ Pronto |
| `GET /voices` | `useVoiceList` (referência) | ✅ Pronto |
| `POST /voices/preview` | `endpoints.voices.preview` | ✅ Pronto |
| `POST /chapters/:id/narration/start` | `useNarration()` | ✅ Pronto |
| `POST /chapters/:id/narration/cancel` | `useNarration()` | ✅ Pronto |
| `GET /chapters/:id/narration/status` | `useNarration()` | ✅ Pronto |
| `POST /ssml/validate` | `endpoints.ssml.validate` | ✅ Pronto |
| `POST /speeches/tools/spell-check` | `useSpellCheck()` | ✅ Pronto |
| `POST /speeches/tools/suggestions` | `useAiSuggestions()` | ✅ Pronto |
| `POST /speeches/tools/character-context` | `useCharacterContext()` | ✅ Pronto |
| `POST /speeches/tools/emotion-image` | `useEmotionImage()` | ✅ Pronto |
| `GET /oauth/authorize` | `AuthGuard` (SSO redirect) | ✅ Pronto |
| `POST /oauth/authorize` | `AuthGuard` (generate code) | ✅ Pronto |
| `POST /oauth/token` | `AuthCallback` (token exchange) | ✅ Pronto |
| `GET /oauth/userinfo` | `endpoints.auth.userInfo` | ✅ Pronto |

### Endpoints que o Frontend Consome e o Backend NÃO TEM ❌

| Endpoint Necessário | Frontend Usage | Prioridade | Complexidade |
|---------------------|---------------|------------|-------------|
| `POST /api/ai/chat` (streaming) | `AiChat.tsx` → `fetch()` com SSE streaming | 🔴 Alta | Alta |
| `POST /api/speeches/:id/audio` | `MediaPanel.tsx` → gerar áudio TTS individual | 🔴 Alta | Média |
| `POST /api/speeches/:id/scene-image` | `MediaPanel.tsx` → gerar imagem de cena | 🟡 Média | Alta |
| `POST /api/speeches/:id/ambient-audio` | `MediaPanel.tsx` → áudio ambiente por fala | 🟡 Média | Alta |
| `GET/PUT /api/chapters/:id/soundtrack` | `MediaPanel.tsx` → trilha sonora do capítulo | 🟡 Média | Média |
| `PUT /api/speeches/batch-update` | `endpoints.speeches.batchUpdate` (definido, não usado) | 🟢 Baixa | Baixa |
| WebSocket `ai:stream` | `websocket.ts` → tipo definido, sem listener backend | 🟡 Média | Média |

### WebSocket: Gap no Backend

O frontend define os seguintes eventos WebSocket:

| Evento | Frontend Listener | Backend Emitter | Status |
|--------|-------------------|-----------------|--------|
| `narration:started` | `useNarration` | Narration worker | ⚠️ Verificar integração |
| `narration:progress` | `useNarration` | Narration worker | ⚠️ Verificar integração |
| `narration:completed` | `useNarration` | Narration worker | ⚠️ Verificar integração |
| `narration:failed` | `useNarration` | Narration worker | ⚠️ Verificar integração |
| `ai:stream` | `websocket.ts` (type only) | **NÃO EXISTE** | ❌ A criar |

---

## Sprints Priorizados

---

### 🏃 Sprint 1 — Integração Core (CRUD + Auth Validation)
**Duração estimada**: 1 semana  
**Foco**: Garantir que o fluxo principal funciona end-to-end  
**Prioridade**: 🔴 Crítica

#### Tarefas Backend

| ID | Tarefa | Endpoints Envolvidos | Estimativa |
|----|--------|---------------------|-----------|
| B1.1 | Validar fluxo OAuth SSO completo (WriterStudio como client) | `GET/POST /oauth/authorize`, `POST /oauth/token`, `GET /oauth/userinfo` | 4h |
| B1.2 | Configurar CORS para aceitar `http://localhost:5173` (dev) e futuro domínio `write.livrya.com.br` | `main.ts` / `index.ts` | 1h |
| B1.3 | Adicionar `http://localhost:5173/auth/callback` como redirect_uri válido no OAuth client registry | Prisma `OAuthClient` | 1h |
| B1.4 | Validar que `POST /auth/refresh` funciona com refresh token do WriterStudio | `auth.routes.ts` | 2h |

#### Tarefas Frontend

| ID | Tarefa | Componentes | Estimativa |
|----|--------|-------------|-----------|
| F1.1 | Teste integrado: Login SSO → Redirect → Callback → Token storage → API call autenticada | `AuthGuard`, `AuthCallback`, `http.ts` | 4h |
| F1.2 | Validar fluxo completo: Selecionar livro → Abrir Studio → Carregar capítulos → Carregar falas | `BookSelectorPage`, `StudioPage`, `useStudio` | 4h |
| F1.3 | Testar CRUD de falas: Criar → Editar inline → Deletar → Reordenar (drag) | `Canvas`, `SpeechBlock`, `NewSpeechInput` | 3h |
| F1.4 | Testar CRUD de capítulos: Criar → Renomear → Deletar → Reordenar (drag) | `ChapterTree`, `SortableChapterItem` | 3h |
| F1.5 | Testar CRUD de personagens: Criar → Editar voz → Preview áudio → Deletar | `CharacterList`, `CharacterEditorModal` | 3h |

**Critério de conclusão**: Todo o fluxo CRUD funciona sem erros 4xx/5xx com o backend real.

---

### 🏃 Sprint 2 — Chat IA com Streaming (Backend + Frontend)
**Duração estimada**: 1 semana  
**Foco**: Criar o endpoint de IA e integrar com o painel lateral  
**Prioridade**: 🔴 Alta

#### Tarefas Backend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| B2.1 | Criar rota `POST /api/ai/chat` com suporte a Server-Sent Events (SSE) | Novo controller `ai-chat.controller.ts`, rota em `ai-api.routes.ts` | 6h |
| B2.2 | Integrar com Gemini API (ou provider configurado) para geração de texto | Usar o módulo `src/ai/` existente como base | 4h |
| B2.3 | Implementar contextualização: receber `bookId`, `chapterId`, `speechIds` e carregar o texto das falas como contexto para o LLM | Service layer | 4h |
| B2.4 | Rate limiting e cobrança de tokens IA | Middleware `requireFeature('canUseAI')`, integrar com `ai-api.controller` | 3h |
| B2.5 | (Opcional) Criar WebSocket event `ai:stream` como alternativa ao SSE | `websocket.server.ts` | 4h |

#### Tarefas Frontend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| F2.1 | Integrar `AiChat.tsx` com o endpoint real `POST /api/ai/chat` | Já consume via `fetch()` — validar resposta do backend | 3h |
| F2.2 | Tratar erros de streaming (timeout, desconexão, rate limit) | `AiChat.tsx` → fallback messages | 2h |
| F2.3 | Implementar ações rápidas ("Revisar", "Sugerir") com os endpoints existentes `/speeches/tools/*` | `AiChat.tsx` → integrar `useSpellCheck`, `useAiSuggestions` | 4h |
| F2.4 | Exibir resultados de correção/sugestão das ações rápidas de forma visual (diff highlight) | Novo sub-componente em `AiChat.tsx` | 4h |

**Critério de conclusão**: Usuário pode conversar com a IA recebendo respostas em streaming, e as ações rápidas retornam resultados dos endpoints existentes.

---

### 🏃 Sprint 3 — Narração TTS: Integração End-to-End
**Duração estimada**: 1 semana  
**Foco**: Validar e completar o fluxo de narração com WebSocket  
**Prioridade**: 🔴 Alta

#### Tarefas Backend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| B3.1 | Criar endpoint `POST /api/speeches/:id/audio` para gerar áudio de uma fala individual | Novo route/controller, reutilizar TTS service existente | 6h |
| B3.2 | Garantir que o narration worker emite os eventos WS `narration:started/progress/completed/failed` via `emitToUser()` | Verificar `src/queues/`, `websocket.server.ts` | 4h |
| B3.3 | Conectar narration worker ao `websocket.server.ts` (igual ao padrão de `messageService.setWebSocketEmitter`) | `websocket.server.ts` + narration worker | 3h |
| B3.4 | Verificar que `POST /chapters/:id/narration/start` funciona com SSML gerado pelo frontend | `narration.controller.ts` | 2h |

#### Tarefas Frontend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| F3.1 | Testar `useNarration()` hook com WebSocket real: iniciar, acompanhar progresso, completar | `useNarration.ts` + `Canvas.tsx` | 4h |
| F3.2 | Testar `AudioPlayer.tsx` com URLs de áudio reais retornadas pelo backend | `SpeechBlock.tsx` → `AudioPlayer` | 3h |
| F3.3 | Integrar botão "Gerar TTS" do `MediaPanel.tsx` com `POST /speeches/:id/audio` | `MediaPanel.tsx` | 2h |
| F3.4 | Exibir indicador de progresso por fala no `SpeechBlock` durante narração do capítulo | `SpeechBlock.tsx` → prop `narrationProgress` | 2h |
| F3.5 | Testar narração do capítulo inteiro via `ChapterTools.tsx` → `POST /chapters/:id/narration/start` | `ChapterTools.tsx` | 2h |

**Critério de conclusão**: O usuário pode narrar uma fala individual ou um capítulo inteiro, vendo progresso em tempo real, e reproduzir o áudio gerado.

---

### 🏃 Sprint 4 — TagToolbar SSML + PropertiesPanel
**Duração estimada**: 1 semana  
**Foco**: Completar a edição visual de SSML e o painel de propriedades  
**Prioridade**: 🟡 Média

#### Tarefas Frontend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| F4.1 | Expandir `TagToolbar.tsx`: adicionar todos os botões visuais (Pausa, Ênfase, Tom ↑/↓, Sussurro, Velocidade) | Cada botão gera tag SSML no texto selecionado | 6h |
| F4.2 | Implementar conversão visual ↔ SSML: marcadores visuais no texto que se traduzem em XML nos bastidores | Parser/serializer SSML ↔ visual markers | 8h |
| F4.3 | Integrar validação SSML com `POST /ssml/validate` ao salvar fala | `useSpeechEditor.ts` → chamar endpoint antes de salvar | 3h |
| F4.4 | Completar `PropertiesPanel.tsx`: edição de título, status (rascunho/revisão/finalizado), notas do capítulo | Usar `useUpdateChapter()` | 4h |
| F4.5 | Adicionar seletor de emoção por fala no `SpeechBlock` (badge de emoção com seletor dropdown) | `SpeechBlock.tsx` → novo dropdown inline | 3h |

#### Tarefas Backend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| B4.1 | Garantir que `POST /ssml/validate` retorna erros legíveis para o frontend | `speeches.controller.ts` | 2h |

**Critério de conclusão**: Escritor pode aplicar tags SSML visualmente (sem ver XML), validar e salvar. PropertiesPanel edita metadados do capítulo.

---

### 🏃 Sprint 5 — Geração de Mídia (Imagem + Áudio Ambiente + Trilha Sonora)
**Duração estimada**: 1-2 semanas  
**Foco**: Criar os endpoints de mídia avançada no backend e integrar  
**Prioridade**: 🟡 Média

#### Tarefas Backend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| B5.1 | Criar endpoint `POST /api/speeches/:id/scene-image` — gerar imagem da cena baseada no texto e emoção | Integração com Gemini/DALL-E para image generation. Salvar URL no speech. | 8h |
| B5.2 | Criar endpoint `POST /api/speeches/:id/ambient-audio` — gerar som ambiental para a fala | Integração com IA de áudio ou biblioteca de sons. | 8h |
| B5.3 | Criar endpoints `GET/PUT /api/chapters/:id/soundtrack` — gerenciar trilha sonora do capítulo | CRUD para campo soundtrack na tabela chapters. | 4h |
| B5.4 | Armazenamento de mídias: upload para S3/Supabase Storage, retornar URLs públicas | Storage service | 6h |
| B5.5 | Criar endpoint `PUT /api/speeches/batch-update` — atualizar múltiplas falas em batch | Bulk update service | 3h |

#### Tarefas Frontend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| F5.1 | Conectar `MediaPanel.tsx` botão "Gerar imagem da cena" com endpoint real | Substituir placeholder por chamada real | 2h |
| F5.2 | Conectar `MediaPanel.tsx` botão "Gerar áudio ambiente" com endpoint real | Substituir placeholder por chamada real | 2h |
| F5.3 | Conectar `MediaPanel.tsx` "Trilha sonora" com endpoint real (file picker + upload) | Implementar seleção e upload | 6h |
| F5.4 | Exibir `SceneImage.tsx` no `SpeechBlock` quando imagem gerada | Já implementado, validar com dados reais | 2h |
| F5.5 | Exibir indicadores de mídia gerada (ícones) no `SpeechBlock` | Ícones de áudio, imagem, ambiente | 3h |

**Critério de conclusão**: Usuário pode gerar e visualizar imagens de cena, áudios ambientes e trilha sonora integrados ao canvas.

---

### 🏃 Sprint 6 — Modo Foco + Seleção Múltipla + UX Polish
**Duração estimada**: 1 semana  
**Foco**: Polimento de UX e funcionalidades de produtividade  
**Prioridade**: 🟡 Média

#### Tarefas Frontend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| F6.1 | Aprimorar Modo Foco: transição suave, esconde sidebars, canvas 100% | `StudioPage.tsx` + `TopBar.tsx` | 4h |
| F6.2 | Implementar toolbar de seleção múltipla de falas: excluir em lote, narrar selecionadas, IA nas selecionadas | `Canvas.tsx` → nova toolbar flutuante | 6h |
| F6.3 | Implementar "Undo/Redo" visual no TopBar (historia de ações local) | `TopBar.tsx` → stack de undo/redo no store | 6h |
| F6.4 | Export de capítulo: download como TXT, DOCX ou PDF | `ChapterTools.tsx` → client-side export | 6h |
| F6.5 | Configurações do Studio: tamanho da fonte, espaçamento, opções de layout | Modal de Settings via TopBar | 4h |
| F6.6 | Loading states e error boundaries em todos os componentes | Review e implementação global | 4h |
| F6.7 | Responsividade: breakpoints para tablet e mobile (sidebar overlay) | CSS media queries + lógica de toggle | 6h |

**Critério de conclusão**: UX refinada, sem estados de loading quebrados, responsivo.

---

### 🏃 Sprint 7 — Testes + i18n
**Duração estimada**: 1-2 semanas  
**Foco**: Qualidade e internacionalização  
**Prioridade**: 🟢 Importante mas não bloqueante

#### Tarefas Frontend

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| F7.1 | Testes unitários (Vitest + Testing Library) para todos os hooks: `useBooks`, `useChapters`, `useSpeeches`, `useCharacters`, `useNarration`, `useAiTools` | 1 test file por hook | 8h |
| F7.2 | Testes unitários para stores: `auth.store`, `studio.store`, `ui.store` | Expandir testes existentes | 4h |
| F7.3 | Testes de componente: `SpeechBlock`, `ChapterTree`, `AiChat`, `NewSpeechInput` | Rendering + interaction tests | 8h |
| F7.4 | Testes E2E (Playwright): fluxo completo LoginSSO → BookSelector → Studio → CreateSpeech → Edit → Delete | 3-5 cenários E2E | 10h |
| F7.5 | Implementar i18n com `react-i18next`: extrair todas as strings hardcoded | Locales: `pt-BR`, `en`, `es` | 8h |
| F7.6 | Mapear chaves de tradução existentes do Angular para manter consistência | Análise de chaves | 3h |

**Critério de conclusão**: Coverage > 70%, 3+ fluxos E2E verdes, todas as strings externalizadas em pt-BR.

---

### 🏃 Sprint 8 — CI/CD + Deploy + Monitoramento
**Duração estimada**: 1 semana  
**Foco**: Infraestrutura de deploy e observabilidade  
**Prioridade**: 🟢 Importante

#### Tarefas

| ID | Tarefa | Detalhes | Estimativa |
|----|--------|---------|-----------|
| I8.1 | Configurar GitHub Actions: lint → test → build → deploy | `.github/workflows/deploy.yml` | 4h |
| I8.2 | Setup Render/Vercel/S3+CloudFront para o frontend | `render.yaml` ou Vercel config | 3h |
| I8.3 | Configurar domínio `write.livrya.com.br` + SSL | DNS + cert | 2h |
| I8.4 | Atualizar CORS do backend para produção com domínio real | `ALLOWED_ORIGINS` env var | 1h |
| I8.5 | Integrar Sentry para error tracking no frontend | `@sentry/react` | 3h |
| I8.6 | Integrar analytics (Mixpanel, GA4, ou Plausible) | Tracking de eventos | 4h |
| I8.7 | Beta rollout: feature flag para escritores selecionados | Flag no backend + redirect condicional no Angular | 4h |

**Critério de conclusão**: Deploy automatizado, erros trackados, analytics funcionando.

---

## Diagrama de Dependências entre Sprints

```
Sprint 1 (Core CRUD) ──────► Sprint 2 (AI Chat)
       │                           │
       │                           ▼
       │                    Sprint 4 (SSML + Props)
       │
       ├──────────────────► Sprint 3 (TTS Narração)
       │                           │
       │                           ▼
       │                    Sprint 5 (Mídia Avançada)
       │
       ├──────────────────► Sprint 6 (UX Polish)
       │
       └──────────────────► Sprint 7 (Testes + i18n)
                                   │
                                   ▼
                            Sprint 8 (CI/CD + Deploy)
```

> **Sprint 1 é pré-requisito para todos os outros.** Sprints 2-6 podem ser paralelizados parcialmente se houver mais de 1 dev.

---

## Estimativa Total

| Cenário | Duração |
|---------|---------|
| 1 dev fullstack | 8-10 semanas |
| 2 devs (1 front + 1 back) | 5-6 semanas |
| 3 devs (2 front + 1 back) | 3-4 semanas |

---

## Resumo de Endpoints Backend a Criar

| # | Endpoint | Método | Sprint | Esforço |
|---|----------|--------|--------|---------|
| 1 | `/api/ai/chat` | POST (SSE streaming) | Sprint 2 | 🔴 Alto |
| 2 | `/api/speeches/:id/audio` | POST | Sprint 3 | 🟡 Médio |
| 3 | `/api/speeches/:id/scene-image` | POST | Sprint 5 | 🔴 Alto |
| 4 | `/api/speeches/:id/ambient-audio` | POST | Sprint 5 | 🔴 Alto |
| 5 | `/api/chapters/:id/soundtrack` | GET, PUT | Sprint 5 | 🟡 Médio |
| 6 | `/api/speeches/batch-update` | PUT | Sprint 5 | 🟢 Baixo |
| 7 | WebSocket `ai:stream` | Event | Sprint 2 | 🟡 Médio |
| 8 | WebSocket narration events integration | Events | Sprint 3 | 🟡 Médio |

---

## Notas Importantes

1. **O frontend já está bem avançado** — a maioria dos componentes está funcional, com hooks TanStack Query corretamente mapeados para os endpoints do backend.

2. **O maior gap está nos endpoints de mídia e IA** — `ai/chat`, `scene-image`, `ambient-audio`, e `soundtrack` não existem no backend.

3. **A autenticação OAuth/SSO já tem infraestrutura no backend** (`oauth.routes.ts` com `authorize`, `token`, `userinfo`) — precisa apenas validação end-to-end com o WriterStudio como client.

4. **Os eventos WebSocket de narração têm infraestrutura** no `websocket.server.ts`, mas o narration worker precisa ser verificado se emite via a função `emitToUser()`.

5. **O `AiChat.tsx` já implementa streaming via SSE (fetch + ReadableStream)**, então o backend precisa retornar `text/event-stream` com conteúdo `data: {...}\n\n`.

6. **TagToolbar SSML está mínimo** — tem botões definidos mas a lógica de inserção/conversão SSML ↔ visual é a funcionalidade mais complexa do frontend ainda não implementada completamente.
