# Review dos Controles da Tela de Studio

**Data**: 2026-02-11
**Escopo**: Auditoria completa dos controles do Writer's Studio — comparando o protótipo (`protótipo.jsx`) e a documentação UX (`Livrya Conceito Ux.md`) com a implementação atual nos componentes React.

---

## Resumo Executivo

O projeto completou com sucesso as **Fases 1–3 da fundação** (setup, tipos, autenticação, layout base). Porém, os componentes do Studio estão **apenas com estrutura visual estática (hardcoded)** — nenhum botão ou controle possui funcionalidade real conectada a dados ou à API. O projeto está na fronteira entre a Fase 3 (layout) e a Fase 4 (funcionalidade real).

### Percentual de Conclusão por Componente

| Componente | Visual | Funcional | Conectado à API | Status |
|---|---|---|---|---|
| TopBar | 70% | 30% | 0% | Parcial |
| LeftSidebar | 50% | 0% | 0% | Mockup |
| Canvas | 30% | 0% | 0% | Mockup |
| RightPanel | 40% | 10% | 0% | Mockup |
| StatusBar | 60% | 0% | 0% | Mockup |
| **Geral Studio** | **~45%** | **~8%** | **0%** | **Inicial** |

---

## 1. TopBar (`TopBar.tsx`)

### Controles Presentes

| # | Controle | Visual | Funcional | Observação |
|---|---|---|---|---|
| 1 | Botao Voltar (ChevronLeft + BookOpen) | OK | OK | `navigate('/')` funciona |
| 2 | Titulo do livro | OK | Hardcoded | Sempre mostra "Livro Exemplo" |
| 3 | Capitulo ativo | OK | Hardcoded | Sempre mostra "Capítulo 1: A Partida" |
| 4 | Indicador de salvamento (Save) | OK | Hardcoded | Sempre mostra "Salvo", sem lógica real |
| 5 | Botao Modo Foco (Maximize2/Minimize2) | OK | OK | `toggleFocusMode` via Zustand funciona |
| 6 | Botao Configuracoes (Settings) | OK | Nao implementado | Botão existe mas sem ação |

### Controles Ausentes (vs. Protótipo)

| # | Controle Esperado | Referência | Prioridade |
|---|---|---|---|
| 7 | Botao toggle sidebar esquerda (PanelLeftClose/Menu) | `protótipo.jsx:402-406` | Alta |
| 8 | Botoes Undo/Redo | `protótipo.jsx:437-442` | Média |
| 9 | Barra de acoes para falas selecionadas (IA, Audio, Limpar) | `protótipo.jsx:422-434` | Alta |
| 10 | Botao Exportar/Download | `protótipo.jsx:454-456` | Média |
| 11 | Botao Assistente IA (abre painel direito) | `protótipo.jsx:458-466` | Alta |
| 12 | Titulo dinamico do livro (vindo da API) | Conceito UX | Alta |
| 13 | Capitulo ativo dinamico | Conceito UX | Alta |

---

## 2. LeftSidebar (`LeftSidebar.tsx`)

### Controles Presentes

| # | Controle | Visual | Funcional | Observação |
|---|---|---|---|---|
| 1 | Tabs (Capítulos, Personagens, Estatísticas) | OK | Nao implementado | Tabs visuais, mas sem troca de conteúdo |
| 2 | Capitulo 1 com indicador de completo (✓) | OK | Hardcoded | Dados estáticos |
| 3 | Capitulo 2 com indicador de progresso (⚡) | OK | Hardcoded | Dados estáticos |
| 4 | Contagem de palavras por capitulo | OK | Hardcoded | Valores fixos |
| 5 | Botao "Novo Capítulo" (Plus) | OK | Nao implementado | Sem handler de click |
| 6 | Icones ChevronDown/ChevronRight | OK | Nao implementado | Sem logica de expand/collapse |

### Controles Ausentes (vs. Protótipo)

