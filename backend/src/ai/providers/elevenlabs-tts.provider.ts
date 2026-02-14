import axios from 'axios';
import { aiConfig } from '../ai.config';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../interfaces/tts-provider.interface';
import { RateLimiter, rateLimiterManager } from '../../utils/rate-limiter';

export class ElevenLabsTTSProvider implements TTSProvider {
    readonly name = 'elevenlabs';
    readonly supportedFormats = ['mp3', 'wav'];

    private readonly baseUrl = 'https://api.elevenlabs.io/v1';
    private readonly rateLimiter: RateLimiter;

    constructor() {
        this.rateLimiter = rateLimiterManager.get('elevenlabs-tts', aiConfig.rateLimit.elevenlabs);
    }

    async initialize(): Promise<void> {
        if (!aiConfig.providers.elevenlabs?.apiKey) {
            throw new Error('ELEVENLABS_API_KEY é obrigatório quando AI_TTS_PROVIDER=elevenlabs');
        }
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        const apiKey = aiConfig.providers.elevenlabs?.apiKey;
        if (!apiKey) {
            throw new Error('ELEVENLABS_API_KEY não configurado para geração de áudio');
        }

        const voiceId = options.voice.voiceId || aiConfig.providers.elevenlabs?.defaultVoice;
        if (!voiceId) {
            throw new Error('voiceId é obrigatório para o provider ElevenLabs');
        }

        const format = options.outputFormat ?? 'mp3';
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`Formato '${format}' não suportado pelo provider ElevenLabs`);
        }

        const outputFormat = format === 'wav' ? 'pcm_44100' : 'mp3_44100_128';

        return this.rateLimiter.execute(async () => {
            const response = await axios.post<ArrayBuffer>(
                `${this.baseUrl}/text-to-speech/${encodeURIComponent(voiceId)}`,
                {
                    text: options.text,
                    model_id: aiConfig.providers.elevenlabs?.defaultModel,
                    voice_settings: aiConfig.providers.elevenlabs?.voiceSettings
                },
                {
                    params: { output_format: outputFormat },
                    headers: {
                        'xi-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'Accept': format === 'wav' ? 'audio/wav' : 'audio/mpeg'
                    },
                    responseType: 'arraybuffer'
                }
            );

            return {
                buffer: Buffer.from(response.data),
                format
            };
        });
    }

    async getAvailableVoices(): Promise<Voice[]> {
        const apiKey = aiConfig.providers.elevenlabs?.apiKey;
        if (!apiKey) {
            throw new Error('ELEVENLABS_API_KEY não configurado para listar vozes');
        }

        type ElevenLabsVoice = {
            voice_id: string;
            name: string;
            labels?: { gender?: string };
            description?: string;
            preview_url?: string;
        };

        const response = await this.rateLimiter.execute(async () => {
            return axios.get<{ voices?: ElevenLabsVoice[] }>(`${this.baseUrl}/voices`, {
                headers: { 'xi-api-key': apiKey }
            });
        });

        return (response.data.voices || []).map((voice) => ({
            id: voice.voice_id,
            name: voice.name,
            languageCode: 'pt-BR',
            gender: voice.labels?.gender?.toUpperCase() || 'NEUTRAL',
            provider: this.name,
            previewUrl: voice.preview_url,
            description: voice.description
        }));
    }

    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> {
        const text = sampleText || `Olá! Esta é uma prévia da voz ${voiceId}.`;

        return this.generateAudio({
            text,
            voice: { voiceId },
            outputFormat: 'mp3'
        });
    }

    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        return { valid: true };
    }
}
