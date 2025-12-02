import { TTSFactory } from './tts.factory';
import { TTSProvider, AudioResult, GenerateAudioOptions, Voice } from './interfaces/tts-provider.interface';

export class TTSService {
    private static instance: TTSService;
    private provider: TTSProvider;

    private constructor() {
        this.provider = TTSFactory.getDefault();
        this.provider.initialize().catch(err => {
            console.error('Failed to initialize default TTS provider:', err);
        });
    }

    public static getInstance(): TTSService {
        if (!TTSService.instance) {
            TTSService.instance = new TTSService();
        }
        return TTSService.instance;
    }

    async getAvailableVoices(): Promise<Voice[]> {
        return this.provider.getAvailableVoices();
    }

    async previewVoice(voiceId: string, text?: string): Promise<AudioResult> {
        return this.provider.previewVoice(voiceId, text);
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        return this.provider.generateAudio(options);
    }

    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        return this.provider.validateSSML(ssml);
    }
}

export const ttsService = TTSService.getInstance();