| # | Controle Esperado | Referência | Prioridade |
|---|---|---|---|
| 7 | Tab Personagens - lista com avatar, cor e voz | `protótipo.jsx:550-567` | Alta |
| 8 | Tab Estatísticas - dados do capítulo | Conceito UX | Média |
| 9 | Ferramentas do capitulo (Trilha sonora, Narrar, IA, Exportar) | `protótipo.jsx:578-594` | Alta |
| 10 | Mini-preview das falas ao expandir capitulo | `protótipo.jsx:518-532` | Média |
| 11 | Indicadores de status por cor (verde/amarelo/cinza) | `protótipo.jsx:511-514` | Média |
| 12 | Estatísticas compactas no rodapé (falas + palavras) | `protótipo.jsx:599-610` | Baixa |
| 13 | Clique no capitulo carrega falas no canvas | Conceito UX | Alta |
| 14 | Botao "Novo personagem" | `protótipo.jsx:546-548` | Média |
| 15 | Logica de troca entre tabs | Conceito UX | Alta |

---

## 3. Canvas (`Canvas.tsx`) — Componente Mais Defasado

### Controles Presentes

| # | Controle | Visual | Funcional | Observação |
|---|---|---|---|---|
| 1 | Bloco de fala do Narrador (italico, cinza) | OK | Hardcoded | Texto fixo, 1 bloco de amostra |
| 2 | Bloco de fala de personagem (borda colorida, avatar, emocao) | OK | Hardcoded | 1 bloco de amostra (Helena) |
| 3 | Botao "Nova fala" (Plus) | OK | Nao implementado | Sem handler, sem seleção de personagem |

### Controles Ausentes (vs. Protótipo) — CRITICOS

| # | Controle Esperado | Referência | Prioridade |
|---|---|---|---|
| 4 | SpeechBlock como componente reutilizável | `protótipo.jsx:86-236` | **Critica** |
| 5 | Edicao inline (click-to-edit com textarea) | `protótipo.jsx:142-176` | **Critica** |
| 6 | TagToolbar com botoes SSML (Pausa, Enfase, Tom, Sussurro) | `protótipo.jsx:158-168` | **Critica** |
| 7 | Indicadores visuais de tags (ex: ⏸500ms) | `protótipo.jsx:188-195` | Alta |
| 8 | Indicadores de midia (audio, imagem) | `protótipo.jsx:201-212` | Alta |
| 9 | Acoes rapidas no hover (TTS, Imagem, Ambiente, IA, Mais) | `protótipo.jsx:215-230` | Alta |
| 10 | Checkbox de selecao de fala (hover) | `protótipo.jsx:107-118` | Alta |
| 11 | Area expandida de nova fala com selecao de personagem | `protótipo.jsx:664-729` | **Critica** |
| 12 | Keyboard shortcuts (Ctrl+Enter salvar, Esc cancelar) | `protótipo.jsx:152-155` | Alta |
| 13 | Header do capitulo com status | `protótipo.jsx:618-634` | Media |
| 14 | Drag & drop para reordenacao | Doc arquitetura Fase 2 | Media |
| 15 | Renderizacao dinamica de lista de falas | Conceito UX | **Critica** |
| 16 | Salvamento e cancelamento de edicao | `protótipo.jsx:366-371` | **Critica** |
| 17 | Botoes Salvar/Cancelar na edicao | `protótipo.jsx:170-174` | **Critica** |

---

## 4. RightPanel (`RightPanel.tsx`)

### Controles Presentes

| # | Controle | Visual | Funcional | Observação |
|---|---|---|---|---|
| 1 | Header com icone + titulo dinamico | OK | OK | Switch por `rightPanelType` funciona |
| 2 | Botao fechar (X) | OK | OK | `closeRightPanel` via Zustand funciona |
| 3 | Texto placeholder por tipo de painel | OK | Placeholder | Mostra "em desenvolvimento..." |

### Controles Ausentes (vs. Protótipo)

| # | Controle Esperado | Referência | Prioridade |
|---|---|---|---|
| 4 | Tab bar (IA, Mídia, Props) no topo do painel | `protótipo.jsx:770-792` | Alta |
| 5 | **AI Chat** - interface com mensagens e input | `protótipo.jsx:239-325` | Alta |
| 6 | **AI Chat** - acoes rapidas (Revisar, Sugerir, Enriquecer, Reescrever) | `protótipo.jsx:247-252` | Alta |
| 7 | **AI Chat** - streaming de respostas | Doc arquitetura Fase 4 | Alta |
| 8 | **Midia** - Trilha sonora e Audio ambiente do capitulo | `protótipo.jsx:800-819` | Media |
| 9 | **Midia** - Gerar imagem da cena | `protótipo.jsx:829` | Media |
| 10 | **Midia** - Gerar narracao TTS | `protótipo.jsx:835` | Alta |
| 11 | **Midia** - Gerar audio ambiente | `protótipo.jsx:838` | Media |
| 12 | **Propriedades** - Titulo, Status, Notas do capitulo | `protótipo.jsx:845-868` | Media |
| 13 | Botoes de abrir paineis especificos da TopBar | Conceito UX | Alta |

