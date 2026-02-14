# AI Model Matrix (Homologados)

Esta matriz define os **modelos homologados por provider e endpoint** para o backend.

> Fonte de verdade em código: `backend/src/ai/ai.config.ts`.

## Gemini

| Endpoint | Modelos homologados | Default |
|---|---|---|
| text | `gemini-2.5-flash`, `gemini-2.0-flash` | `gemini-2.5-flash` |
| image | `imagen-3.0-generate-001` | `imagen-3.0-generate-001` |
| tts | `gemini-2.5-flash-preview-tts` | `gemini-2.5-flash-preview-tts` |

## OpenAI

| Endpoint | Modelos homologados | Default |
|---|---|---|
| text | `gpt-4o`, `gpt-4o-mini` | `gpt-4o` |
| image | `gpt-image-1`, `dall-e-3` | `gpt-image-1` |
| tts | `gpt-4o-mini-tts`, `tts-1-hd`, `tts-1` | `gpt-4o-mini-tts` |

## Anthropic

| Endpoint | Modelos homologados | Default |
|---|---|---|
| text | `claude-3-5-sonnet-20241022` | `claude-3-5-sonnet-20241022` |

## Stability

| Endpoint | Modelos homologados | Default |
|---|---|---|
| image | `stable-diffusion-xl-1024-v1-0` | `stable-diffusion-xl-1024-v1-0` |

## ElevenLabs

| Endpoint | Modelos homologados | Default |
|---|---|---|
| tts | `eleven_multilingual_v2` | `eleven_multilingual_v2` |

## Regras

- Variáveis de ambiente (`*_MODEL`) podem sobrescrever defaults **somente** com valores homologados.
- O backend valida compatibilidade modelo-endpoint na inicialização e falha em caso de configuração inválida.
- Novos modelos devem ser adicionados primeiro na matriz de código e refletidos neste documento.
