import { TextAIProvider } from './interfaces/text-provider.interface';
import { ImageAIProvider } from './interfaces/image-provider.interface';
import { TTSProvider } from './interfaces/tts-provider.interface';
import { GeminiTextProvider } from './providers/gemini-text.provider';
import { GeminiImageProvider } from './providers/gemini-image.provider';
import { GeminiTTSProvider } from './providers/gemini-tts.provider';
import { ElevenLabsTTSProvider } from './providers/elevenlabs-tts.provider';
import { aiConfig, TextProviderType, ImageProviderType, TTSProviderType } from './ai.config';

export class AIFactory {
    private static readonly implementedTextProviders = ['gemini'];
    private static readonly implementedImageProviders = ['gemini'];
    private static readonly implementedTTSProviders = ['gemini', 'elevenlabs'];

    private static notImplementedProviderError(kind: 'Text' | 'Image' | 'TTS', providerName: string, envVar: string): Error {
        return new Error(
            `${kind} Provider '${providerName}' não está implementado. ` +
            `Implemente o provider na AIFactory ou altere ${envVar} para um provider suportado.`
        );
    }

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
                throw this.notImplementedProviderError('Text', providerName, 'AI_TEXT_PROVIDER');
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
                throw this.notImplementedProviderError('Image', providerName, 'AI_IMAGE_PROVIDER');
        }
    }

    /**
     * Cria um provedor de TTS (Text-to-Speech)
     */
    static createTTSProvider(providerName: TTSProviderType): TTSProvider {
        switch (providerName) {
            case 'gemini':
                return new GeminiTTSProvider();

            case 'elevenlabs':
                return new ElevenLabsTTSProvider();
            
            default:
                throw this.notImplementedProviderError('TTS', providerName, 'AI_TTS_PROVIDER');
        }
    }

    /**
     * Valida se os providers padrão do ambiente estão implementados
     */
    static validateDefaultProviders(): void {
        if (!this.implementedTextProviders.includes(aiConfig.defaultTextProvider)) {
            throw this.notImplementedProviderError('Text', aiConfig.defaultTextProvider, 'AI_TEXT_PROVIDER');
        }
        if (!this.implementedImageProviders.includes(aiConfig.defaultImageProvider)) {
            throw this.notImplementedProviderError('Image', aiConfig.defaultImageProvider, 'AI_IMAGE_PROVIDER');
        }
        if (!this.implementedTTSProviders.includes(aiConfig.defaultTTSProvider)) {
            throw this.notImplementedProviderError('TTS', aiConfig.defaultTTSProvider, 'AI_TTS_PROVIDER');
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
