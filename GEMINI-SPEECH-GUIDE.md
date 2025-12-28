# Guia de Implementação - Gemini TTS (Text-to-Speech)

## 📋 Visão Geral

Este guia documenta a implementação correta da API Gemini TTS para geração de áudio no Sistema de Narração de Livros.

A API Gemini TTS é ideal para nosso caso de uso de **audiolivros** por oferecer:
- Recitação exata de texto
- Controle refinado sobre estilo e som
- Suporte a múltiplos locutores (até 2)
- Suporte nativo ao Português Brasileiro (pt-BR)

---

## 🎤 Vozes Disponíveis (30 Vozes Predefinidas)

As vozes são fixas e devem ser usadas pelo campo `voice_name`. Todas suportam português:

| Nome da Voz | Característica | Uso Recomendado |
|-------------|----------------|-----------------|
| **Zephyr** | Bright (Brilhante) | Narrações alegres |
| **Puck** | Upbeat (Animado) | Personagens jovens/animados |
| **Charon** | Informativa | Narrações didáticas |
| **Kore** | Firm (Firme) | Personagens sérios |
| **Fenrir** | Excitable (Excitável) | Personagens energéticos |
| **Leda** | Youthful (Juvenil) | Personagens jovens |
| **Orus** | Firm (Firme) | Narradores sérios |
| **Aoede** | Breezy (Leve) | Personagens descontraídos |
| **Callirrhoe** | Tranquila | Cenas calmas |
| **Autonoe** | Bright (Brilhante) | Personagens otimistas |
| **Enceladus** | Breathy (Sussurrado) | Cenas intimistas/mistério |
| **Iapetus** | Clear (Claro) | Narrações claras |
| **Umbriel** | Tranquilo | Personagens calmos |
| **Algieba** | Suave | Personagens gentis |
| **Despina** | Smooth (Suave) | Narrações elegantes |
| **Erinome** | Clear (Limpo) | Narrações neutras |
| **Algenib** | Gravelly (Rouco) | Personagens velhos/misteriosos |
| **Rasalgethi** | Informativa | Narradores |
| **Laomedeia** | Upbeat (Animado) | Personagens alegres |
| **Achernar** | Soft (Suave) | Personagens delicados |
| **Alnilam** | Firm (Firme) | Personagens autoritários |
| **Schedar** | Even (Equilibrado) | Narrações neutras |
| **Gacrux** | Mature (Adulto) | Personagens maduros |
| **Pulcherrima** | Forward (Direto) | Personagens assertivos |
| **Achird** | Friendly (Amigável) | Personagens simpáticos |
| **Zubenelgenubi** | Casual | Diálogos informais |
| **Vindemiatrix** | Gentle (Gentil) | Personagens carinhosos |
| **Sadachbia** | Lively (Animado) | Personagens vivazes |
| **Sadaltager** | Knowledgeable (Conhecedor) | Personagens sábios |
| **Sulafat** | Warm (Quente) | Personagens acolhedores |

### Recomendação de Vozes por Tipo de Personagem

```
Narrador Principal:     Schedar, Rasalgethi, Orus, Gacrux
Protagonista Feminina:  Kore, Aoede, Vindemiatrix, Leda
Protagonista Masculino: Puck, Alnilam, Achird, Sadaltager
Vilão/Mistério:         Charon, Algenib, Enceladus
Personagem Jovem:       Leda, Zephyr, Sadachbia, Laomedeia
Personagem Idoso:       Gacrux, Algenib, Sulafat
Personagem Alegre:      Puck, Sadachbia, Autonoe
Personagem Sério:       Kore, Orus, Alnilam
```

---

## 🔧 Modelos Compatíveis

| Modelo | Único Locutor | Múltiplos Locutores |
|--------|---------------|---------------------|
| `gemini-2.5-flash-preview-tts` | ✅ | ✅ |
| `gemini-2.5-pro-preview-tts` | ✅ | ✅ |

**Limitações:**
- Entrada: Somente texto
- Saída: Somente áudio (WAV PCM)
- Janela de contexto: 32.000 tokens
- Máximo de locutores: 2

---

## 🌍 Idiomas Suportados

O sistema detecta automaticamente o idioma. Suporta 24 idiomas, incluindo:

| Idioma | Código |
|--------|--------|
| **Português (Brasil)** | `pt-BR` |
| Inglês (EUA) | `en-US` |
| Espanhol (EUA) | `es-US` |
| Francês (França) | `fr-FR` |
| Alemão (Alemanha) | `de-DE` |

---

## 💻 Implementação para Node.js/TypeScript

