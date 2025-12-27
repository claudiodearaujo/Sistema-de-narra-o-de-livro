"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiTTSProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const googleTTS = __importStar(require("google-tts-api"));
const axios_1 = __importDefault(require("axios"));
const tts_config_1 = require("../tts.config");
class GeminiTTSProvider {
    constructor() {
        this.name = 'gemini';
        this.supportedFormats = ['mp3'];
        const apiKey = tts_config_1.ttsConfig.providers.gemini?.apiKey;
        if (!apiKey) {
            throw new Error('Gemini API Key not configured');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async initialize() {
        // Initialize model or validate connection
        const modelName = tts_config_1.ttsConfig.providers.gemini?.model || 'gemini-2.0-flash-exp';
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }
    async generateAudio(options) {
        console.log(`Generating audio with Google TTS API for voice: ${options.voice.voiceId}`);
        try {
            // Remove SSML tags if present, as the simple API doesn't support it
            let textToSpeak = options.text;
            if (options.useSSML) {
                // Strip SSML tags for simple text
                textToSpeak = options.text
                    .replace(/<[^>]*>/g, '') // Remove all HTML/SSML tags
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
            }
            // Map voice to language code
            const languageCode = this.getLanguageFromVoice(options.voice.voiceId);
            // Get the TTS URL from google-tts-api
            const audioUrls = googleTTS.getAllAudioUrls(textToSpeak, {
                lang: languageCode,
                slow: false,
                host: 'https://translate.google.com',
                splitPunct: ',.?!'
            });
            // Download all audio chunks and concatenate
            const audioBuffers = [];
            for (const audioUrl of audioUrls) {
                const response = await axios_1.default.get(audioUrl.url, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                audioBuffers.push(Buffer.from(response.data));
            }
            // Concatenate all buffers
            const finalBuffer = Buffer.concat(audioBuffers);
            console.log(`Audio generated successfully. Buffer size: ${finalBuffer.length} bytes`);
            return {
                buffer: finalBuffer,
                format: 'mp3',
                duration: undefined
            };
        }
        catch (error) {
            console.error('Error generating audio with Google TTS API:', error);
            throw new Error(`Failed to generate audio: ${error.message}`);
        }
    }
    getLanguageFromVoice(voiceId) {
        // Extract language code from voice ID
        if (voiceId.startsWith('pt-BR'))
            return 'pt-BR';
        if (voiceId.startsWith('en-US'))
            return 'en-US';
        if (voiceId.startsWith('es-ES'))
            return 'es-ES';
        // Default to Portuguese Brazil
        return 'pt-BR';
    }
    async getAvailableVoices() {
        // Google Cloud TTS voices for Brazilian Portuguese
        return [
            { id: 'pt-BR-Standard-A', name: 'Feminina Padrão A', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina natural' },
            { id: 'pt-BR-Standard-B', name: 'Masculina Padrão B', languageCode: 'pt-BR', gender: 'MALE', provider: 'google-tts', description: 'Voz masculina natural' },
            { id: 'pt-BR-Standard-C', name: 'Feminina Padrão C', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina suave' },
            { id: 'pt-BR-Wavenet-A', name: 'Feminina Neural A', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina de alta qualidade' },
            { id: 'pt-BR-Wavenet-B', name: 'Masculina Neural B', languageCode: 'pt-BR', gender: 'MALE', provider: 'google-tts', description: 'Voz masculina de alta qualidade' },
            { id: 'pt-BR-Wavenet-C', name: 'Feminina Neural C', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina expressiva' },
            { id: 'pt-BR-Neural2-A', name: 'Feminina Neural2 A', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Última geração feminina' },
            { id: 'pt-BR-Neural2-B', name: 'Masculina Neural2 B', languageCode: 'pt-BR', gender: 'MALE', provider: 'google-tts', description: 'Última geração masculina' },
            { id: 'pt-BR-Neural2-C', name: 'Feminina Neural2 C', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Última geração feminina suave' }
        ];
    }
    async previewVoice(voiceId, sampleText) {
        return this.generateAudio({
            text: sampleText || `This is a preview of the voice ${voiceId}`,
            voice: { voiceId }
        });
    }
    async validateSSML(ssml) {
        // Basic validation logic (can be expanded)
        const errors = [];
        // Auto-wrap with <speak> tag if not present
        let validatedSsml = ssml.trim();
        if (!validatedSsml.startsWith('<speak>')) {
            validatedSsml = `<speak>${validatedSsml}</speak>`;
        }
        // Check if closing tag is present
        if (!validatedSsml.endsWith('</speak>')) {
            errors.push('Missing closing </speak> tag');
        }
        // Additional basic validation can be added here
        // For example: check for balanced tags, valid SSML elements, etc.
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.GeminiTTSProvider = GeminiTTSProvider;
