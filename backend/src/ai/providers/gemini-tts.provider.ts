import { GoogleGenAI } from '@google/genai';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../interfaces/tts-provider.interface';
import { aiConfig } from '../ai.config';
import { convertWavToMp3 } from '../../utils/audio-converter';
import { RateLimiter, rateLimiterManager } from '../../utils/rate-limiter';

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
    readonly supportedFormats = ['mp3', 'wav'];
    private ai: GoogleGenAI;
    private rateLimiter: RateLimiter;

    constructor() {
        this.ai = new GoogleGenAI({});
        this.rateLimiter = rateLimiterManager.get('gemini-tts', aiConfig.rateLimit.gemini);
    }

    async initialize(): Promise<void> {
        console.log('✅ Gemini TTS Provider inicializado');
        console.log(`   Modelo: ${aiConfig.providers.gemini?.ttsModel}`);
        console.log(`   Vozes disponíveis: ${GEMINI_VOICES.length}`);
        console.log(`   Rate Limit: ${aiConfig.rateLimit.gemini.maxRequests} req/min`);
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        const voiceName = options.voice.voiceId || aiConfig.tts.defaultVoice;
        const geminiConfig = aiConfig.providers?.gemini;
        if (!geminiConfig || !geminiConfig.ttsModel) {
            throw new Error('Gemini TTS configuration is missing: aiConfig.providers.gemini.ttsModel must be set to use Gemini TTS.');
        }
        const modelName = geminiConfig.ttsModel;

        console.log(`🎤 Gerando áudio com Gemini TTS`);
        console.log(`   Voz: ${voiceName}`);
        console.log(`   Texto: ${options.text.substring(0, 50)}...`);

        return this.rateLimiter.execute(async () => {
            const response = await this.ai.models.generateContent({
                model: modelName,
                contents: [{ parts: [{ text: options.text }] }],
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
                console.error('Resposta sem áudio:', JSON.stringify(response, null, 2));
                throw new Error('Nenhum dado de áudio na resposta');
            }

            const wavBuffer = Buffer.from(audioData, 'base64');
            console.log(`✅ Áudio WAV gerado: ${wavBuffer.length} bytes`);

            console.log(`🔄 Convertendo para MP3...`);
            const mp3Buffer = await convertWavToMp3(wavBuffer);
            console.log(`✅ Áudio MP3 gerado: ${mp3Buffer.length} bytes`);

            return {
                buffer: mp3Buffer,
                format: 'mp3',
                sampleRate: 24000
            };
        });
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
        return { valid: true };
    }
}
