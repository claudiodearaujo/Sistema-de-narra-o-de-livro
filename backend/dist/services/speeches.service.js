"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechesService = exports.SpeechesService = void 0;
const ai_1 = require("../ai");
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_service_1 = require("./audit.service");
class SpeechesService {
    async getByChapterId(chapterId) {
        return await prisma_1.default.speech.findMany({
            where: { chapterId },
            orderBy: { orderIndex: 'asc' },
            include: { character: true }
        });
    }
    async getById(id) {
        const speech = await prisma_1.default.speech.findUnique({
            where: { id },
            include: { character: true }
        });
        if (!speech) {
            throw new Error('Speech not found');
        }
        return speech;
    }
    async create(data) {
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
            const validation = await ai_1.aiService.validateSSML(data.ssmlText);
            if (!validation.valid) {
                throw new Error(`Invalid SSML: ${validation.errors?.join(', ')}`);
            }
        }
        // Determine order index if not provided
        let orderIndex = data.orderIndex;
        if (orderIndex === undefined) {
            const lastSpeech = await prisma_1.default.speech.findFirst({
                where: { chapterId: data.chapterId },
                orderBy: { orderIndex: 'desc' }
            });
            orderIndex = (lastSpeech?.orderIndex ?? 0) + 1;
        }
        const speech = await prisma_1.default.speech.create({
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
            audit_service_1.auditService.logCreate(data.userId, data.userEmail, 'Speech', speech.id, { text: data.text.substring(0, 100), characterId: data.characterId, chapterId: data.chapterId }).catch(err => console.error('[AUDIT]', err));
        }
        return speech;
    }
    async update(id, data, userId, userEmail) {
        const speech = await prisma_1.default.speech.findUnique({ where: { id } });
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
            const validation = await ai_1.aiService.validateSSML(data.ssmlText);
            if (!validation.valid) {
                throw new Error(`Invalid SSML: ${validation.errors?.join(', ')}`);
            }
        }
        const updatedSpeech = await prisma_1.default.speech.update({
            where: { id },
            data: {
                ...(data.characterId && { characterId: data.characterId }),
                ...(data.text !== undefined && { text: data.text }),
                ...(data.ssmlText !== undefined && { ssmlText: data.ssmlText }),
                ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex })
            }
        });
        // Audit log - speech updated
        if (userId && userEmail) {
            audit_service_1.auditService.logUpdate(userId, userEmail, 'Speech', id, {
                before: {
                    ...before,
                    text: before.text.substring(0, 100)
                },
                after: {
                    characterId: updatedSpeech.characterId,
                    text: updatedSpeech.text.substring(0, 100),
                    orderIndex: updatedSpeech.orderIndex
                }
            }).catch(err => console.error('[AUDIT]', err));
        }
        return updatedSpeech;
    }
    async delete(id, userId, userEmail) {
        const speech = await prisma_1.default.speech.findUnique({ where: { id } });
        if (!speech) {
            throw new Error('Speech not found');
        }
        await prisma_1.default.speech.delete({ where: { id } });
        // Audit log - speech deleted
        if (userId && userEmail) {
            audit_service_1.auditService.logDelete(userId, userEmail, 'Speech', id, { text: speech.text.substring(0, 100), chapterId: speech.chapterId }).catch(err => console.error('[AUDIT]', err));
        }
        return { message: 'Speech deleted successfully' };
    }
    async reorder(chapterId, orderedIds, userId, userEmail) {
        const updates = orderedIds.map((id, index) => prisma_1.default.speech.update({
            where: { id },
            data: { orderIndex: index }
        }));
        await prisma_1.default.$transaction(updates);
        // Audit log - speeches reordered
        if (userId && userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'CHAPTER_REORDER', // Reciclando a ação de reorder
                category: 'CONTENT',
                severity: 'LOW',
                resource: 'Speech',
                resourceId: chapterId,
                description: 'Falas reordenadas no capítulo',
                metadata: { chapterId, orderedIds }
            }).catch(err => console.error('[AUDIT]', err));
        }
        return { message: 'Speeches reordered successfully' };
    }
    async bulkCreate(chapterId, text, strategy, defaultCharacterId, userId, userEmail) {
        let parts = [];
        if (strategy === 'paragraph') {
            parts = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        }
        else if (strategy === 'sentence') {
            // Simple sentence split, can be improved
            parts = text.match(/[^.!?]+[.!?]+/g) || [text];
        }
        else if (strategy === 'dialog') {
            // Split by dialog markers (dash or quotes)
            // This is a naive implementation
            parts = text.split(/\n/).filter(p => p.trim().length > 0);
        }
        else {
            parts = [text];
        }
        const lastSpeech = await prisma_1.default.speech.findFirst({
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
        await prisma_1.default.speech.createMany({
            data: speechesData
        });
        // Audit log - bulk create
        if (userId && userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'SPEECH_BULK_CREATE',
                category: 'CONTENT',
                severity: 'MEDIUM',
                resource: 'Speech',
                resourceId: chapterId,
                description: `Criação em massa de ${speechesData.length} falas`,
                metadata: { chapterId, count: speechesData.length, strategy }
            }).catch(err => console.error('[AUDIT]', err));
        }
        return { message: `${speechesData.length} speeches created successfully` };
    }
}
exports.SpeechesService = SpeechesService;
exports.speechesService = new SpeechesService();
