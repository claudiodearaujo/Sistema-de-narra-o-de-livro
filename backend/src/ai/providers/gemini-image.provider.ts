import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../ai.config';
import {
    ImageAIProvider,
    ImageGenerationOptions,
    ImageGenerationResult,
    EmotionImageOptions,
    EmotionImageResult
} from '../interfaces/image-provider.interface';
import { RateLimiter, rateLimiterManager } from '../../utils/rate-limiter';

export class GeminiImageProvider implements ImageAIProvider {
    readonly name = 'gemini';
    readonly supportedFormats = ['png', 'jpeg', 'webp'];
    readonly maxResolution = { width: 1024, height: 1024 };
    
    private ai: GoogleGenAI;
    private model: string;
    private textModel: string;
    private rateLimiter: RateLimiter;

    constructor() {
        this.ai = new GoogleGenAI({

            apiKey: aiConfig.providers.gemini?.apiKey || ''
        });
        // Modelo para geração de imagens com Gemini 2.5
        this.model = aiConfig.providers.gemini?.imageModel || 'gemini-2.0-flash-exp';
        this.textModel = aiConfig.providers.gemini?.textModel || 'gemini-2.0-flash';
        this.rateLimiter = rateLimiterManager.get('gemini-image', aiConfig.rateLimit.gemini);
    }

    async initialize(): Promise<void> {
        console.log(`✅ Gemini Image Provider inicializado`);
        console.log(`   Modelo: ${this.model}`);
        console.log(`   Rate Limit: ${aiConfig.rateLimit.gemini.maxRequests} req/min`);
    }

    private async runImageGeneration(
        prompt: string
    ): Promise<Array<{ base64: string; mimeType: string; text?: string }>> {
        return this.rateLimiter.execute(async () => {
            const stream = await this.ai.models.generateContentStream({
                model: this.model,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                config: {
                    responseModalities: ['IMAGE']
                }
            });
console.log('Iniciando geração de imagem com prompt:', prompt);
console.log('stream:', stream);
            const images: Array<{ base64: string; mimeType: string; text?: string }> = [];
            const seenPayloads = new Set<string>();
            let textContent = '';

            for await (const chunk of stream) {
                const parts = chunk?.candidates?.[0]?.content?.parts || [];

                for (const part of parts) {
                    if ((part as any).inlineData?.data) {
                        const inlineData = (part as any).inlineData;
                        if (!seenPayloads.has(inlineData.data)) {
                            images.push({
                                base64: inlineData.data,
                                mimeType: inlineData.mimeType || 'image/png'
                            });
                            seenPayloads.add(inlineData.data);
                        }
                    } else if ((part as any).text) {
                        textContent += (part as any).text;
                    }
                }
            }

            if (!images.length) {
                throw new Error(textContent.trim() || 'Nenhuma imagem foi gerada.');
            }

            if (textContent.trim()) {
                images[0].text = textContent.trim();
            }

            return images;
        });
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
        const promptParts = [
            options.prompt,
            options.style ? `Estilo sugerido: ${options.style}.` : '',
            options.quality === 'hd' ? 'Qualidade cinematográfica, ultra detalhado.' : '',
            options.width && options.height ? `Proporção aproximada: ${options.width}x${options.height}.` : ''
        ].filter(Boolean);

        const finalPrompt = promptParts.join('\n');

        const images = await this.runImageGeneration(finalPrompt);

        return {
            images: images.map(image => ({
                base64: image.base64,
                mimeType: image.mimeType,
                width: options.width,
                height: options.height,
                revisedPrompt: image.text
            })),
            prompt: finalPrompt
        };
    }

    async generateEmotionImage(options: EmotionImageOptions): Promise<EmotionImageResult> {
        // Primeiro, analisar o sentimento do texto
        const analysisPrompt = `Identifique o sentimento dominante da fala e descreva elementos visuais e paleta de cores.
Retorne JSON no formato {"sentiment":"...","visualElements":["..."],"colorPalette":"...","shortCaption":"..."}.
Fala:
"""${options.text}"""`;
console.log('Analisando sentimento com prompt:', analysisPrompt);
        const analysisResponse = await this.rateLimiter.execute(() => 
            this.ai.models.generateContent({
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
            })
        );
console.log('Resposta da análise de sentimento:', analysisResponse);
        interface EmotionAnalysis {
            sentiment?: string;
            visualElements?: string[];
            colorPalette?: string;
            shortCaption?: string;
        }

        const analysisText = this.extractText(analysisResponse);
        const analysis = this.safeJsonParse<EmotionAnalysis>(analysisText) || {};
console.log('Análise de sentimento extraída:', analysis);   
console.log('Análise de sentimento extraída:', analysisText);
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
 console.log('Prompt para geração de imagem emocional:', imagePrompt);
        // Gerar imagem
        const [image] = await this.runImageGeneration(imagePrompt);

        return {
            imageBase64: image.base64,
            mimeType: image.mimeType,
            prompt: imagePrompt,
            caption: analysis.shortCaption || 'Visualização do sentimento da fala',
            sentiment: analysis.sentiment || 'desconhecido'
        };
    }
}
