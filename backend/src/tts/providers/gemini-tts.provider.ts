import { GoogleGenerativeAI } from '@google/generative-ai';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../interfaces/tts-provider.interface';
import { ttsConfig } from '../tts.config';

/**
 * 30 Vozes Fixas do Gemini TTS
 * Documentação: https://ai.google.dev/gemini-api/docs/speech-generation?hl=pt-br#voices
 */
const GEMINI_VOICES: Voice[] = [
    { id: 'Zephyr', name: 'Zephyr', languageCode: 'pt-BR', gender: 'NEUTRAL', provider: 'gemini', description: 'Bright - Brilhante, alegre' },
    { id: 'Puck', name: 'Puck', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Upbeat - Animado, jovem' },
    { id: 'Charon', name: 'Charon', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative - Informativo, narrador' },
    { id: 'Kore', name: 'Kore', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Firm - Firme, séria' },
    { id: 'Fenrir', name: 'Fenrir', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Excitable - Excitável, energético' },
    { id: 'Leda', name: 'Leda', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Youthful - Juvenil' },
    { id: 'Orus', name: 'Orus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Firme, autoritário' },
    { id: 'Aoede', name: 'Aoede', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Breezy - Leve, descontraída' },
    { id: 'Callirrhoe', name: 'Callirrhoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Easy-going - Tranquila, calma' },
    { id: 'Autonoe', name: 'Autonoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Bright - Brilhante, otimista' },
    { id: 'Enceladus', name: 'Enceladus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Breathy - Sussurrado, misterioso' },
    { id: 'Iapetus', name: 'Iapetus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Clear - Claro, nítido' },
    { id: 'Umbriel', name: 'Umbriel', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Easy-going - Tranquilo, relaxado' },
    { id: 'Algieba', name: 'Algieba', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Suave, gentil' },
    { id: 'Despina', name: 'Despina', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Suave, elegante' },
    { id: 'Erinome', name: 'Erinome', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Clear - Limpo, neutro' },
    { id: 'Algenib', name: 'Algenib', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Gravelly - Rouco, profundo' },
    { id: 'Rasalgethi', name: 'Rasalgethi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative - Informativo' },
    { id: 'Laomedeia', name: 'Laomedeia', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Upbeat - Animada, alegre' },
    { id: 'Achernar', name: 'Achernar', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Soft - Suave, delicada' },
    { id: 'Alnilam', name: 'Alnilam', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Firme, assertivo' },
    { id: 'Schedar', name: 'Schedar', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Even - Equilibrado, narrador ideal' },
    { id: 'Gacrux', name: 'Gacrux', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Mature - Adulto, experiente' },
    { id: 'Pulcherrima', name: 'Pulcherrima', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Forward - Direta, assertiva' },
    { id: 'Achird', name: 'Achird', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Friendly - Amigável, simpático' },
    { id: 'Zubenelgenubi', name: 'Zubenelgenubi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Casual - Informal, descontraído' },
    { id: 'Vindemiatrix', name: 'Vindemiatrix', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Gentle - Gentil, carinhosa' },
    { id: 'Sadachbia', name: 'Sadachbia', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Lively - Animado, vivaz' },
    { id: 'Sadaltager', name: 'Sadaltager', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Knowledgeable - Sábio, conhecedor' },
    { id: 'Sulafat', name: 'Sulafat', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Warm - Quente, acolhedora' }
];

export class GeminiTTSProvider implements TTSProvider {
    readonly name = 'gemini';
    readonly supportedFormats = ['wav'];
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = ttsConfig.providers.gemini?.apiKey;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY não configurada. Configure no arquivo .env');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async initialize(): Promise<void> {
        console.log('✅ Gemini TTS Provider inicializado');
        console.log(`   Modelo: ${ttsConfig.providers.gemini?.model}`);
        console.log(`   Vozes disponíveis: ${GEMINI_VOICES.length}`);
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        const voiceName = options.voice.voiceId || ttsConfig.defaultVoice;
        const modelName = ttsConfig.providers.gemini?.model || 'gemini-2.5-flash-preview-tts';

        console.log(`🎤 Gerando áudio com Gemini TTS`);
        console.log(`   Voz: ${voiceName}`);
        console.log(`   Texto: ${options.text.substring(0, 50)}...`);

        try {
            // Usar a API do Gemini para TTS
            // NOTA: A API de TTS do Gemini requer o SDK @google/genai (diferente do @google/generative-ai)
            // Por enquanto, usamos uma abordagem via REST API direta
            
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${ttsConfig.providers.gemini.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: options.text }]
                        }],
                        generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: voiceName
                                    }
                                }
                            }
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erro da API Gemini:', errorData);
                throw new Error(`Erro na API Gemini: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            // Extrair o áudio da resposta
            const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            
            if (!audioData) {
                console.error('Resposta sem áudio:', JSON.stringify(data, null, 2));
                throw new Error('Nenhum dado de áudio na resposta');
            }

            const buffer = Buffer.from(audioData, 'base64');
            
            console.log(`✅ Áudio gerado: ${buffer.length} bytes`);

            return {
                buffer: buffer,
                format: 'wav',
                sampleRate: 24000
            };
        } catch (error: any) {
            console.error('❌ Erro ao gerar áudio:', error);
            throw new Error(`Falha na geração de áudio: ${error.message}`);
        }
    }

    async getAvailableVoices(): Promise<Voice[]> {
        return GEMINI_VOICES;
    }

    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> {
        const text = sampleText || `Olá! Esta é uma prévia da voz ${voiceId}. Como você está hoje?`;
        return this.generateAudio({
            text,
            voice: { voiceId }
        });
    }

    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        // Gemini TTS não usa SSML tradicional
        // Controle de estilo é feito via linguagem natural no prompt
        return { valid: true };
    }
}
