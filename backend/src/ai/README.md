# 🤖 Módulo de IA (AI Module)

Este módulo centraliza todos os serviços de Inteligência Artificial do sistema de narração de livros.

## 📁 Estrutura

```
src/ai/
├── index.ts                    # Exports centralizados
├── ai.config.ts               # Configuração de provedores
├── ai.factory.ts              # Factory para criação de provedores
├── ai.service.ts              # Serviço principal (orquestrador)
├── interfaces/
│   ├── text-provider.interface.ts    # Interface para IA de texto
│   ├── image-provider.interface.ts   # Interface para IA de imagem
│   └── tts-provider.interface.ts     # Interface para TTS
└── providers/
    ├── gemini-text.provider.ts       # Gemini para texto
    ├── gemini-image.provider.ts      # Gemini Imagen para imagens
    └── gemini-tts.provider.ts        # Gemini TTS para áudio
```

## 🚀 Uso

### Importação Simplificada

```typescript
import { aiService } from './ai';

// Usar os métodos diretamente
const result = await aiService.spellCheck({ text: 'meu texto' });
const voices = await aiService.getAvailableVoices();
const audio = await aiService.generateAudio({ text: 'Olá mundo', voiceName: 'Schedar' });
```

### Verificar Provedores Ativos

```typescript
import { aiService } from './ai';

const providers = aiService.getProviderInfo();
console.log(providers);
// { text: 'gemini', image: 'gemini', tts: 'gemini' }
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Provedor padrão (gemini, openai, anthropic)
AI_TEXT_PROVIDER=gemini
AI_IMAGE_PROVIDER=gemini
AI_TTS_PROVIDER=gemini

# Gemini
GEMINI_API_KEY=your-api-key
GEMINI_TEXT_MODEL=gemini-2.0-flash
GEMINI_IMAGE_MODEL=imagen-3.0-generate-001
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts

# OpenAI (opcional)
OPENAI_API_KEY=your-api-key
OPENAI_TEXT_MODEL=gpt-4o
OPENAI_IMAGE_MODEL=dall-e-3
OPENAI_TTS_MODEL=tts-1-hd

# Anthropic (opcional)
ANTHROPIC_API_KEY=your-api-key
ANTHROPIC_TEXT_MODEL=claude-3-5-sonnet-20241022

# ElevenLabs (opcional)
ELEVENLABS_API_KEY=your-api-key
ELEVENLABS_DEFAULT_VOICE=Rachel

# Azure Speech (opcional)
AZURE_SPEECH_KEY=your-api-key
AZURE_SPEECH_REGION=eastus
```

## 📝 Adicionando Novos Provedores

### 1. Criar o Provider

```typescript
// src/ai/providers/openai-text.provider.ts
import { TextAIProvider, SpellCheckResult, ... } from '../interfaces/text-provider.interface';

export class OpenAITextProvider implements TextAIProvider {
    readonly name = 'openai';
    
    async initialize(): Promise<void> {
        // Inicialização
    }
    
    async spellCheck(options: SpellCheckOptions): Promise<SpellCheckResult> {
        // Implementação
    }
    
    // ... outros métodos
}
```

### 2. Registrar na Factory

```typescript
// src/ai/ai.factory.ts
import { OpenAITextProvider } from './providers/openai-text.provider';

static createTextProvider(providerName: TextProviderType): TextAIProvider {
    switch (providerName) {
        case 'gemini':
            return new GeminiTextProvider();
        case 'openai':
            return new OpenAITextProvider(); // ← Adicionar aqui
        default:
            throw new Error(`Provider '${providerName}' not supported`);
    }
}
```

### 3. Configurar no config

```typescript
// src/ai/ai.config.ts
openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    textModel: process.env.OPENAI_TEXT_MODEL || 'gpt-4o',
    imageModel: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
    ttsModel: process.env.OPENAI_TTS_MODEL || 'tts-1-hd'
}
```

## 🎤 Vozes TTS Disponíveis

O Gemini TTS oferece 30 vozes pré-definidas:

| Voz | Gênero | Descrição |
|-----|--------|-----------|
| Zephyr | NEUTRAL | Brilhante, alegre |
| Puck | MALE | Animado, jovem |
| Charon | MALE | Informativo, narrador |
| Kore | FEMALE | Firme, séria |
| Schedar | MALE | Equilibrado, narrador ideal |
| Sulafat | FEMALE | Quente, acolhedora |
| ... | ... | ... |

## 📊 Funcionalidades

### Texto (Text AI)
- ✅ Correção ortográfica
- ✅ Sugestões de melhoria
- ✅ Enriquecimento com contexto de personagem

### Imagem (Image AI)
- ✅ Geração de imagem de emoção
- ✅ Geração de imagem geral

### TTS (Text-to-Speech)
- ✅ Geração de áudio
- ✅ Listagem de vozes
- ✅ Preview de voz
- ✅ Validação de SSML

## 🔄 Migração do TTS Antigo

O módulo TTS foi migrado de `src/tts/` para `src/ai/`. Os controllers e services foram atualizados para usar o novo `aiService`:

```typescript
// Antes
import { ttsService } from '../tts/tts.service';
const voices = await ttsService.getAvailableVoices();

// Depois
import { aiService } from '../ai';
const voices = await aiService.getAvailableVoices();
```
