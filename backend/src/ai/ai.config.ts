import dotenv from 'dotenv';

dotenv.config();

export type TextProviderType = 'gemini' | 'openai' | 'anthropic';
export type ImageProviderType = 'gemini' | 'openai' | 'stability';
export type TTSProviderType = 'gemini' | 'elevenlabs' | 'azure';

type AIEndpoint = 'text' | 'image' | 'tts';

interface ProviderModelMatrix {
    text?: readonly string[];
    image?: readonly string[];
    tts?: readonly string[];
}

const MODEL_MATRIX: Record<string, ProviderModelMatrix> = {
    gemini: {
        text: ['gemini-2.5-flash', 'gemini-2.0-flash'],
        image: ['imagen-3.0-generate-001', 'gemini-2.5-flash-image'],
        tts: ['gemini-2.5-flash-preview-tts']
    },
    openai: {
        text: ['gpt-4o', 'gpt-4o-mini'],
        image: ['gpt-image-1', 'dall-e-3'],
        tts: ['gpt-4o-mini-tts', 'tts-1-hd', 'tts-1']
    },
    anthropic: {
        text: ['claude-3-5-sonnet-20241022']
    },
    stability: {
        image: ['stable-diffusion-xl-1024-v1-0']
    },
    elevenlabs: {
        tts: ['eleven_multilingual_v2']
    }
};

const getDefaultModel = (provider: keyof typeof MODEL_MATRIX, endpoint: AIEndpoint): string => {
    const models = MODEL_MATRIX[provider][endpoint];
    if (!models?.length) {
        throw new Error(`No homologated model configured for provider '${provider}' and endpoint '${endpoint}'.`);
    }

    return models[0];
};

const isModelCompatible = (provider: string, endpoint: AIEndpoint, model: string): boolean => {
    const allowed = MODEL_MATRIX[provider]?.[endpoint];
    if (!allowed?.length) return false;

    return allowed.some((candidate) => candidate === model);
};

export const validateAIModelCompatibility = (): void => {
    const checks: Array<{ provider: string; endpoint: AIEndpoint; model?: string }> = [
        { provider: 'gemini', endpoint: 'text', model: aiConfig.providers.gemini?.textModel },
        { provider: 'gemini', endpoint: 'image', model: aiConfig.providers.gemini?.imageModel },
        { provider: 'gemini', endpoint: 'tts', model: aiConfig.providers.gemini?.ttsModel },
        { provider: 'openai', endpoint: 'text', model: aiConfig.providers.openai?.textModel },
        { provider: 'openai', endpoint: 'image', model: aiConfig.providers.openai?.imageModel },
        { provider: 'openai', endpoint: 'tts', model: aiConfig.providers.openai?.ttsModel },
        { provider: 'anthropic', endpoint: 'text', model: aiConfig.providers.anthropic?.textModel },
        { provider: 'stability', endpoint: 'image', model: aiConfig.providers.stability?.imageModel },
        { provider: 'elevenlabs', endpoint: 'tts', model: aiConfig.providers.elevenlabs?.defaultModel }
    ];

    const incompatibilities = checks
        .filter((check) => check.model)
        .filter((check) => !isModelCompatible(check.provider, check.endpoint, check.model as string));

    if (incompatibilities.length) {
        const detail = incompatibilities
            .map((item) => {
                const allowed = MODEL_MATRIX[item.provider]?.[item.endpoint] ?? [];
                return `${item.provider}.${item.endpoint}='${item.model}' (allowed: ${allowed.join(', ') || 'none'})`;
            })
            .join('; ');

        throw new Error(`AI model compatibility validation failed: ${detail}`);
    }
};

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
            defaultModel: string;
            voiceSettings: {
                stability: number;
                similarityBoost: number;
                style: number;
                useSpeakerBoost: boolean;
            };
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
    rateLimit: {
        /** Requisições máximas por minuto para cada provider */
        gemini: { maxRequests: number; windowMs: number; retryDelayMs: number; maxRetries: number };
        openai: { maxRequests: number; windowMs: number; retryDelayMs: number; maxRetries: number };
        anthropic: { maxRequests: number; windowMs: number; retryDelayMs: number; maxRetries: number };
        elevenlabs: { maxRequests: number; windowMs: number; retryDelayMs: number; maxRetries: number };
    };
}