---

## 5. StatusBar (`StatusBar.tsx`)

### Controles Presentes

| # | Controle | Visual | Funcional | Observação |
|---|---|---|---|---|
| 1 | Contagem de palavras (FileText) | OK | Hardcoded | "1.234 palavras" fixo |
| 2 | Tempo de narracao estimado (Clock) | OK | Hardcoded | "~12 min de narração" fixo |
| 3 | Total de falas | OK | Hardcoded | "12 falas" fixo |
| 4 | Total de personagens | OK | Hardcoded | "4 personagens" fixo |

### Controles Ausentes (vs. Protótipo)

| # | Controle Esperado | Referência | Prioridade |
|---|---|---|---|
| 5 | Indicador de falas narradas (ex: "2/6 narradas") | `protótipo.jsx:753` | Media |
| 6 | Status de salvamento ("Salvo" com indicador verde) | `protótipo.jsx:757-759` | Alta |
| 7 | Indicador de atalhos "⌘K Atalhos" | `protótipo.jsx:760` | Baixa |
| 8 | Valores dinamicos (calculados dos dados reais) | Conceito UX | Alta |

---

## 6. Stores e Estado — Analise

### Stores Existentes

| Store | Implementado | Utilizado | Observação |
|---|---|---|---|
| `auth.store.ts` | OK | Sim (AuthGuard) | Funcional para SSO |
| `studio.store.ts` | OK | Parcial | `setActiveBook/Chapter` usado, `editingSpeech*` nao usado |
| `ui.store.ts` | OK | Parcial | `focusMode` e `rightPanel*` usados, `selectedSpeechIds` nao |

### Hooks Ausentes (Planejados na Arquitetura)

| Hook | Propósito | Prioridade |
|---|---|---|
| `useBooks.ts` | TanStack Query para CRUD de livros | Alta |
| `useChapters.ts` | TanStack Query para CRUD de capítulos | Alta |
| `useCharacters.ts` | TanStack Query para CRUD de personagens | Alta |
| `useSpeeches.ts` | TanStack Query para CRUD de falas | **Critica** |
| `useNarration.ts` | Controle de narração TTS + WebSocket | Alta |
| `useAiTools.ts` | Integração com ferramentas IA | Media |
| `useStudio.ts` | Estado composto da tela principal | Alta |
| `useSpeechEditor.ts` | Logica do editor inline | **Critica** |
| `useKeyboardShortcuts.ts` | Atalhos de teclado | Media |

### Componentes Ausentes (Planejados na Arquitetura)

| Componente | Propósito | Prioridade |
|---|---|---|
| `SpeechBlock.tsx` | Bloco de fala reutilizavel | **Critica** |
| `NewSpeechInput.tsx` | Input para nova fala com selecao de personagem | **Critica** |
| `TagToolbar.tsx` | Barra de tags SSML visuais | **Critica** |
| `WritingCanvas.tsx` | Canvas principal com lista de falas | Alta |
| `ChapterTree.tsx` | Arvore de capitulos expandivel | Alta |
| `CharacterList.tsx` | Lista de personagens com voz | Alta |
| `ChapterTools.tsx` | Ferramentas do capitulo | Alta |
| `AiChat.tsx` | Interface de chat com IA | Alta |
| `MediaPanel.tsx` | Painel de midia com acoes | Media |
| `PropertiesPanel.tsx` | Propriedades do capitulo | Media |
| `AudioPlayer.tsx` | Player de audio compartilhado | Media |
| `VoiceSelector.tsx` | Seletor de voz para personagem | Media |
| `CharacterEditor.tsx` | Editor completo de personagem | Media |

---

## 7. Plano de Conclusao do Desenvolvimento

### Fase A — Canvas Funcional (Prioridade Maxima)

**Objetivo**: Tornar o canvas de escrita funcional com dados reais.

