"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiTextProvider = void 0;
const genai_1 = require("@google/genai");
const ai_config_1 = require("../ai.config");
class GeminiTextProvider {
    constructor() {
        this.name = 'gemini';
        this.supportedLanguages = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];
        this.ai = new genai_1.GoogleGenAI({});
        this.model = ai_config_1.aiConfig.providers.gemini?.textModel || 'gemini-2.0-flash';
    }
    async initialize() {
        console.log(`✅ Gemini Text Provider inicializado`);
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
    async generateText(options) {
        const contents = [];
        if (options.systemPrompt) {
            contents.push({
                role: 'user',
                parts: [{ text: options.systemPrompt }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'Entendido. Vou seguir essas instruções.' }]
            });
        }
        contents.push({
            role: 'user',
            parts: [{ text: options.prompt }]
        });
        console.log('model', this.model);
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents,
            config: {
                temperature: options.temperature ?? ai_config_1.aiConfig.defaults.temperature,
                maxOutputTokens: options.maxTokens ?? ai_config_1.aiConfig.defaults.maxTokens,
                responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain'
            }
        });
        const text = this.extractText(response);
        return {
            text,
            finishReason: response?.candidates?.[0]?.finishReason || 'STOP'
        };
    }
    async spellCheck(options) {
        const language = options.language || ai_config_1.aiConfig.defaults.language;
        const prompt = `Atue como um revisor ortográfico e gramatical da língua ${language}.
Receba um texto e retorne um JSON no formato {"correctedText":"...","notes":["..."],"confidence":0.0-1.0}.
Mantenha o tom do autor, apenas corrigindo erros e fluidez.
Texto:
"""${options.text}"""`;
        console.log('SpellCheck Prompt:', prompt);
        console.log('model', this.model);
        const response = await this.generateText({
            prompt,
            temperature: 0.1,
            responseFormat: 'json'
        });
        const parsed = this.safeJsonParse(response.text);
        if (!parsed) {
            throw new Error('Não foi possível interpretar a resposta da IA.');
        }
        return {
            correctedText: parsed.correctedText?.trim() || options.text,
            notes: parsed.notes || [],
            confidence: typeof parsed.confidence === 'number'
                ? Math.min(Math.max(parsed.confidence, 0), 1)
                : 0.8
        };
    }
    async suggestImprovements(options) {
        const contextBlock = options.context ? `\nContexto disponível:\n${options.context}` : '';
        const prompt = `Você é um roteirista especializado em narrativas em português do Brasil.
Reescreva o texto mantendo a intenção, mas melhore ritmo, emoção e clareza.
Retorne um JSON no formato {"improvedText":"...","suggestions":["..."],"summary":"..."}.
${contextBlock}
Texto original:
"""${options.text}"""`;
        const response = await this.generateText({
            prompt,
            temperature: 0.35,
            responseFormat: 'json'
        });
        const parsed = this.safeJsonParse(response.text);
        if (!parsed) {
            throw new Error('Não foi possível interpretar a resposta da IA.');
        }
        return {
            improvedText: parsed.improvedText?.trim() || options.text,
            suggestions: parsed.suggestions || [],
            summary: parsed.summary || 'Ajuste sugerido para maior naturalidade.'
        };
    }
    async enrichWithDetails(options) {
        const baseText = options.text?.trim();
        const prompt = `Você é um ghostwriter responsável por inserir detalhes visuais do personagem dentro da fala.
Use apenas informações presentes no resumo abaixo para evitar inconsistências.
Retorne JSON no formato {"enrichedText":"...","highlights":["..."]}.
Resumo do personagem:
${options.characterSummary}
${baseText ? `Texto base:\n"""${baseText}"""` : 'O texto ainda será escrito. Sugira uma fala curta que evidencie traços do personagem.'}`;
        const response = await this.generateText({
            prompt,
            temperature: 0.4,
            responseFormat: 'json'
        });
        const parsed = this.safeJsonParse(response.text);
        if (!parsed) {
            throw new Error('Não foi possível interpretar a resposta da IA.');
        }
        return {
            enrichedText: parsed.enrichedText?.trim() || baseText || '',
            highlights: parsed.highlights || []
        };
    }
}
exports.GeminiTextProvider = GeminiTextProvider;
