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
        // Modelo para geração de imagens com Gemini 2.5
        this.model = ai_config_1.aiConfig.providers.gemini?.imageModel || 'gemini-2.0-flash-exp';
        this.textModel = ai_config_1.aiConfig.providers.gemini?.textModel || 'gemini-2.0-flash';
    }
    async initialize() {
        console.log(`✅ Gemini Image Provider inicializado`);
        console.log(`   Modelo: ${this.model}`);
    }
    async runImageGeneration(prompt) {
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
        const images = [];
        const seenPayloads = new Set();
        let textContent = '';
        for await (const chunk of stream) {
            const parts = chunk?.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                if (part.inlineData?.data) {
                    const inlineData = part.inlineData;
                    if (!seenPayloads.has(inlineData.data)) {
                        images.push({
                            base64: inlineData.data,
                            mimeType: inlineData.mimeType || 'image/png'
                        });
                        seenPayloads.add(inlineData.data);
                    }
                }
                else if (part.text) {
                    textContent += part.text;
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
    async generateEmotionImage(options) {
        // Primeiro, analisar o sentimento do texto
        const analysisPrompt = `Identifique o sentimento dominante da fala e descreva elementos visuais e paleta de cores.
Retorne JSON no formato {"sentiment":"...","visualElements":["..."],"colorPalette":"...","shortCaption":"..."}.
Fala:
"""${options.text}"""`;
        console.log('Analisando sentimento com prompt:', analysisPrompt);
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
        console.log('Resposta da análise de sentimento:', analysisResponse);
        const analysisText = this.extractText(analysisResponse);
        const analysis = this.safeJsonParse(analysisText) || {};
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
exports.GeminiImageProvider = GeminiImageProvider;
