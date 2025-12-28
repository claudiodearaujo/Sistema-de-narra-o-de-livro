import dotenv from 'dotenv';

dotenv.config();

export interface TTSConfig {
    defaultProvider: 'gemini';
    providers: {
        gemini: { 
            apiKey: string; 
            model: string;
        };
    };
    defaultOutputFormat: string;
    maxRetries: number;
    cacheVoicesTTL: number;
    defaultVoice: string;
}

export const ttsConfig: TTSConfig = {
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
