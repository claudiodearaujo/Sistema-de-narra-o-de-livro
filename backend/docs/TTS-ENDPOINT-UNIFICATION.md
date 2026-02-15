# Unificação de Endpoints TTS (Arquitetura A: ai-service proxy)

## Inventário de endpoints TTS ativos no frontend

Frontend principal (`Frontend/WriterCenterFront`) consome atualmente:

- `GET /api/voices` (catálogo de vozes)
- `POST /api/voices/preview` (preview de voz)
- `POST /api/speeches/:id/audio` (geração TTS por fala)

Não há consumo ativo de `/api/ai/tts/*` no frontend React atual.

## Arquitetura escolhida

**A) Tudo via `ai-service` proxy.**

Decisão aplicada:

- Backend monolito mantém contratos públicos (`/api/voices`, `/api/voices/preview`, `/api/speeches/:id/audio`).
- Geração/listagem TTS deixa de usar providers locais diretamente nesses fluxos e passa a usar `aiServiceClient`.
- O `ai-service` vira o único caminho de execução TTS para esses endpoints.

## Mapeamento operacional

- `GET /api/voices` → proxy interno para `GET {AI_SERVICE_URL}/tts/voices`
- `POST /api/voices/preview` → proxy interno para `POST {AI_SERVICE_URL}/tts/preview`
- `POST /api/speeches/:id/audio` → proxy interno para `POST {AI_SERVICE_URL}/tts/generate`

## Variáveis de ambiente obrigatórias para este fluxo

No backend monolito:

- `AI_SERVICE_URL` (ex.: `http://localhost:3001/api`)
- `AI_SERVICE_API_KEY` (deve casar com a chave configurada no `ai-service`)

Sem essas variáveis, os endpoints acima podem falhar ao comunicar com o serviço de IA.