#### A.1 — Hook `useSpeeches` + Integração com API
- Criar `src/shared/hooks/useSpeeches.ts` com TanStack Query
- Implementar: `useSpeeches(chapterId)`, `useCreateSpeech()`, `useUpdateSpeech()`, `useDeleteSpeech()`, `useReorderSpeeches()`
- Conectar ao endpoint `GET /chapters/{chapterId}/speeches`

#### A.2 — Componente `SpeechBlock`
- Extrair de `Canvas.tsx` para `src/features/studio/components/Canvas/SpeechBlock.tsx`
- Props: `speech`, `character`, `isEditing`, `isSelected`, `onStartEdit`, `onToggleSelect`
- Renderizacao condicional: narrador (italico) vs personagem (borda colorida)
- Indicadores de emocao (badge)
- Indicadores de midia (audio/imagem)
- Acoes rapidas no hover (TTS, Imagem, Ambiente, IA)

#### A.3 — Edicao Inline de Falas
- Criar `src/features/studio/hooks/useSpeechEditor.ts`
- Click no texto abre textarea para edicao
- TagToolbar inline com botoes SSML
- Ctrl+Enter salva, Esc cancela
- Botoes visuais Salvar/Cancelar
- Conectar `studio.store.ts` (editingSpeechId, editingText)

#### A.4 — Componente `TagToolbar`
- Criar `src/features/studio/components/Canvas/TagToolbar.tsx`
- Botoes: Pausa, Enfase, Tom+, Tom-, Sussurro, Negrito, Italico
- Inserir tags SSML no texto como marcadores visuais
- Conversao visual ↔ SpeechTag[] nos bastidores

#### A.5 — Componente `NewSpeechInput`
- Criar `src/features/studio/components/Canvas/NewSpeechInput.tsx`
- Botao "Nova fala" expande para formulario inline
- Selecao visual de personagem (chips coloridos com avatar)
- Textarea para texto da fala
- TagToolbar disponivel
- Ctrl+Enter adiciona, Esc cancela
- Chamar `useCreateSpeech()` na API

#### A.6 — Selecao Multipla de Falas
- Checkbox aparece no hover de cada `SpeechBlock`
- Conectar `ui.store.ts` (`selectedSpeechIds`, `toggleSpeechSelection`)
- Toolbar de acoes na TopBar quando ha selecao (IA, Audio, Limpar)

---

### Fase B — Sidebar Funcional

#### B.1 — Hooks de Dados
- Criar `src/shared/hooks/useBooks.ts` — `useBooks()`, `useBook(id)`
- Criar `src/shared/hooks/useChapters.ts` — `useChapters(bookId)`, `useCreateChapter()`, `useUpdateChapter()`
- Criar `src/shared/hooks/useCharacters.ts` — `useCharacters(bookId)`, `useCreateCharacter()`

#### B.2 — Logica de Tabs na LeftSidebar
- Implementar estado local para tab ativa (Capitulos/Personagens/Estatisticas)
- Renderizar conteudo diferente por tab

#### B.3 — Componente `ChapterTree`
- Criar `src/features/studio/components/LeftSidebar/ChapterTree.tsx`
- Dados dinamicos via `useChapters(bookId)`
- Expand/collapse com state
- Indicadores de status (cor: verde/amarelo/cinza)
- Clique no capitulo atualiza `studio.store.activeChapterId` e recarrega falas no canvas
- Mini-preview de falas ao expandir
- Botao "Novo Capitulo" funcional

#### B.4 — Componente `CharacterList`
- Criar `src/features/studio/components/LeftSidebar/CharacterList.tsx`
- Dados dinamicos via `useCharacters(bookId)`
- Avatar, nome, cor, voz do personagem
- Preview de audio ao clicar no icone de volume
- Botao "Novo personagem"

#### B.5 — Componente `ChapterTools`
- Criar `src/features/studio/components/LeftSidebar/ChapterTools.tsx`
- Botoes: Trilha sonora, Narrar capitulo, IA no capitulo, Exportar audio
- Conectar aos endpoints da API

#### B.6 — Estatisticas Compactas
- Rodape da sidebar com contagem de falas e palavras (calculados dos dados reais)
- Tab de estatisticas com metricas detalhadas

---

### Fase C — TopBar e StatusBar Dinamicos

