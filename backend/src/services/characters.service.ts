import { PrismaClient, Character } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCharacterDto {
    bookId: string;
    name: string;
    voiceId: string;
    voiceDescription?: string;
    previewAudioUrl?: string;
}

export interface UpdateCharacterDto {
    name?: string;
    voiceId?: string;
    voiceDescription?: string;
    previewAudioUrl?: string;
}

export class CharactersService {
    async getByBookId(bookId: string) {
        return await prisma.character.findMany({
            where: { bookId },
            orderBy: { name: 'asc' },
        });
    }

    async getById(id: string) {
        const character = await prisma.character.findUnique({
            where: { id },
        });

        if (!character) {
            throw new Error('Character not found');
        }

        return character;
    }

    async create(data: CreateCharacterDto) {
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

    async update(id: string, data: UpdateCharacterDto) {
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

    async delete(id: string) {
        const character = await prisma.character.findUnique({ where: { id } });
        if (!character) {
            throw new Error('Character not found');
        }

        await prisma.character.delete({ where: { id } });
        return { message: 'Character deleted successfully' };
    }
}

export const charactersService = new CharactersService();
