import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../ai.config';
import {
    ImageAIProvider,
    ImageGenerationOptions,
    ImageGenerationResult,
    EmotionImageOptions,
    EmotionImageResult
} from '../interfaces/image-provider.interface';

export class GeminiImageProvider implements ImageAIProvider {
    readonly name = 'gemini';
    readonly supportedFormats = ['png', 'jpeg', 'webp'];
    readonly maxResolution = { width: 1024, height: 1024 };
    
    private ai: GoogleGenAI;
    private model: string;
    private textModel: string;

    constructor() {
        this.ai = new GoogleGenAI({});
        this.model = aiConfig.providers.gemini?.imageModel || 'imagen-3.0-generate-001';
        this.textModel = aiConfig.providers.gemini?.textModel || 'gemini-2.0-flash';
    }

    async initialize(): Promise<void> {
        console.log(`✅ Gemini Image Provider inicializado`);
        console.log(`   Modelo: ${this.model}`);
    }

    private extractText(response: any): string {
        const parts = response?.candidates?.[0]?.content?.parts || [];
        return parts
            .map((part: any) => part.text || '')
            .join('')
            .trim();
    }

    private safeJsonParse<T>(text: string): T | null {
        if (!text) return null;

        const cleaned = text.startsWith('```')
            ? text.replace(/```json|```/gi, '').trim()
            : text.trim();

        try {
            return JSON.parse(cleaned) as T;
        } catch {
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                try {
                    return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)) as T;
                } catch {
                    return null;
                }
            }
            return null;
        }
    }

    async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: options.prompt }]
                }
            ],
            config: {
                temperature: 0.65,
                responseMimeType: 'image/png',
                responseModalities: ['IMAGE']
            }
        });

        const images = response?.candidates?.[0]?.content?.parts
            ?.filter((part: any) => part.inlineData?.data)
            .map((part: any) => ({
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'image/png',
                width: options.width,
                height: options.height
            })) || [];

        if (images.length === 0) {
            throw new Error('Nenhuma imagem foi gerada.');
        }

        return {
            images,
            prompt: options.prompt
        };
    }

    async generateEmotionImage(options: EmotionImageOptions): Promise<EmotionImageResult> {
        // Primeiro, analisar o sentimento do texto
        const analysisPrompt = `Identifique o sentimento dominante da fala e descreva elementos visuais e paleta de cores.
Retorne JSON no formato {"sentiment":"...","visualElements":["..."],"colorPalette":"...","shortCaption":"..."}.
Fala:
"""${options.text}"""`;

        const analysisResponse = await this.ai.models.generateContent({
            model: this.textModel,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: analysisPrompt }]
                }
            ],
            config: {
                temperature: 0.2,
                responseMimeType: 'application/json'
            }
        });

        interface EmotionAnalysis {
            sentiment?: string;
            visualElements?: string[];
            colorPalette?: string;
            shortCaption?: string;
        }

        const analysisText = this.extractText(analysisResponse);
        const analysis = this.safeJsonParse<EmotionAnalysis>(analysisText) || {};

        // Construir prompt para imagem
        const imagePrompt = [
            'Crie uma ilustração conceitual em estilo pintura digital cinematográfica.',
            `Sentimento dominante: ${analysis.sentiment || 'introspectivo'}.`,
            analysis.visualElements?.length
                ? 'Elementos visuais recomendados: ' + analysis.visualElements.join(', ') + '.'
                : '',
            analysis.colorPalette ? `Paleta sugerida: ${analysis.colorPalette}.` : '',
            options.styleHint || 'Use composição com foco em contraste de luz e sombra.',
            options.characterSummary ? `Detalhes do personagem:\n${options.characterSummary}` : '',
            'Formato 1:1, alta definição, pinceladas suaves.'
        ].filter(Boolean).join('\n');

        // Gerar imagem
        const imageResponse = await this.ai.models.generateContent({
            model: this.model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: imagePrompt }]
                }
            ],
            config: {
                temperature: 0.65,
                responseMimeType: 'image/png',
                responseModalities: ['IMAGE']
            }
        });

        const imagePart = imageResponse?.candidates?.[0]?.content?.parts?.find(
            (part: any) => part.inlineData?.data
        );

        if (!imagePart?.inlineData?.data) {
            throw new Error('Não foi possível gerar a imagem do sentimento.');
        }

        return {
            imageBase64: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || 'image/png',
            prompt: imagePrompt,
            caption: analysis.shortCaption || 'Visualização do sentimento da fala',
            sentiment: analysis.sentiment || 'desconhecido'
        };
    }
}