export const aiConfig: AIConfig = {
    defaultTextProvider: (process.env.AI_TEXT_PROVIDER as TextProviderType) || 'gemini',
    defaultImageProvider: (process.env.AI_IMAGE_PROVIDER as ImageProviderType) || 'gemini',
    defaultTTSProvider: (process.env.AI_TTS_PROVIDER as TTSProviderType) || 'gemini',
    providers: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY || '',
            textModel: process.env.GEMINI_TEXT_MODEL || getDefaultModel('gemini', 'text'),
            imageModel: process.env.GEMINI_IMAGE_MODEL || getDefaultModel('gemini', 'image'),
            ttsModel: process.env.GEMINI_TTS_MODEL || getDefaultModel('gemini', 'tts')
        },
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            textModel: process.env.OPENAI_TEXT_MODEL || getDefaultModel('openai', 'text'),
            imageModel: process.env.OPENAI_IMAGE_MODEL || getDefaultModel('openai', 'image'),
            ttsModel: process.env.OPENAI_TTS_MODEL || getDefaultModel('openai', 'tts')
        },
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            textModel: process.env.ANTHROPIC_TEXT_MODEL || getDefaultModel('anthropic', 'text')
        },
        stability: {
            apiKey: process.env.STABILITY_API_KEY || '',
            imageModel: process.env.STABILITY_IMAGE_MODEL || getDefaultModel('stability', 'image')
        },
        elevenlabs: {
            apiKey: process.env.ELEVENLABS_API_KEY || '',
            defaultVoice: process.env.ELEVENLABS_DEFAULT_VOICE || 'Rachel',
            defaultModel: process.env.ELEVENLABS_MODEL || getDefaultModel('elevenlabs', 'tts'),
            voiceSettings: {
                stability: parseFloat(process.env.ELEVENLABS_VOICE_STABILITY || '0.5'),
                similarityBoost: parseFloat(process.env.ELEVENLABS_VOICE_SIMILARITY || '0.75'),
                style: parseFloat(process.env.ELEVENLABS_VOICE_STYLE || '0.0'),
                useSpeakerBoost: process.env.ELEVENLABS_SPEAKER_BOOST !== 'false',
            },
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
    },
    rateLimit: {
        gemini: {
            maxRequests: parseInt(process.env.GEMINI_RATE_LIMIT_RPM || '15', 10),
            windowMs: 60000, // 1 minuto
            retryDelayMs: parseInt(process.env.GEMINI_RATE_LIMIT_RETRY_DELAY || '5000', 10),
            maxRetries: parseInt(process.env.GEMINI_RATE_LIMIT_MAX_RETRIES || '5', 10)
        },
        openai: {
            maxRequests: parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60', 10),
            windowMs: 60000,
            retryDelayMs: parseInt(process.env.OPENAI_RATE_LIMIT_RETRY_DELAY || '1000', 10),
            maxRetries: parseInt(process.env.OPENAI_RATE_LIMIT_MAX_RETRIES || '3', 10)
        },
        anthropic: {
            maxRequests: parseInt(process.env.ANTHROPIC_RATE_LIMIT_RPM || '60', 10),
            windowMs: 60000,
            retryDelayMs: parseInt(process.env.ANTHROPIC_RATE_LIMIT_RETRY_DELAY || '1000', 10),
            maxRetries: parseInt(process.env.ANTHROPIC_RATE_LIMIT_MAX_RETRIES || '3', 10)
        },
        elevenlabs: {
            maxRequests: parseInt(process.env.ELEVENLABS_RATE_LIMIT_RPM || '10', 10),
            windowMs: 60000,
            retryDelayMs: parseInt(process.env.ELEVENLABS_RATE_LIMIT_RETRY_DELAY || '2000', 10),
            maxRetries: parseInt(process.env.ELEVENLABS_RATE_LIMIT_MAX_RETRIES || '3', 10)
        }
    }
};

export function getGeminiApiKeyOrThrow(): string {
    const apiKey = aiConfig.providers.gemini?.apiKey?.trim();

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada. Defina a variável de ambiente para inicializar os providers Gemini.');
    }

    return apiKey;
}
