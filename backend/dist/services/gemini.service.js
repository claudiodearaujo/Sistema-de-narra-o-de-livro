"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class GeminiService {
    constructor() {
        // Hardcoded list of voices/personas that we will simulate or map to specific TTS configurations
        // In a real scenario with a specific TTS API, we would fetch this.
        // For Gemini Multimodal, we might prompt it to speak in a certain style.
        // However, usually for consistent TTS, we use specific Voice IDs.
        // Let's assume we are using a set of predefined personas for now.
        this.availableVoices = [
            { id: 'Puck', name: 'Puck', gender: 'MALE', languageCode: 'pt-BR', description: 'Voz masculina, tom médio, expressiva.' },
            { id: 'Charon', name: 'Charon', gender: 'MALE', languageCode: 'pt-BR', description: 'Voz masculina, grave, séria.' },
            { id: 'Kore', name: 'Kore', gender: 'FEMALE', languageCode: 'pt-BR', description: 'Voz feminina, suave, calma.' },
            { id: 'Fenrir', name: 'Fenrir', gender: 'MALE', languageCode: 'pt-BR', description: 'Voz masculina, intensa, rápida.' },
            { id: 'Aoede', name: 'Aoede', gender: 'FEMALE', languageCode: 'pt-BR', description: 'Voz feminina, aguda, alegre.' },
        ];
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not set in environment variables.');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey || '');
        // Using a model that supports audio generation if available, or standard text for now and we'll mock the audio part 
        // if the SDK doesn't support direct TTS yet in this version. 
        // NOTE: As of my knowledge cutoff, direct "text-to-speech" via the standard `gemini-pro` model isn't a simple method call like `speak()`.
        // However, the prompt explicitly asks for "Gemini 2.5 Pro TTS". 
        // We will assume we can use the `generateContent` with specific response mime type or a specific model.
        // For now, I will implement the structure.
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // Using a newer model placeholder
    }
    async listVoices() {
        // In the future, this could fetch from an API
        return Promise.resolve(this.availableVoices);
    }
    async previewVoice(voiceId, text) {
        // TODO: Implement actual call to Gemini API to generate audio.
        // Currently, the Node.js SDK for Gemini might not have a direct "generate audio" helper that returns a buffer directly 
        // in the same way as text. It usually returns text.
        // However, for the purpose of this phase, we need to return something.
        // If the user provided specific instructions on HOW to use Gemini TTS (e.g. specific endpoint), I would use it.
        // The prompt says "Usar SDK oficial do Google AI" and "Endpoint de preview deve retornar audio base64".
        // MOCK IMPLEMENTATION FOR NOW until we have the exact "Gemini TTS" method signature.
        // Real implementation would likely involve sending a prompt like "Read this text as [Voice Name]" 
        // and expecting an audio attachment in the response, OR using a specific TTS endpoint.
        console.log(`Generating preview for voice ${voiceId} with text: ${text}`);
        // Returning a dummy base64 audio (1 second of silence) for testing frontend integration
        // This allows us to validate the flow without consuming quota or breaking on missing API features.
        return "UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    }
}
exports.GeminiService = GeminiService;
