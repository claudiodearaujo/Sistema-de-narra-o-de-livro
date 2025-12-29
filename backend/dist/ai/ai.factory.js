"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIFactory = void 0;
const gemini_text_provider_1 = require("./providers/gemini-text.provider");
const gemini_image_provider_1 = require("./providers/gemini-image.provider");
const gemini_tts_provider_1 = require("./providers/gemini-tts.provider");
const ai_config_1 = require("./ai.config");
class AIFactory {
    /**
     * Cria um provedor de IA de texto
     */
    static createTextProvider(providerName) {
        switch (providerName) {
            case 'gemini':
                return new gemini_text_provider_1.GeminiTextProvider();
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
    static createImageProvider(providerName) {
        switch (providerName) {
            case 'gemini':
                return new gemini_image_provider_1.GeminiImageProvider();
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
    static createTTSProvider(providerName) {
        switch (providerName) {
            case 'gemini':
                return new gemini_tts_provider_1.GeminiTTSProvider();
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
    static getDefaultTextProvider() {
        return AIFactory.createTextProvider(ai_config_1.aiConfig.defaultTextProvider);
    }
    /**
     * Retorna o provedor de imagem padrão
     */
    static getDefaultImageProvider() {
        return AIFactory.createImageProvider(ai_config_1.aiConfig.defaultImageProvider);
    }
    /**
     * Retorna o provedor de TTS padrão
     */
    static getDefaultTTSProvider() {
        return AIFactory.createTTSProvider(ai_config_1.aiConfig.defaultTTSProvider);
    }
}
exports.AIFactory = AIFactory;
