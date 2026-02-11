# Gap Analysis — WriterCenterFront vs Especificações

**Data da análise:** 2026-02-11  
**Escopo analisado:**
- `docs/LivryaWriterStudioReact.md`
- `docs/Livrya Conceito Ux.md`
- Implementação em `src/` e arquivos de configuração

## Resumo executivo

O projeto já implementa uma parte relevante do **frontend React do Writer Studio** (layout de 3 zonas, canvas com falas, seleção de livro/capítulo, painel lateral, hooks de dados e SSO com PKCE). Porém, ainda existem lacunas importantes para considerar o plano “completo”, principalmente em **qualidade (testes/CI)**, **i18n**, **alguns fluxos de UX ainda placeholders** e **alinhamento fino de contrato OAuth/streaming IA**.

## Status por bloco da especificação

### 1) Fundação e arquitetura frontend

**Implementado:**
- Setup React + Vite + TypeScript + Tailwind + Zustand + TanStack Query.
- Estrutura modular (`app`, `auth`, `features`, `shared`) compatível com o documento.
- Rotas principais (`/`, `/auth/callback`, `/book/:bookId`, `/book/:bookId/chapter/:chapterId`).

**Pendências / ajustes:**
- Ainda não há `react-i18next` nem estrutura formal de internacionalização.
- Não há suíte de testes unitários/E2E implementada no repositório (apenas scripts e dependências).

---

### 2) UX de tela única (Conceito UX)

**Implementado:**
- Layout principal com top bar, sidebar esquerda, canvas e painel direito.
- Modo foco (oculta painéis).
- Canvas com edição inline, inserção de nova fala e ações rápidas por fala.
- Sidebar com capítulos/personagens e painel direito com abas (IA, mídia, propriedades).

**Pendências / ajustes:**
- Alguns recursos estão com comportamento “em breve”/placeholder (ex.: undo/redo real, menu “mais opções” da fala, mini-preview de capítulos expandido).
- Exportação ainda simplificada (personagem não resolvido pelo nome real em todos os casos).

---

### 3) Autenticação SSO e contrato OAuth

**Implementado:**
- Fluxo SSO com PKCE no `AuthGuard` + `AuthCallback`.
- Troca de code por token e carregamento de `userinfo`.
- Interceptor HTTP com renovação de token.

**Pendências / ajustes:**
- Há divergência potencial entre especificação e constantes atuais de endpoints OAuth (`/auth/sso/*` no documento vs `/oauth/*` e `/auth/refresh` no frontend).
- Implementação de refresh usa payload de refresh token em localStorage/cache, enquanto o documento enfatiza estratégia com cookie httpOnly cross-domain.

---

### 4) Recursos de IA, mídia e narração

**Implementado:**
- Chamadas para endpoints de IA (`chat`, spell-check, sugestões etc.).
- Ferramentas de mídia por fala (áudio, imagem de cena, ambiente) e trilha por capítulo no contrato de endpoints.
- Narração com WebSocket (`started/progress/completed/failed`) e feedback de progresso.

**Pendências / ajustes:**
- Chat de IA ainda em request padrão; não há implementação explícita de streaming de resposta (`ai:stream`) no frontend.
- Parte das ações rápidas em lote (seleção múltipla) ainda está marcada como TODO/fluxo simplificado.

---

### 5) Qualidade, operação e prontidão para release

**Pendências críticas:**
- **Lint não está passando** no estado atual (erros de `no-undef` e tipagem/global browser).
- Não há testes unitários (`*.test.tsx`) nem testes E2E presentes.
- Não foi identificado workflow de CI/CD no repositório deste frontend.

## Itens faltantes prioritários (ordem recomendada)

1. **Estabilizar qualidade base**
   - Ajustar ESLint para ambiente browser/TS e zerar erros atuais.
   - Adicionar testes mínimos de smoke para rotas críticas + hooks de dados.

2. **Fechar lacunas de produto mais visíveis**
   - Implementar undo/redo funcional.
   - Concluir “mais opções” por fala e ações em massa da seleção.
   - Enriquecer mini-preview de capítulo (hoje informativo apenas).

3. **Alinhar integração backend/frontend**
   - Revisar mapeamento final de endpoints OAuth para evitar divergência em produção.
   - Confirmar modelo de refresh (cookie httpOnly vs armazenamento local) conforme decisão de segurança.
   - Implementar streaming de IA no painel (se backend já suportar `ai:stream`).

4. **Completar requisitos de release do plano**
   - i18n (pt-BR/en/es).
   - Pipeline CI (lint + test + build).
   - Cobertura mínima de E2E para login/callback, seleção de livro, edição de fala e narração.

## Conclusão

O WriterCenterFront está em um estágio **avançado de MVP funcional**, mas **ainda não está 100% aderente ao checklist final da especificação**. As lacunas atuais concentram-se menos em estrutura visual e mais em robustez de engenharia (qualidade/automação), acabamento de UX e alinhamento final de contrato de autenticação/IA streaming.
