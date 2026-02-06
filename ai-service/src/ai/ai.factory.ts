import { TTSProvider } from '../types/tts.types';
import { aiConfig, TTSProviderType } from '../config/ai.config';
import { ElevenLabsTTSProvider } from './providers/elevenlabs-tts.provider';
import { GeminiTTSProvider } from './providers/gemini-tts.provider';

/**
 * AI Provider Factory
 * Creates and manages AI provider instances
 */
class AIFactory {
    private ttsProviders: Map<string, TTSProvider> = new Map();
    private initialized: boolean = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('Initializing AI Factory...');

        // Initialize default TTS provider
        await this.getTTSProvider(aiConfig.defaultTTSProvider);

        this.initialized = true;
        console.log('AI Factory initialized');
    }

    /**
     * Get TTS provider by name
     */
    async getTTSProvider(providerName?: TTSProviderType): Promise<TTSProvider> {
        const name = providerName || aiConfig.defaultTTSProvider;

        if (this.ttsProviders.has(name)) {
            return this.ttsProviders.get(name)!;
        }

        let provider: TTSProvider;

        switch (name) {
            case 'elevenlabs':
                provider = new ElevenLabsTTSProvider();
                break;
            case 'gemini':
                provider = new GeminiTTSProvider();
                break;
            default:
                throw new Error(`Unknown TTS provider: ${name}`);
        }

        await provider.initialize();
        this.ttsProviders.set(name, provider);

        return provider;
    }

    /**
     * Get all available TTS providers
     */
    getAvailableTTSProviders(): string[] {
        const available: string[] = [];

        if (aiConfig.providers.elevenlabs?.apiKey) {
            available.push('elevenlabs');
        }
        if (aiConfig.providers.gemini?.apiKey) {
            available.push('gemini');
        }

        return available;
    }

    /**
     * Get provider info
     */
    getProviderInfo() {
        return {
            tts: {
                current: aiConfig.defaultTTSProvider,
                available: this.getAvailableTTSProviders(),
            },
            text: {
                current: aiConfig.defaultTextProvider,
                available: ['gemini'],
            },
            image: {
                current: aiConfig.defaultImageProvider,
                available: ['gemini'],
            },
        };
    }
}

export const aiFactory = new AIFactory();
