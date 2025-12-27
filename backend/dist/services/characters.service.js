"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.charactersService = exports.CharactersService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CharactersService {
    async getByBookId(bookId) {
        const characters = await prisma.character.findMany({
            where: { bookId },
            orderBy: { name: 'asc' },
        });
        // Buscar informações das vozes para cada personagem
        const charactersWithVoice = await Promise.all(characters.map(async (character) => {
            const voice = await prisma.customVoice.findUnique({
                where: { id: character.voiceId },
            });
            return {
                ...character,
                voice: voice || undefined,
            };
        }));
        return charactersWithVoice;
    }
    async getAll() {
        const characters = await prisma.character.findMany({
            orderBy: { name: 'asc' },
        });
        const charactersWithVoice = await Promise.all(characters.map(async (character) => {
            const voice = await prisma.customVoice.findUnique({
                where: { id: character.voiceId },
            });
            return {
                ...character,
                voice: voice || undefined,
            };
        }));
        return charactersWithVoice;
    }
    async getById(id) {
        const character = await prisma.character.findUnique({
            where: { id },
        });
        if (!character) {
            throw new Error('Character not found');
        }
        return character;
    }
    async create(data) {
        // Validation
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Name is required');
        }
        if (!data.voiceId) {
            throw new Error('Voice ID is required');
        }
        // Verify book exists
        const book = await prisma.book.findUnique({ where: { id: data.bookId } });
        if (!book) {
            throw new Error('Book not found');
        }
        return await prisma.character.create({
            data: {
                bookId: data.bookId,
                name: data.name.trim(),
                voiceId: data.voiceId,
                voiceDescription: data.voiceDescription?.trim(),
                previewAudioUrl: data.previewAudioUrl,
            },
        });
    }
    async update(id, data) {
        const character = await prisma.character.findUnique({ where: { id } });
        if (!character) {
            throw new Error('Character not found');
        }
        return await prisma.character.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.voiceId && { voiceId: data.voiceId }),
                ...(data.voiceDescription !== undefined && { voiceDescription: data.voiceDescription?.trim() }),
                ...(data.previewAudioUrl !== undefined && { previewAudioUrl: data.previewAudioUrl }),
            },
        });
    }
    async delete(id) {
        const character = await prisma.character.findUnique({ where: { id } });
        if (!character) {
            throw new Error('Character not found');
        }
        await prisma.character.delete({ where: { id } });
        return { message: 'Character deleted successfully' };
    }
}
exports.CharactersService = CharactersService;
exports.charactersService = new CharactersService();
