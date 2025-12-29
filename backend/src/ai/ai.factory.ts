import { TextAIProvider } from './interfaces/text-provider.interface';
import { ImageAIProvider } from './interfaces/image-provider.interface';
import { TTSProvider } from './interfaces/tts-provider.interface';
import { GeminiTextProvider } from './providers/gemini-text.provider';
import { GeminiImageProvider } from './providers/gemini-image.provider';
import { GeminiTTSProvider } from './providers/gemini-tts.provider';
import { aiConfig, TextProviderType, ImageProviderType, TTSProviderType } from './ai.config';

export class AIFactory {
    /**
     * Cria um provedor de IA de texto
     */
    static createTextProvider(providerName: TextProviderType): TextAIProvider {
        switch (providerName) {
            case 'gemini':
                return new GeminiTextProvider();
            
            // Adicione novos provedores aqui:
            // case 'openai':
            //     return new OpenAITextProvider();
            // case 'anthropic':
            //     return new AnthropicTextProvider();
            
            default:
                throw new Error(`Text AI Provider '${providerName}' not supported`);
        }
    }

    /**
     * Cria um provedor de IA de imagem
     */
    static createImageProvider(providerName: ImageProviderType): ImageAIProvider {
        switch (providerName) {
            case 'gemini':
                return new GeminiImageProvider();
            
            // Adicione novos provedores aqui:
            // case 'openai':
            //     return new OpenAIImageProvider();
            // case 'stability':
            //     return new StabilityImageProvider();
            
            default:
                throw new Error(`Image AI Provider '${providerName}' not supported`);
        }
    }

    /**
     * Cria um provedor de TTS (Text-to-Speech)
     */
    static createTTSProvider(providerName: TTSProviderType): TTSProvider {
        switch (providerName) {
            case 'gemini':
                return new GeminiTTSProvider();
            
            // Adicione novos provedores aqui:
            // case 'elevenlabs':
            //     return new ElevenLabsTTSProvider();
            // case 'azure':
            //     return new AzureTTSProvider();
            
            default:
                throw new Error(`TTS Provider '${providerName}' not supported`);
        }
    }

    /**
     * Retorna o provedor de texto padrão
     */
    static getDefaultTextProvider(): TextAIProvider {
        return AIFactory.createTextProvider(aiConfig.defaultTextProvider);
    }

    /**
     * Retorna o provedor de imagem padrão
     */
    static getDefaultImageProvider(): ImageAIProvider {
        return AIFactory.createImageProvider(aiConfig.defaultImageProvider);
    }

    /**
     * Retorna o provedor de TTS padrão
     */
    static getDefaultTTSProvider(): TTSProvider {
        return AIFactory.createTTSProvider(aiConfig.defaultTTSProvider);
    }
}
