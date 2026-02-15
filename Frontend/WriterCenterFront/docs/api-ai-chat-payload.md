# Payload oficial do endpoint `/api/ai/chat`

Este documento descreve o contrato atual aceito pelo backend em `POST /api/ai/chat`.

## Request body

```json
{
  "message": "string (obrigatório)",
  "history": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ],
  "bookId": "string (opcional)",
  "chapterId": "string (opcional)",
  "speechIds": ["string"],
  "stream": true
}
```

### Regras importantes

- `message` é obrigatório e não pode ser vazio.
- `history` é opcional e representa o histórico já exibido no chat.
- `bookId`, `chapterId` e `speechIds` são campos **top-level** (não aninhados em `context`).
- `stream` controla o modo de resposta:
  - `true` (padrão no backend): resposta em streaming SSE (`data: {"delta": "..."}`).
  - `false`: resposta única em JSON.

## Respostas

### 1) Streaming (`stream: true`)

- `Content-Type: text/event-stream`
- Eventos no formato:

```text
data: {"delta":"..."}

data: [DONE]
```

### 2) Não-streaming (`stream: false`)

```json
{
  "message": "string",
  "usage": {
    "promptTokens": 0,
    "completionTokens": 0,
    "totalTokens": 0
  }
}
```

## Compatibilidade no frontend

Para evitar regressão com chamadas antigas, o hook `useAiChat` normaliza payload legado com `context.bookId/chapterId/speechIds` para o formato oficial top-level antes de enviar o POST.
