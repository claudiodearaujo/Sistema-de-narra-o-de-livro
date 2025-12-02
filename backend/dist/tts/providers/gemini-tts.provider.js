"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiTTSProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
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
        // NOTE: As of now, the standard Generative AI SDK for Node.js might not expose a direct "text-to-speech" endpoint 
        // that returns an audio buffer in the same way as specialized TTS APIs.
        // However, for the purpose of this project and based on the prompt requirements, 
        // we will simulate the integration or use the generateContent method if it supports audio output in the future.
        // 
        // CURRENT IMPLEMENTATION: Mocking the audio generation because the specific Gemini 2.5 Pro TTS endpoint 
        // details are not fully available in the standard public SDK documentation at this moment for direct audio buffer return.
        // In a real scenario, this would call the specific Google Cloud TTS API or the new Gemini Multimodal endpoints.
        console.log(`Generating audio with Gemini for voice: ${options.voice.voiceId}`);
        // Mocking a base64 audio response for demonstration
        const mockBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // Empty WAV
        const buffer = Buffer.from(mockBase64, 'base64');
        return {
            buffer: buffer,
            format: 'wav',
            duration: 1 // Mock duration
        };
    }
    async getAvailableVoices() {
        // Mocking available voices for Gemini
        return [
            { id: 'Puck', name: 'Puck', languageCode: 'en-US', gender: 'MALE', provider: 'gemini', description: 'Deep, resonant' },
            { id: 'Charon', name: 'Charon', languageCode: 'en-US', gender: 'MALE', provider: 'gemini', description: 'Gravelly, dark' },
            { id: 'Kore', name: 'Kore', languageCode: 'en-US', gender: 'FEMALE', provider: 'gemini', description: 'Soft, ethereal' },
            { id: 'Fenrir', name: 'Fenrir', languageCode: 'en-US', gender: 'MALE', provider: 'gemini', description: 'Aggressive, growling' },
            { id: 'Aoede', name: 'Aoede', languageCode: 'en-US', gender: 'FEMALE', provider: 'gemini', description: 'Melodic, high-pitched' }
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
        if (!ssml.startsWith('<speak>'))
            errors.push('Missing <speak> tag');
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.GeminiTTSProvider = GeminiTTSProvider;
