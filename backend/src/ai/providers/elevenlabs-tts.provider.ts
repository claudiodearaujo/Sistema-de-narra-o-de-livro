import { ElevenLabsClient, ElevenLabs } from '@elevenlabs/elevenlabs-js';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../interfaces/tts-provider.interface';
import { aiConfig } from '../ai.config';
import { RateLimiter, rateLimiterManager } from '../../utils/rate-limiter';

type ElevenLabsOutputFormat = ElevenLabs.TextToSpeechConvertRequestOutputFormat;

/**
 * Provider de TTS usando a API do ElevenLabs
 *
 * Funcionalidades:
 * - Listar vozes disponíveis (biblioteca + personalizadas)
 * - Gerar áudio a partir de texto
 * - Preview de vozes
 * - Suporte a múltiplos modelos (multilingual_v2, flash_v2_5, turbo_v2_5)
 * - Suporte a múltiplos formatos de saída
 */

// Mapeamento de formatos internos para formatos da API ElevenLabs
const OUTPUT_FORMAT_MAP: Record<string, ElevenLabsOutputFormat> = {
    'mp3': 'mp3_44100_128',
    'wav': 'pcm_44100',
    'ogg': 'mp3_44100_128', // fallback para mp3
    'aac': 'mp3_44100_128', // fallback para mp3
};

export class ElevenLabsTTSProvider implements TTSProvider {
    readonly name = 'elevenlabs';
    readonly supportedFormats = ['mp3', 'wav'];

    private client: ElevenLabsClient;
    private rateLimiter: RateLimiter;
    private cachedVoices: Voice[] | null = null;
    private cacheTimestamp: number = 0;

    constructor() {
        const apiKey = aiConfig.providers.elevenlabs?.apiKey || process.env.ELEVENLABS_API_KEY || '';

        this.client = new ElevenLabsClient({ apiKey });

        this.rateLimiter = rateLimiterManager.get('elevenlabs-tts', {
            maxRequests: aiConfig.rateLimit.elevenlabs?.maxRequests ?? 10,
            windowMs: aiConfig.rateLimit.elevenlabs?.windowMs ?? 60000,
            retryDelayMs: aiConfig.rateLimit.elevenlabs?.retryDelayMs ?? 2000,
            maxRetries: aiConfig.rateLimit.elevenlabs?.maxRetries ?? 3,
        });
    }

    async initialize(): Promise<void> {
        const hasKey = !!(aiConfig.providers.elevenlabs?.apiKey || process.env.ELEVENLABS_API_KEY);
        console.log('ElevenLabs TTS Provider inicializado');
        console.log(`   API Key configurada: ${hasKey ? 'Sim' : 'NAO - configure ELEVENLABS_API_KEY'}`);
        console.log(`   Modelo padrão: ${aiConfig.providers.elevenlabs?.defaultModel || 'eleven_multilingual_v2'}`);
    }

    /**
     * Gera áudio a partir de texto usando ElevenLabs TTS
     */
    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        const voiceId = options.voice.voiceId || aiConfig.providers.elevenlabs?.defaultVoice || 'Rachel';
        const modelId = aiConfig.providers.elevenlabs?.defaultModel || 'eleven_multilingual_v2';
        const outputFormat = OUTPUT_FORMAT_MAP[options.outputFormat || 'mp3'] || 'mp3_44100_128';

        console.log(`Gerando áudio com ElevenLabs TTS`);
        console.log(`   Voz: ${voiceId}`);
        console.log(`   Modelo: ${modelId}`);
        console.log(`   Texto: ${options.text.substring(0, 50)}...`);

