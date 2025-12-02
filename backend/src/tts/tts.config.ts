import dotenv from 'dotenv';

dotenv.config();

export interface TTSConfig {
    defaultProvider: string;
    providers: {
        gemini?: { apiKey: string; model?: string };
        elevenlabs?: { apiKey: string };
    };
    defaultOutputFormat: string;
    maxRetries: number;
    cacheVoicesTTL: number;
}

export const ttsConfig: TTSConfig = {
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