### 1. Estrutura da Requisição - Único Locutor

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateSpeech(text: string, voiceName: string): Promise<Buffer> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: text,
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName // Ex: 'Kore', 'Puck', 'Schedar'
                    }
                }
            }
        }
    });

    // O áudio retorna como PCM linear 24kHz, 16-bit
    const audioData = response.candidates[0].content.parts[0].inlineData.data;
    return Buffer.from(audioData, 'base64');
}
```

### 2. Estrutura da Requisição - Múltiplos Locutores (Narrador + Personagem)

```typescript
interface SpeakerConfig {
    speaker: string;      // Nome do locutor no texto
    voiceName: string;    // Voz Gemini a usar
}

async function generateMultiSpeakerAudio(
    text: string, 
    speakers: SpeakerConfig[]
): Promise<Buffer> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: text,
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: speakers.map(s => ({
                        speaker: s.speaker,
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: s.voiceName
                            }
                        }
                    }))
                }
            }
        }
    });

    const audioData = response.candidates[0].content.parts[0].inlineData.data;
    return Buffer.from(audioData, 'base64');
}

// Exemplo de uso:
const text = `
Narrador: Era uma noite escura e tempestuosa.
Maria: O que foi aquele barulho?
Narrador: Ela se aproximou lentamente da janela.
`;

const audio = await generateMultiSpeakerAudio(text, [
    { speaker: 'Narrador', voiceName: 'Schedar' },
    { speaker: 'Maria', voiceName: 'Kore' }
]);
```

### 3. Salvando o Áudio em WAV

```typescript
import * as fs from 'fs';

function saveAsWav(
    pcmData: Buffer, 
    filename: string,
    sampleRate: number = 24000,
    channels: number = 1,
    bitsPerSample: number = 16
): void {
    const dataSize = pcmData.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;
    
    const buffer = Buffer.alloc(fileSize);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);
    
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);  // PCM
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
    buffer.writeUInt16LE(channels * bitsPerSample / 8, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    pcmData.copy(buffer, 44);
    
    fs.writeFileSync(filename, buffer);
}
```

---

## 🎭 Controle de Estilo com Prompts

O grande diferencial do Gemini TTS é o controle por linguagem natural. Você pode instruir o modelo sobre **como** falar.

### Estrutura de Prompt para Audiolivros

```
# PERFIL DE ÁUDIO: [Nome do Narrador]
## [Papel/Função]

## CENA: [Descrição do ambiente]
[Descreva o contexto emocional e físico da cena]

### OBSERVAÇÕES DO DIRETOR
Estilo: [Tom geral - dramático, leve, sombrio, etc.]
Ritmo: [Velocidade - rápido, lento, pausado, etc.]
Sotaque: [Opcional - brasileiro, português, regional, etc.]

#### TRANSCRIÇÃO
[O texto a ser narrado]
```

### Exemplos de Prompts para Audiolivros

**1. Narração Dramática:**
```
# PERFIL DE ÁUDIO: Narrador
## Contador de histórias experiente

## CENA: Momento tenso do livro
O protagonista está prestes a descobrir um segredo terrível.
A tensão no ar é palpável.

### OBSERVAÇÕES DO DIRETOR
Estilo: Dramático, envolvente, com pausas estratégicas para criar suspense.
Ritmo: Moderado, desacelerando nos momentos de revelação.

#### TRANSCRIÇÃO
E foi então que ele abriu a porta do porão. O que viu fez seu sangue gelar nas veias.
```

**2. Diálogo com Emoção:**
```
Diga com tristeza profunda, como se estivesse à beira das lágrimas:
"Nunca pensei que terminaria assim. Depois de tantos anos juntos..."
```

**3. Narração Infantil:**
```
# PERFIL DE ÁUDIO: Contador de Histórias
## Avô carinhoso contando história para netos

### OBSERVAÇÕES DO DIRETOR
Estilo: Caloroso, acolhedor, com "sorriso na voz"
Ritmo: Calmo, com entonações expressivas para manter a atenção

#### TRANSCRIÇÃO
Era uma vez, em um reino muito, muito distante, uma princesa que sonhava em ser exploradora.
```

---

## 📝 Atualização do Provider Atual

O arquivo `gemini-tts.provider.ts` precisa ser atualizado para usar a API real:

```typescript
// backend/src/tts/providers/gemini-tts.provider.ts

import { GoogleGenAI } from '@google/genai';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../interfaces/tts-provider.interface';
import { ttsConfig } from '../tts.config';