        return this.rateLimiter.execute(async () => {
            const audioStream = await this.client.textToSpeech.convert(voiceId, {
                text: options.text,
                modelId,
                outputFormat,
                voiceSettings: {
                    stability: aiConfig.providers.elevenlabs?.voiceSettings?.stability ?? 0.5,
                    similarityBoost: aiConfig.providers.elevenlabs?.voiceSettings?.similarityBoost ?? 0.75,
                    style: aiConfig.providers.elevenlabs?.voiceSettings?.style ?? 0.0,
                    useSpeakerBoost: aiConfig.providers.elevenlabs?.voiceSettings?.useSpeakerBoost ?? true,
                },
            });

            // Converter ReadableStream para Buffer
            const buffer = await this.streamToBuffer(audioStream);

            console.log(`Áudio ElevenLabs gerado: ${buffer.length} bytes`);

            return {
                buffer,
                format: options.outputFormat || 'mp3',
                sampleRate: 44100,
            };
        });
    }

    /**
     * Lista todas as vozes disponíveis na conta ElevenLabs
     */
    async getAvailableVoices(): Promise<Voice[]> {
        // Retorna cache se ainda válido
        const cacheTTL = aiConfig.tts.cacheVoicesTTL || 24 * 60 * 60 * 1000;
        if (this.cachedVoices && (Date.now() - this.cacheTimestamp) < cacheTTL) {
            return this.cachedVoices;
        }

        try {
            const response = await this.client.voices.search();
            const voices: Voice[] = [];

            if (response.voices) {
                for (const v of response.voices) {
                    voices.push({
                        id: v.voiceId || '',
                        name: v.name || 'Sem nome',
                        languageCode: 'multi', // ElevenLabs suporta multilíngue
                        gender: this.inferGender(v.labels),
                        provider: 'elevenlabs',
                        description: this.buildDescription(v),
                        previewUrl: v.previewUrl || undefined,
                    });
                }
            }

            this.cachedVoices = voices;
            this.cacheTimestamp = Date.now();

            console.log(`ElevenLabs: ${voices.length} vozes carregadas`);
            return voices;
        } catch (error: any) {
            console.error('Erro ao listar vozes ElevenLabs:', error.message);
            // Retorna cache expirado se existir
            if (this.cachedVoices) {
                return this.cachedVoices;
            }
            throw error;
        }
    }

    /**
     * Gera preview de áudio para uma voz
     */
    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> {
        const text = sampleText || `Olá! Esta é uma prévia da voz. Como você está hoje?`;
        return this.generateAudio({
            text,
            voice: { voiceId },
        });
    }

    /**
     * Valida SSML - ElevenLabs não suporta SSML diretamente,
     * mas aceita tags de pronúncia
     */
    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        // ElevenLabs usa seu próprio formato de marcação, não SSML padrão
        // Aceita texto puro ou com tags básicas
        if (!ssml || ssml.trim().length === 0) {
            return { valid: false, errors: ['Texto vazio'] };
        }
        return { valid: true };
    }

    // ========== Helpers ==========

    /**
     * Converte ReadableStream para Buffer
     */
    private async streamToBuffer(stream: any): Promise<Buffer> {
        const chunks: Uint8Array[] = [];

        if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
            for await (const chunk of stream) {
                chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
            }
        } else if (stream && typeof stream.read === 'function') {
            // Node.js Readable stream
            for await (const chunk of stream) {
                chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
            }
        } else if (Buffer.isBuffer(stream)) {
            return stream;
        } else {
            throw new Error('Formato de resposta de áudio não suportado');
        }

        return Buffer.concat(chunks);
    }

    /**
     * Infere o gênero com base nos labels da voz
     */
    private inferGender(labels: any): string {
        if (!labels) return 'NEUTRAL';
        const gender = labels.gender || labels.Gender || '';
        if (typeof gender === 'string') {
            const g = gender.toLowerCase();
            if (g.includes('male') && !g.includes('female')) return 'MALE';
            if (g.includes('female')) return 'FEMALE';
        }
        return 'NEUTRAL';
    }

    /**
     * Constrói descrição legível a partir dos dados da voz
     */
    private buildDescription(voice: any): string {
        const parts: string[] = [];

        if (voice.labels) {
            const labelEntries = Object.entries(voice.labels || {});
            for (const [key, value] of labelEntries) {
                if (value && key !== 'gender') {
                    parts.push(`${key}: ${value}`);
                }
            }
        }

        if (voice.description) {
            parts.push(voice.description);
        }

        return parts.join(' | ') || 'Voz ElevenLabs';
    }
}
