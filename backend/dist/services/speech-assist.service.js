"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechAssistService = void 0;
const genai_1 = require("@google/genai");
const client_1 = require("@prisma/client");
class SpeechAssistService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.ai = new genai_1.GoogleGenAI({});
        this.textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';
        this.imageModel = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001';
    }
    extractText(response) {
        const parts = response?.candidates?.[0]?.content?.parts || [];
        return parts
            .map((part) => part.text || part.inlineData?.data || '')
            .join('')
            .trim();
    }
    safeJsonParse(text) {
        if (!text) {
            return null;
        }
        const potentialJson = text.trim();
        const cleaned = potentialJson.startsWith('```')
            ? potentialJson.replace(/```json|```/gi, '').trim()
            : potentialJson;
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
    async runJsonPrompt(prompt, temperature = 0.25) {
        const response = await this.ai.models.generateContent({
            model: this.textModel,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            config: {
                temperature,
                responseMimeType: 'application/json'
            }
        });
        const text = this.extractText(response);
        const parsed = this.safeJsonParse(text);
        if (!parsed) {
            throw new Error('Não foi possível interpretar a resposta da IA.');
        }
        return parsed;
    }
    async getCharacter(characterId) {
        return this.prisma.character.findUnique({
            where: { id: characterId },
            include: {
                book: true,
                identity: true,
                physique: true,
                face: true,
                eyes: true,
                hair: true,
                wardrobe: true
            }
        });
    }
    async getChapter(chapterId) {
        return this.prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { book: true }
        });
    }
    composeCharacterSummary(character) {
        const sections = [];
        sections.push(`Nome: ${character.name}`);
        if (character.book) {
            sections.push(`Livro: ${character.book.title}`);
        }
        if (character.voiceDescription) {
            sections.push(`Voz: ${character.voiceDescription}`);
        }
        const addSection = (title, data) => {
            if (!data) {
                return;
            }
            const entries = Object.entries(data)
                .filter(([key, value]) => !['id', 'characterId'].includes(key) && value)
                .map(([key, value]) => `${key}: ${value}`);
            if (entries.length) {
                sections.push(`${title}: ${entries.join(', ')}`);
            }
        };
        addSection('Identidade', character.identity);
        addSection('Traços físicos', character.physique);
        addSection('Rosto', character.face);
        addSection('Olhos', character.eyes);
        addSection('Cabelos', character.hair);
        addSection('Vestuário', character.wardrobe);
        return sections.join('\n');
    }
    buildContextBlock(character, chapter) {
        const segments = [];
        if (chapter) {
            segments.push(`Capítulo: ${chapter.title}`);
            if (chapter.book) {
                const description = chapter.book.description ? `Descrição do livro: ${chapter.book.description}` : '';
                segments.push(`Livro: ${chapter.book.title}. ${description}`.trim());
            }
        }
        if (character) {
            segments.push('Personagem foco:\n' + this.composeCharacterSummary(character));
        }
        return segments.join('\n\n');
    }
    async spellCheck(text, language = 'pt-BR') {
        if (!text || !text.trim()) {
            throw new Error('Texto é obrigatório para a correção.');
        }
        const prompt = `Atue como um revisor ortográfico e gramatical da língua ${language}.\n` +
            'Receba um texto e retorne um JSON no formato {"correctedText":"...","notes":["..."],"confidence":0.0-1.0}.\n' +
            'Mantenha o tom do autor, apenas corrigindo erros e fluidez.\n' +
            'Texto:\n"""' + text + '"""';
        const result = await this.runJsonPrompt(prompt, 0.1);
        return {
            correctedText: result.correctedText?.trim() || text,
            notes: result.notes || [],
            confidence: typeof result.confidence === 'number' ? Math.min(Math.max(result.confidence, 0), 1) : 0.8
        };
    }
    async suggestImprovements(request) {
        if (!request.text || !request.text.trim()) {
            throw new Error('Texto é obrigatório para sugestões.');
        }
        const character = request.characterId ? await this.getCharacter(request.characterId) : null;
        const chapter = request.includeContext && request.chapterId ? await this.getChapter(request.chapterId) : null;
        const contextBlock = request.includeContext ? this.buildContextBlock(character, chapter) : '';
        const prompt = [
            'Você é um roteirista especializado em narrativas em português do Brasil.',
            'Reescreva o texto mantendo a intenção, mas melhore ritmo, emoção e clareza.',
            'Retorne um JSON no formato {"improvedText":"...","suggestions":["..."],"summary":"..."}.',
            contextBlock ? `Contexto disponível:\n${contextBlock}` : '',
            'Texto original:\n"""' + request.text + '"""'
        ].filter(Boolean).join('\n\n');
        const result = await this.runJsonPrompt(prompt, 0.35);
        return {
            improvedText: result.improvedText?.trim() || request.text,
            suggestions: result.suggestions || [],
            summary: result.summary || 'Ajuste sugerido para maior naturalidade.'
        };
    }
    async enrichWithCharacterDetails(request) {
        if (!request.characterId) {
            throw new Error('characterId é obrigatório.');
        }
        const character = await this.getCharacter(request.characterId);
        if (!character) {
            throw new Error('Personagem não encontrado.');
        }
        const summary = this.composeCharacterSummary(character);
        const baseText = request.text?.trim();
        const prompt = [
            'Você é um ghostwriter responsável por inserir detalhes visuais do personagem dentro da fala.',
            'Use apenas informações presentes no resumo abaixo para evitar inconsistências.',
            'Retorne JSON no formato {"enrichedText":"...","highlights":["..." ]}.',
            'Resumo do personagem:\n' + summary,
            baseText ? 'Texto base:\n"""' + baseText + '"""' : 'O texto ainda será escrito. Sugira uma fala curta que evidencie traços do personagem.'
        ].join('\n\n');
        const result = await this.runJsonPrompt(prompt, 0.4);
        return {
            enrichedText: result.enrichedText?.trim() || baseText || '',
            highlights: result.highlights || []
        };
    }
    async generateEmotionImage(request) {
        if (!request.text || !request.text.trim()) {
            throw new Error('Texto é obrigatório para gerar imagem.');
        }
        const character = request.characterId ? await this.getCharacter(request.characterId) : null;
        const analysisPrompt = [
            'Identifique o sentimento dominante da fala e descreva elementos visuais e paleta de cores.',
            'Retorne JSON no formato {"sentiment":"...","visualElements":["..."],"colorPalette":"...","shortCaption":"..."}.',
            'Fala:\n"""' + request.text + '"""'
        ].join('\n\n');
        const analysis = await this.runJsonPrompt(analysisPrompt, 0.2);
        const characterHint = character ? `Detalhes do personagem:\n${this.composeCharacterSummary(character)}` : '';
        const imagePrompt = [
            'Crie uma ilustração conceitual em estilo pintura digital cinematográfica.',
            `Sentimento dominante: ${analysis.sentiment || 'introspectivo'}.`,
            analysis.visualElements && analysis.visualElements.length
                ? 'Elementos visuais recomendados: ' + analysis.visualElements.join(', ') + '.'
                : '',
            analysis.colorPalette ? `Paleta sugerida: ${analysis.colorPalette}.` : '',
            request.styleHint ? `Direção artística adicional: ${request.styleHint}.` : 'Use composição com foco em contraste de luz e sombra.',
            characterHint,
            'Formato 1:1, alta definição, pinceladas suaves.'
        ].filter(Boolean).join('\n');
        const response = await this.ai.models.generateContent({
            model: this.imageModel,
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
        const imagePart = response?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
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
exports.speechAssistService = new SpeechAssistService();
