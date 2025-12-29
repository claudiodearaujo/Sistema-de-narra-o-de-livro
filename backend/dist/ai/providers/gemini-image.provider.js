"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiImageProvider = void 0;
const genai_1 = require("@google/genai");
const ai_config_1 = require("../ai.config");
class GeminiImageProvider {
    constructor() {
        this.name = 'gemini';
        this.supportedFormats = ['png', 'jpeg', 'webp'];
        this.maxResolution = { width: 1024, height: 1024 };
        this.ai = new genai_1.GoogleGenAI({});
        this.model = ai_config_1.aiConfig.providers.gemini?.imageModel || 'imagen-3.0-generate-001';
        this.textModel = ai_config_1.aiConfig.providers.gemini?.textModel || 'gemini-2.0-flash';
    }
    async initialize() {
        console.log(`✅ Gemini Image Provider inicializado`);
        console.log(`   Modelo: ${this.model}`);
    }
    extractText(response) {
        const parts = response?.candidates?.[0]?.content?.parts || [];
        return parts
            .map((part) => part.text || '')
            .join('')
            .trim();
    }
    safeJsonParse(text) {
        if (!text)
            return null;
        const cleaned = text.startsWith('```')
            ? text.replace(/```json|```/gi, '').trim()
            : text.trim();
        try {
            return JSON.parse(cleaned);
        }
        catch {
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                try {
                    return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
                }
                catch {
                    return null;
                }
            }
            return null;
        }
    }
    async generateImage(options) {
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
            ?.filter((part) => part.inlineData?.data)
            .map((part) => ({
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
    async generateEmotionImage(options) {
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
        const analysisText = this.extractText(analysisResponse);
        const analysis = this.safeJsonParse(analysisText) || {};
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
        const imagePart = imageResponse?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
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
exports.GeminiImageProvider = GeminiImageProvider;
