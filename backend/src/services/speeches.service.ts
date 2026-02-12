import { Speech } from '@prisma/client';
import { aiService } from '../ai';
import prisma from '../lib/prisma';
import { auditService } from './audit.service';

export interface CreateSpeechDto {
    chapterId: string;
    characterId: string;
    text: string;
    ssmlText?: string;
    orderIndex?: number;
    userId?: string;     // Para audit logging
    userEmail?: string;  // Para audit logging
}

export interface UpdateSpeechDto {
    characterId?: string;
    text?: string;
    ssmlText?: string;
    orderIndex?: number;
    audioUrl?: string;
    audioDurationMs?: number;
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

        const speech = await prisma.speech.create({
            data: {
                chapterId: data.chapterId,
                characterId: data.characterId,
                text: data.text,
                ssmlText: data.ssmlText,
                orderIndex: orderIndex
            }
        });

        // Audit log - speech created
        if (data.userId && data.userEmail) {
            auditService.logCreate(
                data.userId,
                data.userEmail,
                'Speech',
                speech.id,
                { text: data.text.substring(0, 100), characterId: data.characterId, chapterId: data.chapterId }
            ).catch(err => console.error('[AUDIT]', err));
        }

        return speech;
    }

    async update(id: string, data: UpdateSpeechDto, userId?: string, userEmail?: string) {
        const speech = await prisma.speech.findUnique({ where: { id } });
        if (!speech) {
            throw new Error('Speech not found');
        }

        // Capture before state for audit
        const before = {
            characterId: speech.characterId,
            text: speech.text,
            orderIndex: speech.orderIndex
        };

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

        const updatedSpeech = await prisma.speech.update({
            where: { id },
            data: {
                ...(data.characterId && { characterId: data.characterId }),
                ...(data.text !== undefined && { text: data.text }),
                ...(data.ssmlText !== undefined && { ssmlText: data.ssmlText }),
                ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
                ...(data.audioUrl !== undefined && { audioUrl: data.audioUrl }),
                ...(data.audioDurationMs !== undefined && { audioDurationMs: data.audioDurationMs })
            }
        });

        // Audit log - speech updated
        if (userId && userEmail) {
            auditService.logUpdate(
                userId,
                userEmail,
                'Speech',
                id,
                {
                    before: { 
                        ...before, 
                        text: before.text.substring(0, 100) 
                    },
                    after: {
                        characterId: updatedSpeech.characterId,
                        text: updatedSpeech.text.substring(0, 100),
                        orderIndex: updatedSpeech.orderIndex
                    }
                }
            ).catch(err => console.error('[AUDIT]', err));
        }

        return updatedSpeech;
    }

    async delete(id: string, userId?: string, userEmail?: string) {
        const speech = await prisma.speech.findUnique({ where: { id } });
        if (!speech) {
            throw new Error('Speech not found');
        }

        await prisma.speech.delete({ where: { id } });

        // Audit log - speech deleted
        if (userId && userEmail) {
            auditService.logDelete(
                userId,
                userEmail,
                'Speech',
                id,
                { text: speech.text.substring(0, 100), chapterId: speech.chapterId }
            ).catch(err => console.error('[AUDIT]', err));
        }

        return { message: 'Speech deleted successfully' };
    }

    async reorder(chapterId: string, orderedIds: string[], userId?: string, userEmail?: string) {
        const updates = orderedIds.map((id, index) =>
            prisma.speech.update({
                where: { id },
                data: { orderIndex: index }
            })
        );

        await prisma.$transaction(updates);

        // Audit log - speeches reordered
        if (userId && userEmail) {
            auditService.log({
                userId,
                userEmail,
                action: 'CHAPTER_REORDER' as any, // Reciclando a ação de reorder
                category: 'CONTENT' as any,
                severity: 'LOW' as any,
                resource: 'Speech',
                resourceId: chapterId,
                description: 'Falas reordenadas no capítulo',
                metadata: { chapterId, orderedIds }
            }).catch(err => console.error('[AUDIT]', err));
        }

        return { message: 'Speeches reordered successfully' };
    }

    async bulkCreate(
        chapterId: string, 
        text: string, 
        strategy: 'paragraph' | 'sentence' | 'dialog', 
        defaultCharacterId: string,
        userId?: string,
        userEmail?: string
    ) {
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

        // Use createManyAndReturn to get the created speeches in one operation
        const createdSpeeches = await prisma.speech.createManyAndReturn({
            data: speechesData,
            include: { character: true }
        });

        // Audit log - bulk create
        if (userId && userEmail) {
            auditService.log({
                userId,
                userEmail,
                action: 'SPEECH_BULK_CREATE' as any,
                category: 'CONTENT' as any,
                severity: 'MEDIUM' as any,
                resource: 'Speech',
                resourceId: chapterId,
                description: `Criação em massa de ${speechesData.length} falas`,
                metadata: { chapterId, count: speechesData.length, strategy }
            }).catch(err => console.error('[AUDIT]', err));
        }

        return createdSpeeches;
    }
}

export const speechesService = new SpeechesService();
