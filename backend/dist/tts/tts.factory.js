"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTSFactory = void 0;
const gemini_tts_provider_1 = require("./providers/gemini-tts.provider");
const tts_config_1 = require("./tts.config");
class TTSFactory {
    static create(providerName) {
        switch (providerName) {
            case 'gemini':
                return new gemini_tts_provider_1.GeminiTTSProvider();
            // Future providers
            // case 'elevenlabs':
            //     return new ElevenLabsTTSProvider();
            default:
                throw new Error(`TTS Provider '${providerName}' not supported`);
        }
    }
    static getDefault() {
        return TTSFactory.create(tts_config_1.ttsConfig.defaultProvider);
    }
}
exports.TTSFactory = TTSFactory;
