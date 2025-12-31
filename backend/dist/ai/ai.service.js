"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const ai_factory_1 = require("./ai.factory");
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Serviço principal de IA que orquestra provedores de texto, imagem e TTS
 */
class AIService {
    constructor() {
        this.textProvider = ai_factory_1.AIFactory.getDefaultTextProvider();
        this.imageProvider = ai_factory_1.AIFactory.getDefaultImageProvider();
        this.ttsProvider = ai_factory_1.AIFactory.getDefaultTTSProvider();
        this.initialize();
    }
    async initialize() {
        try {
            await this.textProvider.initialize();
            await this.imageProvider.initialize();
            await this.ttsProvider.initialize();
        }
        catch (err) {
            console.error('Failed to initialize AI providers:', err);
        }
    }
    static getInstance() {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }
    // ========== Helpers ==========
    async getCharacter(characterId) {
        return prisma_1.default.character.findUnique({
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
        return prisma_1.default.chapter.findUnique({
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
            if (!data)
                return;
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
    // ========== Text Methods ==========
    async spellCheck(request) {
        if (!request.text?.trim()) {
            throw new Error('Texto é obrigatório para a correção.');
        }
        return this.textProvider.spellCheck({
            text: request.text,
            language: request.language
        });
    }
    async suggestImprovements(request) {
        if (!request.text?.trim()) {
            throw new Error('Texto é obrigatório para sugestões.');
        }
        let context = '';
        if (request.includeContext) {
            const character = request.characterId
                ? await this.getCharacter(request.characterId)
                : null;
            const chapter = request.chapterId
                ? await this.getChapter(request.chapterId)
                : null;
            context = this.buildContextBlock(character, chapter);
        }
        return this.textProvider.suggestImprovements({
            text: request.text,
            context
        });
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
        return this.textProvider.enrichWithDetails({
            text: request.text,
            characterSummary: summary
        });
    }
    // ========== Image Methods ==========
    async generateEmotionImage(request) {
        if (!request.text?.trim()) {
            throw new Error('Texto é obrigatório para gerar imagem.');
        }
        let characterSummary;
        if (request.characterId) {
            const character = await this.getCharacter(request.characterId);
            if (character) {
                characterSummary = this.composeCharacterSummary(character);
            }
        }
        return this.imageProvider.generateEmotionImage({
            text: request.text,
            characterSummary,
            styleHint: request.styleHint
        });
    }
    async generateImage(request) {
        if (!request.prompt?.trim()) {
            throw new Error('Prompt é obrigatório para gerar imagem.');
        }
        return this.imageProvider.generateImage({
            prompt: request.prompt,
            negativePrompt: request.negativePrompt,
            width: request.width,
            height: request.height,
            style: request.style
        });
    }
    // ========== TTS Methods ==========
    async generateAudio(request) {
        if (!request.text?.trim()) {
            throw new Error('Texto é obrigatório para gerar áudio.');
        }
        if (!request.voiceName?.trim()) {
            throw new Error('Nome da voz é obrigatório.');
        }
        const voiceConfig = {
            voiceId: request.voiceName
        };
        return this.ttsProvider.generateAudio({
            text: request.text,
            voice: voiceConfig,
            useSSML: request.useSSML,
            outputFormat: request.outputFormat,
            speakingRate: request.speakingRate,
            pitch: request.pitch
        });
    }
    async getAvailableVoices() {
        return this.ttsProvider.getAvailableVoices();
    }
    async previewVoice(request) {
        return this.ttsProvider.previewVoice(request.voiceName, request.sampleText);
    }
    async validateSSML(ssmlText) {
        return this.ttsProvider.validateSSML(ssmlText);
    }
    // ========== Provider Management ==========
    getTextProviderName() {
        return this.textProvider.name;
    }
    getImageProviderName() {
        return this.imageProvider.name;
    }
    getTTSProviderName() {
        return this.ttsProvider.name;
    }
    getProviderInfo() {
        return {
            text: this.textProvider.name,
            image: this.imageProvider.name,
            tts: this.ttsProvider.name
        };
    }
}
exports.AIService = AIService;
exports.aiService = AIService.getInstance();
