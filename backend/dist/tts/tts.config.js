"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ttsConfig = {
    defaultProvider: process.env.TTS_DEFAULT_PROVIDER || 'gemini',
    providers: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY || '',
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp' // Updated to a valid model for TTS if available, or standard
        }
    },
    defaultOutputFormat: 'mp3',
    maxRetries: 3,
    cacheVoicesTTL: 24 * 60 * 60 * 1000 // 24 hours
};
