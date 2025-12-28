"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ttsConfig = {
    defaultProvider: 'gemini',
    providers: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY || '',
            model: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts'
        }
    },
    defaultOutputFormat: 'wav',
    maxRetries: 3,
    cacheVoicesTTL: 24 * 60 * 60 * 1000, // 24 hours
    defaultVoice: 'Schedar' // Voz padrão equilibrada para narração
};
