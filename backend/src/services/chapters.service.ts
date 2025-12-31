import prisma from '../lib/prisma';
import { achievementService } from './achievement.service';

export interface CreateChapterDto {
    title: string;
}

export interface UpdateChapterDto {
    title?: string;
}

export interface ReorderChaptersDto {
    orderedIds: string[];
}

export class ChaptersService {
    async getByBookId(bookId: string) {
        return await prisma.chapter.findMany({
            where: { bookId },
            orderBy: { orderIndex: 'asc' },
            include: {
                speeches: true,
            },
        });
    }

    async getById(id: string) {
        const chapter = await prisma.chapter.findUnique({
            where: { id },
            include: {
                speeches: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        return chapter;
    }

    async create(bookId: string, data: CreateChapterDto) {
        // Validation
        if (!data.title || data.title.trim().length === 0) {
            throw new Error('Title is required');
        }

        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book) {
            throw new Error('Book not found');
        }

        // Get max order index
        const lastChapter = await prisma.chapter.findFirst({
            where: { bookId },
            orderBy: { orderIndex: 'desc' },
        });

        const newOrderIndex = lastChapter ? lastChapter.orderIndex + 1 : 1;

        return await prisma.chapter.create({
            data: {
                bookId,
                title: data.title.trim(),
                orderIndex: newOrderIndex,
                status: 'draft',
            },
        }).then(async (chapter) => {
            // Sprint 10: Check achievements for chapters created
            if (book.userId) {
                setImmediate(async () => {
                    try {
                        await achievementService.checkAndUnlock(book.userId!, 'chapters_count');
                    } catch (err) {
                        console.error('Failed to check achievements:', err);
                    }
                });
            }
            return chapter;
        });
    }

    async update(id: string, data: UpdateChapterDto) {
        if (data.title !== undefined && data.title.trim().length === 0) {
            throw new Error('Title is required');
        }

        const chapter = await prisma.chapter.findUnique({ where: { id } });
        if (!chapter) {
            throw new Error('Chapter not found');
        }

        return await prisma.chapter.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title.trim() }),
            },
        });
    }

    async delete(id: string) {
        const chapter = await prisma.chapter.findUnique({
            where: { id },
            include: { narration: true }
        });

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        if (chapter.narration && chapter.narration.status === 'completed') {
            throw new Error('Cannot delete chapter with completed narration');
        }

        await prisma.chapter.delete({ where: { id } });
        return { message: 'Chapter deleted successfully' };
    }

    async reorder(bookId: string, orderedIds: string[]) {
        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book) {
            throw new Error('Book not found');
        }

        // Verify all chapters belong to the book
        const chapters = await prisma.chapter.findMany({
            where: {
                bookId,
                id: { in: orderedIds }
            }
        });

        if (chapters.length !== orderedIds.length) {
            throw new Error('Invalid chapter IDs provided');
        }

        // Update order in transaction
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.chapter.update({
                    where: { id },
                    data: { orderIndex: index + 1 }
                })
            )
        );

        return { message: 'Chapters reordered successfully' };
    }
}

export const chaptersService = new ChaptersService();
