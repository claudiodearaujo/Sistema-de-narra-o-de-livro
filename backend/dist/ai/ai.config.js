"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.aiConfig = {
    defaultTextProvider: process.env.AI_TEXT_PROVIDER || 'gemini',
    defaultImageProvider: process.env.AI_IMAGE_PROVIDER || 'gemini',
    defaultTTSProvider: process.env.AI_TTS_PROVIDER || 'gemini',
    providers: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY || '',
            textModel: process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash',
            imageModel: process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001',
            ttsModel: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts'
        },
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            textModel: process.env.OPENAI_TEXT_MODEL || 'gpt-4o',
            imageModel: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
            ttsModel: process.env.OPENAI_TTS_MODEL || 'tts-1-hd'
        },
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            textModel: process.env.ANTHROPIC_TEXT_MODEL || 'claude-3-5-sonnet-20241022'
        },
        stability: {
            apiKey: process.env.STABILITY_API_KEY || '',
            imageModel: process.env.STABILITY_IMAGE_MODEL || 'stable-diffusion-xl-1024-v1-0'
        },
        elevenlabs: {
            apiKey: process.env.ELEVENLABS_API_KEY || '',
            defaultVoice: process.env.ELEVENLABS_DEFAULT_VOICE || 'Rachel'
        },
        azure: {
            apiKey: process.env.AZURE_SPEECH_KEY || '',
            region: process.env.AZURE_SPEECH_REGION || 'eastus'
        }
    },
    defaults: {
        temperature: 0.25,
        maxTokens: 4096,
        language: 'pt-BR'
    },
    tts: {
        defaultOutputFormat: 'mp3',
        maxRetries: 3,
        cacheVoicesTTL: 24 * 60 * 60 * 1000, // 24 hours
        defaultVoice: 'Schedar'
    }
};
