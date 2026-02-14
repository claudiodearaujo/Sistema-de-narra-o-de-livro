import { GoogleGenAI } from '@google/genai';
import { aiConfig, getGeminiApiKeyOrThrow } from '../ai.config';
import {
    TextAIProvider,
    TextGenerationOptions,
    TextGenerationResult,
    SpellCheckOptions,
    SpellCheckResult,
    SuggestionOptions,
    SuggestionResult,
    EnrichmentOptions,
    EnrichmentResult
} from '../interfaces/text-provider.interface';
import { RateLimiter, rateLimiterManager } from '../../utils/rate-limiter';

export class GeminiTextProvider implements TextAIProvider {
    readonly name = 'gemini';
    readonly supportedLanguages = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];
    
    private ai: GoogleGenAI;
    private model: string;
    private rateLimiter: RateLimiter;

    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: getGeminiApiKeyOrThrow()
        });
        this.model = aiConfig.providers.gemini?.textModel || 'gemini-2.0-flash';
        this.rateLimiter = rateLimiterManager.get('gemini-text', aiConfig.rateLimit.gemini);
    }

    async initialize(): Promise<void> {
        console.log(`✅ [Gemini Text] Provider inicializado`);
        console.log(`   Modelo: ${this.model}`);
        console.log(`   Rate Limit: ${aiConfig.rateLimit.gemini.maxRequests} req/min`);
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

    async generateText(options: TextGenerationOptions): Promise<TextGenerationResult> {
        const contents: any[] = [];
        
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

        return this.rateLimiter.execute(async () => {
            // If streaming is requested
            if (options.stream) {
                const streamResponse = await this.ai.models.generateContentStream({
                    model: this.model,
                    contents,
                    config: {
                        temperature: options.temperature ?? aiConfig.defaults.temperature,
                        maxOutputTokens: options.maxTokens ?? aiConfig.defaults.maxTokens,
                        responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain'
                    }
                });

                // Create async generator for streaming chunks
                const streamGenerator = async function* () {
                    for await (const chunk of streamResponse) {
                        const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text) {
                            yield text;
                        }
                    }
                };

                return {
                    text: '', // Will be filled by consumer
                    stream: streamGenerator(),
                    finishReason: 'STREAMING'
                };
            }

            // Non-streaming response
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents,
                config: {
                    temperature: options.temperature ?? aiConfig.defaults.temperature,
                    maxOutputTokens: options.maxTokens ?? aiConfig.defaults.maxTokens,
                    responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain'
                }
            });

            const text = this.extractText(response);

            return {
                text,
                finishReason: response?.candidates?.[0]?.finishReason || 'STOP'
            };
        });
    }

    async spellCheck(options: SpellCheckOptions): Promise<SpellCheckResult> {
        const language = options.language || aiConfig.defaults.language;
        
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

        const parsed = this.safeJsonParse<SpellCheckResult>(response.text);
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

    async suggestImprovements(options: SuggestionOptions): Promise<SuggestionResult> {
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

        const parsed = this.safeJsonParse<SuggestionResult>(response.text);
        if (!parsed) {
            throw new Error('Não foi possível interpretar a resposta da IA.');
        }

        return {
            improvedText: parsed.improvedText?.trim() || options.text,
            suggestions: parsed.suggestions || [],
            summary: parsed.summary || 'Ajuste sugerido para maior naturalidade.'
        };
    }

    async enrichWithDetails(options: EnrichmentOptions): Promise<EnrichmentResult> {
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

        const parsed = this.safeJsonParse<EnrichmentResult>(response.text);
        if (!parsed) {
            throw new Error('Não foi possível interpretar a resposta da IA.');
        }

        return {
            enrichedText: parsed.enrichedText?.trim() || baseText || '',
            highlights: parsed.highlights || []
        };
    }
}
