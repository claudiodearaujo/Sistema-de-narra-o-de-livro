# 🎯 Tarefas Prioritárias - Writer's Studio

**Data**: 2026-02-11  
**Objetivo**: Validar e testar funcionalidades implementadas (Testes e Refinamento)

---

## 🟢 FASE A (CANVAS FUNCIONAL) — CONCLUÍDA ✅

### Funcionalidades Entregues:
- [x] Hook `useSpeeches` (CRUD completo)
- [x] Componente `SpeechBlock` (Visualização, hover actions)
- [x] Edição Inline (`useSpeechEditor`, TagToolbar, Ctrl+Enter)
- [x] Seleção Múltipla (Checkbox, TopBar actions)
- [x] Drag & Drop (`SortableSpeechBlock`)
- [x] `NewSpeechInput`

---

## 🟢 FASE B (SIDEBAR FUNCIONAL) — CONCLUÍDA ✅

### Funcionalidades Entregues:
- [x] Lista de Capítulos (`ChapterTree`, drag & drop, status)
- [x] Lista de Personagens (`CharacterList`, avatares)
- [x] Editor de Personagens (`CharacterEditorModal` completo)
- [x] Lógica de Abas (Capítulos/Personagens)

---

## 🟢 FASE C (ESTADOS GLOBAIS) — CONCLUÍDA ✅

### Funcionalidades Entregues:
- [x] TopBar Dinâmica (Título, Capítulo, Actions)
- [x] StatusBar Dinâmica (Contadores mockados/reais)
- [x] Undo/Redo (Visuais por enquanto)
- [x] Indicadores de Salvamento (Auto-save visual)

---

## 🟢 FASE D (PAINEL DIREITO) — CONCLUÍDA ✅

### Funcionalidades Entregues:
- [x] Estrutura de Abas (IA, Mídia, Propriedades)
- [x] **IA Chat** (`AiChat`, contexto de seleção, streaming visual)
- [x] **Mídia** (`MediaPanel`, uploads placeholder, geração de assets)
- [x] **Propriedades** (`PropertiesPanel`, edição de metadados)

---

## 🟢 FASE E (NARRAÇÃO E REALTIME) — CONCLUÍDA ✅

### Funcionalidades Entregues:
- [x] Hook `useNarration` (WebSocket integration)
- [x] AudioPlayer e SceneImage (Componentes visuais)
- [x] Geração de Áudio/Imagem (Flow via API/Mock)

---

## 🟡 FASE F (REFINAMENTO E TESTES) — EM ANDAMENTO 🚧

### Funcionalidades Entregues:
- [x] **F.1 Auto-save** (`useAutoSave`, debounce 3s)
- [x] **F.2 Atalhos de Teclado** (`useKeyboardShortcuts` - Ctrl+S, Ctrl+B, etc)
- [x] **F.3 Drag & Drop** (Refinado)
- [x] **F.5 Editor de Personagens** (Completo)

### ⚠️ Pendências (Próximos Passos):

1.  **F.6 Testes Automatizados** (Alta Prioridade)
    -   [ ] Configurar Vitest + Testing Library
    -   [ ] Criar testes unitários para `SpeechBlock` e `useSpeechEditor`
    -   [ ] Configurar Playwright para testes E2E básicos (smoke tests)
    -   [ ] Validar fluxos críticos (Criação -> Edição -> Salvamento)

2.  **F.4 Loading States & Error Handling** (Média Prioridade)
    -   [ ] Refinar Skeletons (ChapterTree, SpeechList)
    -   [ ] Melhorar feedback de erro (Toasts mais descritivos)
    -   [ ] Implementar Retry visual para falhas de rede

3.  **F.7 Refinamento Visual (Polimento)** (Baixa Prioridade)
    -   [ ] Animações de entrada/saída (Framer Motion)
    -   [ ] Revisão final de acessibilidade (ARIA labels)
    -   [ ] Otimização de performance (React.memo onde necessário)

---

## 🚀 Como Rodar os Testes (Futuro)

```bash
# Unitários
npm run test

# E2E
npm run test:e2e
```

## ✅ Checklist de Entrega da Sessão Atual

-   [x] Build `tsc` passando sem erros.
-   [x] Estrutura de diretórios organizada.
-   [x] Principais fluxos de usuário implementados.

**Próxima Sessão**: Focar exclusivamente na configuração e execução de **TESTES (F.6)**.
