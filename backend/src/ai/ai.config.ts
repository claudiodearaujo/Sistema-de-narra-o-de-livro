import dotenv from 'dotenv';

dotenv.config();

export type TextProviderType = 'gemini' | 'openai' | 'anthropic';
export type ImageProviderType = 'gemini' | 'openai' | 'stability';
export type TTSProviderType = 'gemini' | 'elevenlabs' | 'azure';

export interface AIConfig {
    defaultTextProvider: TextProviderType;
    defaultImageProvider: ImageProviderType;
    defaultTTSProvider: TTSProviderType;
    providers: {
        gemini?: {
            apiKey: string;
            textModel: string;
            imageModel: string;
            ttsModel: string;
        };
        openai?: {
            apiKey: string;
            textModel: string;
            imageModel: string;
            ttsModel: string;
        };
        anthropic?: {
            apiKey: string;
            textModel: string;
        };
        stability?: {
            apiKey: string;
            imageModel: string;
        };
        elevenlabs?: {
            apiKey: string;
            defaultVoice: string;
        };
        azure?: {
            apiKey: string;
            region: string;
        };
    };
    defaults: {
        temperature: number;
        maxTokens: number;
        language: string;
    };
    tts: {
        defaultOutputFormat: string;
        maxRetries: number;
        cacheVoicesTTL: number;
        defaultVoice: string;
    };
}

export const aiConfig: AIConfig = {
    defaultTextProvider: (process.env.AI_TEXT_PROVIDER as TextProviderType) || 'gemini',
    defaultImageProvider: (process.env.AI_IMAGE_PROVIDER as ImageProviderType) || 'gemini',
    defaultTTSProvider: (process.env.AI_TTS_PROVIDER as TTSProviderType) || 'gemini',
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
