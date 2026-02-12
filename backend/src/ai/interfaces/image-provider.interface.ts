/**
 * Interface para provedores de IA de geração de imagens
 */

export interface ImageGenerationOptions {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    style?: string;
    quality?: 'standard' | 'hd';
    numberOfImages?: number;
}

export interface GeneratedImage {
    base64: string;
    mimeType: string;
    width?: number;
    height?: number;
    revisedPrompt?: string;
}

export interface ImageGenerationResult {
    images: GeneratedImage[];
    prompt: string;
}

export interface EmotionImageOptions {
    text: string;
    characterSummary?: string;
    styleHint?: string;
}

export interface EmotionImageResult {
    imageBase64: string;
    mimeType: string;
    prompt: string;
    caption: string;
    sentiment: string;
    imageUrl?: string;
}

export interface ImageAIProvider {
    readonly name: string;
    readonly supportedFormats: string[];
    readonly maxResolution: { width: number; height: number };

    initialize(): Promise<void>;
    
    generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
    
    generateEmotionImage(options: EmotionImageOptions): Promise<EmotionImageResult>;
}