#### C.1 — TopBar Completa
- Titulo e capitulo dinamicos via stores
- Toggle de sidebar esquerda (`toggleLeftSidebar` do ui.store)
- Botoes Undo/Redo (inicialmente visuais, conectar depois a logica de historico)
- Barra de acoes para falas selecionadas
- Botao Assistente IA (abre painel direito com `openRightPanel('ai')`)
- Botao Exportar
- Indicador de salvamento real (via `studio.store.isDirty` e `lastSavedAt`)

#### C.2 — StatusBar Dinamica
- Calcular valores reais: total de palavras, tempo de narracao, falas, personagens, falas narradas
- Indicador de salvamento com dot verde
- Link para atalhos de teclado

---

### Fase D — Painel Direito Funcional

#### D.1 — Tab Bar do Painel
- Implementar abas visuais (IA, Midia, Props) no topo do RightPanel
- Conectar a `ui.store.rightPanelType`
- Botao fechar mantido

#### D.2 — AI Chat (`AiChat.tsx`)
- Criar `src/features/studio/components/RightPanel/AiChat.tsx`
- Interface de chat com mensagens (assistente/usuario)
- Input com envio (Enter ou botao Send)
- Acoes rapidas: Revisar ortografia, Sugerir melhorias, Enriquecer contexto, Reescrever
- Conectar ao endpoint `POST /ai/chat` com streaming
- Criar `src/shared/hooks/useAiTools.ts`

#### D.3 — Media Panel (`MediaPanel.tsx`)
- Criar `src/features/studio/components/RightPanel/MediaPanel.tsx`
- Secao "Midia do Capitulo": Trilha sonora, Audio ambiente
- Secao "Gerar para Fala Selecionada": Imagem da cena, Cena visual, Narracao TTS, Audio ambiente
- Conectar aos endpoints da API

#### D.4 — Properties Panel (`PropertiesPanel.tsx`)
- Criar `src/features/studio/components/RightPanel/PropertiesPanel.tsx`
- Campos: Titulo do capitulo, Status (select), Notas do autor (textarea)
- Conectar a `useUpdateChapter()`

---

### Fase E — Narracao e Midia

#### E.1 — Hook `useNarration`
- Criar `src/shared/hooks/useNarration.ts`
- Iniciar/cancelar narracao de capitulo
- WebSocket para progresso (`narration:progress`, `narration:completed`)
- Status de narracao por fala

#### E.2 — Audio por Fala
- Gerar TTS individual via `POST /speeches/{id}/audio`
- Indicador visual de progresso
- Player inline discreto

#### E.3 — Imagem e Ambiente por Fala
- Gerar imagem de cena via `POST /speeches/{id}/scene-image`
- Gerar audio ambiente via `POST /speeches/{id}/ambient-audio`
- Visualizacao inline dos resultados

#### E.4 — WebSocket Client
- Criar `src/shared/api/websocket.ts` (Socket.io)
- Eventos: `narration:started`, `narration:progress`, `narration:completed`, `narration:failed`
- Evento futuro: `ai:stream`

---

### Fase F — Refinamento e Polimento

#### F.1 — Auto-save
- Debounce de alteracoes (2-3 segundos)
- Indicador visual "Salvando..." / "Salvo"
- Prevenir perda de dados (beforeunload)

#### F.2 — Atalhos de Teclado
- Criar `src/features/studio/hooks/useKeyboardShortcuts.ts`
- Ctrl+Enter: Salvar fala
- Esc: Cancelar edicao
- Ctrl+S: Salvar manualmente
- Ctrl+K: Abrir paleta de atalhos (futuro)

#### F.3 — Drag & Drop
- Reordenacao de falas no canvas via drag
- Usar lib como `@dnd-kit` ou `react-beautiful-dnd`
- Conectar a `PUT /chapters/{chapterId}/speeches/reorder`

#### F.4 — Loading States e Error Handling
- Skeletons para carregamento de falas, capitulos, personagens
- Toast/notification para erros de API
- Retry automatico via TanStack Query

#### F.5 — Editor de Personagens
- Criar `src/features/character-editor/CharacterEditor.tsx`
- Modal/drawer para CRUD de personagem
- Selecao de voz com preview de audio
- Cor e avatar

#### F.6 — Testes
- Vitest + Testing Library para componentes
- Playwright para E2E
- Testes de integracao SSO

---

## 8. Ordem de Prioridade Recomendada

