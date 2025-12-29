import { PrismaClient, Speech } from '@prisma/client';
import { aiService } from '../ai';

const prisma = new PrismaClient();

export interface CreateSpeechDto {
    chapterId: string;
    characterId: string;
    text: string;
    ssmlText?: string;
    orderIndex?: number;
}

export interface UpdateSpeechDto {
    characterId?: string;
    text?: string;
    ssmlText?: string;
    orderIndex?: number;
}

export class SpeechesService {
    async getByChapterId(chapterId: string) {
        return await prisma.speech.findMany({
            where: { chapterId },
            orderBy: { orderIndex: 'asc' },
            include: { character: true }
        });
    }

    async getById(id: string) {
        const speech = await prisma.speech.findUnique({
            where: { id },
            include: { character: true }
        });

        if (!speech) {
            throw new Error('Speech not found');
        }

        return speech;
    }

    async create(data: CreateSpeechDto) {
        // Validation
        if (!data.text || data.text.trim().length === 0) {
            throw new Error('Text is required');
        }

        // Auto-wrap SSML with <speak> tag if not present
        if (data.ssmlText) {
            const trimmedSsml = data.ssmlText.trim();
            if (!trimmedSsml.startsWith('<speak>')) {
                data.ssmlText = `<speak>${trimmedSsml}</speak>`;
            }
            
            const validation = await aiService.validateSSML(data.ssmlText);
            if (!validation.valid) {
                throw new Error(`Invalid SSML: ${validation.errors?.join(', ')}`);
            }
        }

        // Determine order index if not provided
        let orderIndex = data.orderIndex;
        if (orderIndex === undefined) {
            const lastSpeech = await prisma.speech.findFirst({
                where: { chapterId: data.chapterId },
                orderBy: { orderIndex: 'desc' }
            });
            orderIndex = (lastSpeech?.orderIndex ?? 0) + 1;
        }

        return await prisma.speech.create({
            data: {
                chapterId: data.chapterId,
                characterId: data.characterId,
                text: data.text,
                ssmlText: data.ssmlText,
                orderIndex: orderIndex
            }
        });
    }

    async update(id: string, data: UpdateSpeechDto) {
        const speech = await prisma.speech.findUnique({ where: { id } });
        if (!speech) {
            throw new Error('Speech not found');
        }

        // Auto-wrap SSML with <speak> tag if not present
        if (data.ssmlText) {
            const trimmedSsml = data.ssmlText.trim();
            if (!trimmedSsml.startsWith('<speak>')) {
                data.ssmlText = `<speak>${trimmedSsml}</speak>`;
            }
            
            const validation = await aiService.validateSSML(data.ssmlText);
            if (!validation.valid) {
                throw new Error(`Invalid SSML: ${validation.errors?.join(', ')}`);
            }
        }

        return await prisma.speech.update({
            where: { id },
            data: {
                ...(data.characterId && { characterId: data.characterId }),
                ...(data.text !== undefined && { text: data.text }),
                ...(data.ssmlText !== undefined && { ssmlText: data.ssmlText }),
                ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex })
            }
        });
    }

    async delete(id: string) {
        const speech = await prisma.speech.findUnique({ where: { id } });
        if (!speech) {
            throw new Error('Speech not found');
        }

        await prisma.speech.delete({ where: { id } });
        return { message: 'Speech deleted successfully' };
    }

    async reorder(chapterId: string, orderedIds: string[]) {
        const updates = orderedIds.map((id, index) =>
            prisma.speech.update({
                where: { id },
                data: { orderIndex: index }
            })
        );

        await prisma.$transaction(updates);
        return { message: 'Speeches reordered successfully' };
    }

    async bulkCreate(chapterId: string, text: string, strategy: 'paragraph' | 'sentence' | 'dialog', defaultCharacterId: string) {
        let parts: string[] = [];

        if (strategy === 'paragraph') {
            parts = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        } else if (strategy === 'sentence') {
            // Simple sentence split, can be improved
            parts = text.match(/[^.!?]+[.!?]+/g) || [text];
        } else if (strategy === 'dialog') {
            // Split by dialog markers (dash or quotes)
            // This is a naive implementation
            parts = text.split(/\n/).filter(p => p.trim().length > 0);
        } else {
            parts = [text];
        }

        const lastSpeech = await prisma.speech.findFirst({
            where: { chapterId },
            orderBy: { orderIndex: 'desc' }
        });
        let startOrder = (lastSpeech?.orderIndex ?? 0) + 1;

        const speechesData = parts.map((part, index) => ({
            chapterId,
            characterId: defaultCharacterId,
            text: part.trim(),
            orderIndex: startOrder + index
        }));

        await prisma.speech.createMany({
            data: speechesData
        });

        return { message: `${speechesData.length} speeches created successfully` };
    }
}

export const speechesService = new SpeechesService();
