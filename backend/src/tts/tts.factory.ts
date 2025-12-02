import { TTSProvider } from './interfaces/tts-provider.interface';
import { GeminiTTSProvider } from './providers/gemini-tts.provider';
import { ttsConfig } from './tts.config';

export class TTSFactory {
    static create(providerName: string): TTSProvider {
        switch (providerName) {
            case 'gemini':
                return new GeminiTTSProvider();
            // Future providers
            // case 'elevenlabs':
            //     return new ElevenLabsTTSProvider();
            default:
                throw new Error(`TTS Provider '${providerName}' not supported`);
        }
    }

    static getDefault(): TTSProvider {
        return TTSFactory.create(ttsConfig.defaultProvider);
    }
}
