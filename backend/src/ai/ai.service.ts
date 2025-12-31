import { Character, Chapter, Book } from '@prisma/client';
import { AIFactory } from './ai.factory';
import { TextAIProvider, SpellCheckResult, SuggestionResult, EnrichmentResult } from './interfaces/text-provider.interface';
import { ImageAIProvider, EmotionImageResult, ImageGenerationResult } from './interfaces/image-provider.interface';
import { TTSProvider, Voice, AudioResult, VoiceConfig } from './interfaces/tts-provider.interface';
import prisma from '../lib/prisma';

// Tipos com relações
type CharacterWithProfile = Character & {
    book?: Book | null;
    identity?: Record<string, any> | null;
    physique?: Record<string, any> | null;
    face?: Record<string, any> | null;
    eyes?: Record<string, any> | null;
    hair?: Record<string, any> | null;
    wardrobe?: Record<string, any> | null;
};

type ChapterWithBook = Chapter & { book?: Book | null };

// DTOs de entrada
export interface SpellCheckRequest {
    text: string;
    language?: string;
}

export interface SuggestionRequest {
    text: string;
    characterId?: string;
    chapterId?: string;
    includeContext?: boolean;
}

export interface CharacterEnrichmentRequest {
    text?: string;
    characterId: string;
}

export interface EmotionImageRequest {
    text: string;
    characterId?: string;
    styleHint?: string;
}

export interface ImageGenerationRequest {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    style?: string;
}

// DTOs de TTS
export interface AudioGenerationRequest {
    text: string;
    voiceName: string;
    useSSML?: boolean;
    outputFormat?: 'mp3' | 'wav' | 'ogg' | 'aac';
    speakingRate?: number;
    pitch?: number;
}

export interface VoicePreviewRequest {
    voiceName: string;
    sampleText?: string;
}

/**
 * Serviço principal de IA que orquestra provedores de texto, imagem e TTS
 */
export class AIService {
    private static instance: AIService;
    private textProvider: TextAIProvider;
    private imageProvider: ImageAIProvider;
    private ttsProvider: TTSProvider;

    private constructor() {
        this.textProvider = AIFactory.getDefaultTextProvider();
        this.imageProvider = AIFactory.getDefaultImageProvider();
        this.ttsProvider = AIFactory.getDefaultTTSProvider();
        
        this.initialize();
    }

    private async initialize() {
        try {
            await this.textProvider.initialize();
            await this.imageProvider.initialize();
            await this.ttsProvider.initialize();
        } catch (err) {
            console.error('Failed to initialize AI providers:', err);
        }
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    // ========== Helpers ==========

    private async getCharacter(characterId: string): Promise<CharacterWithProfile | null> {
        return prisma.character.findUnique({
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

    private async getChapter(chapterId: string): Promise<ChapterWithBook | null> {
        return prisma.chapter.findUnique({
            where: { id: chapterId },
            include: { book: true }
        });
    }

    private composeCharacterSummary(character: CharacterWithProfile): string {
        const sections: string[] = [];
        sections.push(`Nome: ${character.name}`);
        
        if (character.book) {
            sections.push(`Livro: ${character.book.title}`);
        }
        if (character.voiceDescription) {
            sections.push(`Voz: ${character.voiceDescription}`);
        }

        const addSection = (title: string, data?: Record<string, any> | null) => {
            if (!data) return;
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

    private buildContextBlock(character?: CharacterWithProfile | null, chapter?: ChapterWithBook | null): string {
        const segments: string[] = [];

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

    async spellCheck(request: SpellCheckRequest): Promise<SpellCheckResult> {
        if (!request.text?.trim()) {
            throw new Error('Texto é obrigatório para a correção.');
        }

        return this.textProvider.spellCheck({
            text: request.text,
            language: request.language
        });
    }

    async suggestImprovements(request: SuggestionRequest): Promise<SuggestionResult> {
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

    async enrichWithCharacterDetails(request: CharacterEnrichmentRequest): Promise<EnrichmentResult> {
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

    async generateEmotionImage(request: EmotionImageRequest): Promise<EmotionImageResult> {
        if (!request.text?.trim()) {
            throw new Error('Texto é obrigatório para gerar imagem.');
        }

        let characterSummary: string | undefined;
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

    async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
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

    async generateAudio(request: AudioGenerationRequest): Promise<AudioResult> {
        if (!request.text?.trim()) {
            throw new Error('Texto é obrigatório para gerar áudio.');
        }
        if (!request.voiceName?.trim()) {
            throw new Error('Nome da voz é obrigatório.');
        }

        const voiceConfig: VoiceConfig = {
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

    async getAvailableVoices(): Promise<Voice[]> {
        return this.ttsProvider.getAvailableVoices();
    }

    async previewVoice(request: VoicePreviewRequest): Promise<AudioResult> {
        return this.ttsProvider.previewVoice(
            request.voiceName,
            request.sampleText
        );
    }

    async validateSSML(ssmlText: string): Promise<{ valid: boolean; errors?: string[] }> {
        return this.ttsProvider.validateSSML(ssmlText);
    }

    // ========== Provider Management ==========

    getTextProviderName(): string {
        return this.textProvider.name;
    }

    getImageProviderName(): string {
        return this.imageProvider.name;
    }

    getTTSProviderName(): string {
        return this.ttsProvider.name;
    }

    getProviderInfo(): { text: string; image: string; tts: string } {
        return {
            text: this.textProvider.name,
            image: this.imageProvider.name,
            tts: this.ttsProvider.name
        };
    }
}

export const aiService = AIService.getInstance();
