import { ElevenLabsClient, ElevenLabs } from '@elevenlabs/elevenlabs-js';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../../types/tts.types';
import { aiConfig } from '../../config/ai.config';
import { RateLimiter, rateLimiterManager } from '../../services/rate-limiter';

type ElevenLabsOutputFormat = ElevenLabs.TextToSpeechConvertRequestOutputFormat;

const OUTPUT_FORMAT_MAP: Record<string, ElevenLabsOutputFormat> = {
    'mp3': 'mp3_44100_128',
    'wav': 'pcm_44100',
    'ogg': 'mp3_44100_128',
    'aac': 'mp3_44100_128',
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
        console.log('ElevenLabs TTS Provider initialized');
        console.log(`   API Key configured: ${hasKey ? 'Yes' : 'NO - configure ELEVENLABS_API_KEY'}`);
        console.log(`   Default model: ${aiConfig.providers.elevenlabs?.defaultModel || 'eleven_multilingual_v2'}`);
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        const voiceId = options.voice.voiceId || aiConfig.providers.elevenlabs?.defaultVoice || 'Rachel';
        const modelId = aiConfig.providers.elevenlabs?.defaultModel || 'eleven_multilingual_v2';
        const outputFormat = OUTPUT_FORMAT_MAP[options.outputFormat || 'mp3'] || 'mp3_44100_128';

        console.log(`Generating audio with ElevenLabs TTS`);
        console.log(`   Voice: ${voiceId}`);
        console.log(`   Model: ${modelId}`);
        console.log(`   Text: ${options.text.substring(0, 50)}...`);

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

            const buffer = await this.streamToBuffer(audioStream);

            console.log(`ElevenLabs audio generated: ${buffer.length} bytes`);

            return {
                buffer,
                format: options.outputFormat || 'mp3',
                sampleRate: 44100,
            };
        });
    }

    async getAvailableVoices(): Promise<Voice[]> {
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
                        name: v.name || 'No name',
                        languageCode: 'multi',
                        gender: this.inferGender(v.labels),
                        provider: 'elevenlabs',
                        description: this.buildDescription(v),
                        previewUrl: v.previewUrl || undefined,
                    });
                }
            }

            this.cachedVoices = voices;
            this.cacheTimestamp = Date.now();

            console.log(`ElevenLabs: ${voices.length} voices loaded`);
            return voices;
        } catch (error: any) {
            console.error('Error listing ElevenLabs voices:', error.message);
            if (this.cachedVoices) {
                return this.cachedVoices;
            }
            throw error;
        }
    }

    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> {
        const text = sampleText || `Hello! This is a voice preview. How are you today?`;
        return this.generateAudio({
            text,
            voice: { voiceId },
        });
    }

    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        if (!ssml || ssml.trim().length === 0) {
            return { valid: false, errors: ['Empty text'] };
        }
        return { valid: true };
    }

    private async streamToBuffer(stream: any): Promise<Buffer> {
        const chunks: Uint8Array[] = [];

        if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
            for await (const chunk of stream) {
                chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
            }
        } else if (stream && typeof stream.read === 'function') {
            for await (const chunk of stream) {
                chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
            }
        } else if (Buffer.isBuffer(stream)) {
            return stream;
        } else {
            throw new Error('Unsupported audio response format');
        }

        return Buffer.concat(chunks);
    }

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

        return parts.join(' | ') || 'ElevenLabs Voice';
    }
}