// Lista completa das 30 vozes Gemini
const GEMINI_VOICES: Voice[] = [
    { id: 'Zephyr', name: 'Zephyr', languageCode: 'pt-BR', gender: 'NEUTRAL', provider: 'gemini', description: 'Bright - Brilhante' },
    { id: 'Puck', name: 'Puck', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Upbeat - Animado' },
    { id: 'Charon', name: 'Charon', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative - Informativo' },
    { id: 'Kore', name: 'Kore', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Firm - Firme' },
    { id: 'Fenrir', name: 'Fenrir', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Excitable - Excitável' },
    { id: 'Leda', name: 'Leda', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Youthful - Juvenil' },
    { id: 'Orus', name: 'Orus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Firme' },
    { id: 'Aoede', name: 'Aoede', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Breezy - Leve' },
    { id: 'Callirrhoe', name: 'Callirrhoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Easy-going - Tranquila' },
    { id: 'Autonoe', name: 'Autonoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Bright - Brilhante' },
    { id: 'Enceladus', name: 'Enceladus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Breathy - Sussurrado' },
    { id: 'Iapetus', name: 'Iapetus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Clear - Claro' },
    { id: 'Umbriel', name: 'Umbriel', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Easy-going - Tranquilo' },
    { id: 'Algieba', name: 'Algieba', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Suave' },
    { id: 'Despina', name: 'Despina', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Suave' },
    { id: 'Erinome', name: 'Erinome', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Clear - Limpo' },
    { id: 'Algenib', name: 'Algenib', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Gravelly - Rouco' },
    { id: 'Rasalgethi', name: 'Rasalgethi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative - Informativo' },
    { id: 'Laomedeia', name: 'Laomedeia', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Upbeat - Animado' },
    { id: 'Achernar', name: 'Achernar', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Soft - Suave' },
    { id: 'Alnilam', name: 'Alnilam', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Firme' },
    { id: 'Schedar', name: 'Schedar', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Even - Equilibrado' },
    { id: 'Gacrux', name: 'Gacrux', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Mature - Adulto' },
    { id: 'Pulcherrima', name: 'Pulcherrima', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Forward - Direto' },
    { id: 'Achird', name: 'Achird', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Friendly - Amigável' },
    { id: 'Zubenelgenubi', name: 'Zubenelgenubi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Casual' },
    { id: 'Vindemiatrix', name: 'Vindemiatrix', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Gentle - Gentil' },
    { id: 'Sadachbia', name: 'Sadachbia', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Lively - Animado' },
    { id: 'Sadaltager', name: 'Sadaltager', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Knowledgeable - Conhecedor' },
    { id: 'Sulafat', name: 'Sulafat', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Warm - Quente' }
];

export class GeminiTTSProvider implements TTSProvider {
    readonly name = 'gemini';
    readonly supportedFormats = ['wav'];
    private client: GoogleGenAI;

    constructor() {
        const apiKey = ttsConfig.providers.gemini?.apiKey;
        if (!apiKey) {
            throw new Error('Gemini API Key not configured');
        }
        this.client = new GoogleGenAI({ apiKey });
    }

    async initialize(): Promise<void> {
        // Validação de conexão pode ser feita aqui
        console.log('Gemini TTS Provider initialized');
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        const voiceName = options.voice.voiceId || 'Schedar';
        const model = ttsConfig.providers.gemini?.model || 'gemini-2.5-flash-preview-tts';

        try {
            const response = await this.client.models.generateContent({
                model: model,
                contents: options.text,
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voiceName
                            }
                        }
                    }
                }
            });

            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            
            if (!audioData) {
                throw new Error('No audio data in response');
            }

            const buffer = Buffer.from(audioData, 'base64');
            
            return {
                buffer: buffer,
                format: 'wav',
                sampleRate: 24000
            };
        } catch (error) {
            console.error('Error generating audio with Gemini:', error);
            throw error;
        }
    }

    async getAvailableVoices(): Promise<Voice[]> {
        return GEMINI_VOICES;
    }

    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> {
        const text = sampleText || `Esta é uma prévia da voz ${voiceId}. Olá, como você está?`;
        return this.generateAudio({
            text,
            voice: { voiceId }
        });
    }

    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        // Gemini TTS não usa SSML tradicional
        // Usa prompts em linguagem natural para controle de estilo
        return { valid: true };
    }
}
```

---

## 📦 Dependência NPM

Para usar a nova API do Gemini, instale:

```bash
npm install @google/genai
```

---

## 🔑 Configuração de Ambiente

```env
GEMINI_API_KEY=sua_chave_api_aqui
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
```

---

## ⚠️ Notas Importantes

1. **Pré-lançamento**: A API TTS do Gemini está em pré-lançamento. A interface pode mudar.

2. **Formato de Áudio**: O áudio retorna como PCM linear, 24kHz, 16-bit, mono.

3. **Sem SSML**: Diferente de APIs tradicionais, o controle é feito por prompts em linguagem natural.

4. **Limite de Locutores**: Máximo de 2 locutores por requisição.

5. **Detecção Automática**: O idioma é detectado automaticamente pelo texto.

6. **Testar Vozes**: Use o [AI Studio](https://aistudio.google.com/generate-speech?hl=pt-br) para testar as vozes antes de implementar.

---

## 📚 Referências

- [Documentação Oficial - Geração de Voz](https://ai.google.dev/gemini-api/docs/speech-generation?hl=pt-br)
- [AI Studio - Teste de Vozes](https://aistudio.google.com/generate-speech?hl=pt-br)
- [Cookbook - TTS Getting Started](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_TTS.ipynb)
