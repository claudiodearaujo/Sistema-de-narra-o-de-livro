# Contrato WebSocket de Narração

Este documento define o contrato único para eventos de progresso de narração emitidos pelo backend e consumidos pelo frontend.

## Eventos principais

### `narration:started`
Emitido quando o job inicia para um capítulo.

```json
{
  "chapterId": "string",
  "status": "started",
  "progress": 0,
  "totalSpeeches": 12,
  "processedSpeeches": 0,
  "completedSpeeches": 0,
  "failedSpeeches": 0
}
```

### `narration:progress`
Emitido em cada etapa relevante por fala (processando, concluída ou falha).

```json
{
  "chapterId": "string",
  "speechId": "string",
  "status": "processing | completed | failed",
  "progress": 58,
  "current": 7,
  "total": 12,
  "processedSpeeches": 7,
  "completedSpeeches": 6,
  "failedSpeeches": 1,
  "audioUrl": "/uploads/audio/file.wav",
  "error": "mensagem de erro"
}
```

Regras:
- `progress` é percentual inteiro (0-100).
- `current` representa a posição 1-based da fala no lote.
- `processedSpeeches = completedSpeeches + failedSpeeches`.
- `audioUrl` existe apenas quando `status = "completed"`.
- `error` existe apenas quando `status = "failed"`.

### `narration:completed`
Emitido ao final do lote com sucesso global (mesmo que haja falhas pontuais de fala).

```json
{
  "chapterId": "string",
  "status": "completed",
  "progress": 100,
  "totalSpeeches": 12,
  "processedSpeeches": 12,
  "completedSpeeches": 11,
  "failedSpeeches": 1
}
```

### `narration:failed`
Emitido quando o job falha de forma global (erro interrompendo processamento).

```json
{
  "chapterId": "string",
  "status": "failed",
  "progress": 42,
  "totalSpeeches": 12,
  "processedSpeeches": 5,
  "completedSpeeches": 4,
  "failedSpeeches": 1,
  "error": "mensagem de erro"
}
```

## Compatibilidade com eventos por fala

Os eventos `narration:speech-completed` e `narration:speech-failed` continuam disponíveis para consumidores legados, mas devem refletir os mesmos dados de estado do evento `narration:progress` correspondente (`status`, `progress`, contadores e `speechId`).