```
1. [CRITICA] Fase A — Canvas Funcional
   ├── A.1 useSpeeches hook
   ├── A.2 SpeechBlock component
   ├── A.3 Edicao inline
   ├── A.4 TagToolbar
   ├── A.5 NewSpeechInput
   └── A.6 Selecao multipla

2. [ALTA] Fase B — Sidebar Funcional
   ├── B.1 Hooks de dados (books, chapters, characters)
   ├── B.2 Tabs com logica de troca
   ├── B.3 ChapterTree dinamico
   ├── B.4 CharacterList dinamica
   ├── B.5 ChapterTools
   └── B.6 Estatisticas

3. [ALTA] Fase C — TopBar e StatusBar
   ├── C.1 TopBar completa e dinamica
   └── C.2 StatusBar com dados reais

4. [ALTA] Fase D — Painel Direito
   ├── D.1 Tab bar
   ├── D.2 AI Chat
   ├── D.3 Media Panel
   └── D.4 Properties Panel

5. [MEDIA] Fase E — Narracao e Midia
   ├── E.1 useNarration hook
   ├── E.2 Audio por fala
   ├── E.3 Imagem e ambiente
   └── E.4 WebSocket client

6. [MEDIA] Fase F — Refinamento
   ├── F.1 Auto-save
   ├── F.2 Atalhos de teclado
   ├── F.3 Drag & drop
   ├── F.4 Loading states
   ├── F.5 Editor de personagens
   └── F.6 Testes
```

---

## 9. Arquivos a Criar

```
src/
├── shared/
│   ├── hooks/
│   │   ├── useBooks.ts
│   │   ├── useChapters.ts
│   │   ├── useCharacters.ts
│   │   ├── useSpeeches.ts
│   │   ├── useNarration.ts
│   │   └── useAiTools.ts
│   ├── api/
│   │   └── websocket.ts
│   └── components/
│       ├── AudioPlayer.tsx
│       ├── VoiceSelector.tsx
│       └── ConfirmDialog.tsx
│
├── features/
│   ├── studio/
│   │   ├── hooks/
│   │   │   ├── useStudio.ts
│   │   │   ├── useSpeechEditor.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   └── components/
│   │       ├── Canvas/
│   │       │   ├── SpeechBlock.tsx          ← NOVO
│   │       │   ├── NewSpeechInput.tsx       ← NOVO
│   │       │   └── TagToolbar.tsx           ← NOVO
│   │       ├── LeftSidebar/
│   │       │   ├── ChapterTree.tsx          ← NOVO
│   │       │   ├── CharacterList.tsx        ← NOVO
│   │       │   └── ChapterTools.tsx         ← NOVO
│   │       └── RightPanel/
│   │           ├── AiChat.tsx               ← NOVO
│   │           ├── MediaPanel.tsx           ← NOVO
│   │           └── PropertiesPanel.tsx      ← NOVO
│   │
│   └── character-editor/
│       └── CharacterEditor.tsx              ← NOVO
```

**Total de novos arquivos**: ~22 arquivos
**Arquivos a modificar**: Canvas.tsx, LeftSidebar.tsx, RightPanel.tsx, TopBar.tsx, StatusBar.tsx, StudioPage.tsx

---

## 10. Dependencias Tecnicas

### Ja instaladas (package.json)
- React 19, Vite 6, TypeScript 5.7
- Zustand (state management)
- TanStack Query v5 (data fetching)
- Tailwind CSS 4 (styling)
- Lucide React (icons)
- Axios (HTTP client)
- React Router 7 (routing)
- Socket.io Client (WebSocket)

### A instalar
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag & drop para reordenacao de falas
- `react-hot-toast` ou `sonner` — notificacoes/toasts para feedback ao usuario
- Possivelmente `@tiptap/react` — editor rico para edicao avancada de texto (Fase futura)

---

## 11. Conclusao

O Writer's Studio tem uma **fundacao solida** (tipos, stores, API endpoints, autenticacao, layout) mas encontra-se em estado de **mockup visual** — com dados hardcoded e sem funcionalidade real nos controles. A distancia entre o protótipo interativo (`protótipo.jsx`) e a implementacao atual e significativa, especialmente no Canvas (componente central da experiencia).

A recomendacao e iniciar imediatamente pela **Fase A (Canvas Funcional)**, pois e o coração do produto e onde o usuario passa 90% do tempo. Sem um canvas funcional com edicao inline, criacao de falas e tags SSML, o produto nao pode ser testado nem validado.
