# Review Técnico + Plano de Execução
## Prioridade: Remoção de Mocks e Integração Real com Backend

**Data:** 2026-02-11  
**Objetivo:** revisar o estado atual após os PRs recentes e definir um plano de entrega para sair de comportamentos simulados/temporários e fechar integrações reais com backend.

---

## 1) Diagnóstico objetivo (estado atual)

### 1.1 Pontos fortes já consolidados
- Base de frontend estruturada (router, stores, hooks e camadas de API).
- Lint/build/test unitário mínimos estão operacionais.
- Studio principal já funciona em fluxo de edição/narração com boa cobertura de UX inicial.

### 1.2 Débitos técnicos que bloqueiam “integração real”

#### A) Autenticação: contrato OAuth inconsistente + estratégia híbrida de token
- O documento de especificação define endpoints em `/auth/sso/authorize`, `/auth/token`, `/auth/token/refresh`, `/auth/userinfo`.
- O frontend ainda referencia `/oauth/*` e `/auth/refresh` em pontos diferentes.
- O refresh ainda depende de token em `localStorage` (além do `withCredentials`), o que conflita com a estratégia de cookie httpOnly descrita na especificação.

**Impacto:** risco de falha de sessão em produção, inconsistência entre ambientes e fragilidade de segurança.

#### B) IA Chat: sem streaming no painel
- A especificação prevê chat com stream (`POST /api/ai/chat` streaming + evento `ai:stream`).
- O painel atual usa request/resposta única no `AiChat`.

**Impacto:** UX pior (latência percebida maior) e perda de paridade com backend de streaming.

#### C) Ações em massa e “quick actions” com TODO/placeholder
- Existem pontos explicitamente marcados como não finalizados (ex.: geração em massa de seleção, dropdown “mais opções”, mini-preview de capítulo).

**Impacto:** fluxo de escrita fica incompleto em cenários reais de uso intensivo.

#### D) Mocks e testes ainda focados em camada local
- A suíte adicionada cobre utils/stores, mas não valida integração HTTP/WebSocket com contrato real.
- Ainda há dependência de mocks de storage nos testes e ausência de testes de contrato/API (MSW/fixtures de backend).

**Impacto:** baixa confiança para regressões em integração real.

---

## 2) Estratégia de execução (ordem de prioridade)

### Fase 0 — Alinhamento de contrato backend/frontend (obrigatória)
**Meta:** unificar endpoints e semântica de auth antes de mexer em features.

1. Definir “fonte única” de contrato (OpenAPI/collection versionada).
2. Corrigir mapa de endpoints de auth para o contrato final.
3. Formalizar estratégia de sessão:
   - access token em memória;
   - refresh via cookie httpOnly;
   - frontend sem persistir refresh token em `localStorage`.

**Critério de aceite:** login/callback/refresh/logout funcionando em dev contra backend real, sem refresh token armazenado localmente.

---

### Fase 1 — Remoção progressiva de mocks de integração
**Meta:** substituir mocks locais por integração controlada e testável.

1. Introduzir camada de testes de integração HTTP com MSW (contratos reais).
2. Separar testes:
   - unitários puros (utils/stores);
   - integração API (hooks + endpoints);
   - E2E crítico (auth callback, abrir livro, editar fala, narração).
3. Reduzir mocks de infra para apenas os indispensáveis (ex.: storage em unit tests), removendo simulações que escondem falhas de contrato.

**Critério de aceite:** testes de integração falham quando contrato backend muda indevidamente.

---

### Fase 2 — Backend integration first nas features mais críticas
**Meta:** fechar o “core loop” de escritor com backend real.

1. IA Chat com streaming:
   - implementar consumo streaming (`fetch` com `ReadableStream` ou socket `ai:stream`);
   - render incremental de resposta.
2. Ações em massa da seleção:
   - usar endpoint de batch update (ou endpoint final definido);
   - feedback transacional (sucesso parcial/erro por item).
3. Revisar narração e mídia para garantir idempotência/retry e atualização de cache consistente.

**Critério de aceite:** fluxo completo de capítulo com ações IA/mídia sem fallback manual.

---

### Fase 3 — Hardening de produção
**Meta:** confiabilidade operacional.

1. Observabilidade mínima (Sentry + logs de erro com correlation id).
2. Retry/backoff padronizado em chamadas críticas.
3. Feature flags para liberar streaming e batch gradualmente.

**Critério de aceite:** métricas de erro e tempo de resposta monitoradas no ambiente de staging.

---

## 3) Backlog priorizado (sprintável)

## P0 (iniciar imediatamente)
- [ ] Unificar endpoints auth no `endpoints.ts` e usos relacionados.
- [ ] Refatorar refresh para cookie httpOnly (eliminar refresh token em `localStorage`).
- [ ] Teste de integração do fluxo AuthGuard → Callback → UserInfo → Refresh.

## P1
- [ ] Implementar streaming no `AiChat`.
- [ ] Implementar geração em massa de seleção no TopBar.
- [ ] Implementar “mais opções” da fala (dropdown funcional).

## P2
- [ ] Mini-preview real de capítulos (não placeholder).
- [ ] E2E smoke completo do core loop do escritor.
- [ ] Instrumentação de observabilidade.

---

## 4) Riscos e mitigação

- **Risco:** backend ainda não consolidou contrato final OAuth/stream.  
  **Mitigação:** fechar contrato em PR único de spec (OpenAPI) antes de mudanças no frontend.

- **Risco:** remoção de mocks quebrar pipeline rapidamente.  
  **Mitigação:** migração em etapas (unitário -> integração MSW -> E2E), com cobertura mínima por fluxo crítico.

- **Risco:** regressões de sessão cross-domain.  
  **Mitigação:** suíte dedicada de auth em ambiente staging com domínio/cookie real.

---

## 5) Recomendação final

A próxima implementação deve começar por **autenticação e contrato backend** (P0), pois isso destrava o restante com menor retrabalho. Em paralelo, manter os testes unitários existentes e ampliar rapidamente para integração de API, reduzindo mocks que hoje mascaram divergências de contrato.
