// Re-export main service
export { aiService, AIService } from './ai.service';
export type { 
    SpellCheckRequest, 
    SuggestionRequest, 
    CharacterEnrichmentRequest, 
    EmotionImageRequest,
    ImageGenerationRequest,
    AudioGenerationRequest,
    VoicePreviewRequest
} from './ai.service';

// Re-export factory
export { AIFactory } from './ai.factory';

// Re-export config
export { aiConfig } from './ai.config';
export type { AIConfig, TextProviderType, ImageProviderType, TTSProviderType } from './ai.config';

// Re-export interfaces
export type {
    TextAIProvider,
    TextGenerationOptions,
    TextGenerationResult,
    SpellCheckOptions,
    SpellCheckResult,
    SuggestionOptions,
    SuggestionResult,
    EnrichmentOptions,
    EnrichmentResult
} from './interfaces/text-provider.interface';

export type {
    ImageAIProvider,
    ImageGenerationOptions,
    ImageGenerationResult,
    GeneratedImage,
    EmotionImageOptions,
    EmotionImageResult
} from './interfaces/image-provider.interface';

export type {
    TTSProvider,
    Voice,
    VoiceConfig,
    GenerateAudioOptions,
    AudioResult
} from './interfaces/tts-provider.interface';

// Re-export providers for direct use if needed
export { GeminiTextProvider } from './providers/gemini-text.provider';
export { GeminiImageProvider } from './providers/gemini-image.provider';
export { GeminiTTSProvider } from './providers/gemini-tts.provider';
