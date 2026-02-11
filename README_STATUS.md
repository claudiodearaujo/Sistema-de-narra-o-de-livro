# Status do Writer's Studio

## Fases Concluídas
- [x] **A. Configuração Inicial**: Estrutura base, roteamento, Layout.
- [x] **B. Funcionalidades Core**:
    - [x] B.1: Canvas e Drag & Drop (`SpeechBlock`, `SortableSpeechBlock`, `useSortable`).
    - [x] B.2: Gerenciamento de Personagens (`CharacterList`, `CharacterEditorModal`).
    - [x] B.3: Edição de Texto (`useSpeechEditor`, atalhos).
- [x] **C. Integração Realtime**:
    - [x] C.1: WebSocket (`useNarration`, `socket.io`).
    - [x] C.2: Feedback Visual (`SpeechBlock` loading/progress).
- [x] **D. Painéis Direitos**:
    - [x] D.1: Estrutura de Abas (`RightPanel`).
    - [x] D.2: IA (`AiChat` com contexto de seleção).
    - [x] D.3: Mídia (`MediaPanel` funcional para falas).
    - [x] D.4: Propriedades (`PropertiesPanel` sem notes).
- [x] **F. Polimento e Features Finais**:
    - [x] F.1: Auto-save (`useAutoSave`, integrado em `useStudio`).
    - [x] F.2: Atalhos de Teclado (`useKeyboardShortcuts`).
    - [x] F.5: Editor de Personagens (Refinado com color/role).

## Próximos Passos (Pendentes)
- [ ] **F.6: Testes**:
    - Testar fluxo completo de criação de capítulo -> adição de falas -> geração de áudio -> salvamento.
    - Testar WebSocket com backend real (simulado até agora).
    - Validar upload de mídia de capítulo (placeholder no `MediaPanel`).
    - Refinar CSS (avisos de `rounded` redundante).

## Notas Técnicas
- O campo `notes` foi removido de `Chapter` pois o backend não suporta.
- `useAutoSave` salva apenas o texto da fala em edição após 3s de inatividade.
- O WebSocket espera eventos `narration:progress` e `narration:completed`.
