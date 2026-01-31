import prisma from '../lib/prisma';
import { achievementService } from './achievement.service';
import { auditService } from './audit.service';

export interface CreateChapterDto {
    title: string;
    userId?: string;
    userEmail?: string;
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

        const chapter = await prisma.chapter.create({
            data: {
                bookId,
                title: data.title.trim(),
                orderIndex: newOrderIndex,
                status: 'draft',
            },
        });

        // Audit log - chapter created
        if (data.userId && data.userEmail) {
            auditService.logCreate(
                data.userId,
                data.userEmail,
                'Chapter',
                chapter.id,
                { title: chapter.title, bookId, orderIndex: newOrderIndex }
            ).catch(err => console.error('[AUDIT]', err));
        }

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
    }

    async update(id: string, data: UpdateChapterDto, userId?: string, userEmail?: string) {
        if (data.title !== undefined && data.title.trim().length === 0) {
            throw new Error('Title is required');
        }

        const chapter = await prisma.chapter.findUnique({ where: { id } });
        if (!chapter) {
            throw new Error('Chapter not found');
        }

        const before = { title: chapter.title };

        const updatedChapter = await prisma.chapter.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title.trim() }),
            },
        });

        // Audit log - chapter updated
        if (userId && userEmail) {
            auditService.logUpdate(
                userId,
                userEmail,
                'Chapter',
                id,
                { before, after: { title: updatedChapter.title } }
            ).catch(err => console.error('[AUDIT]', err));
        }

        return updatedChapter;
    }

    async delete(id: string, userId?: string, userEmail?: string) {
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

        // Audit log - chapter deleted
        if (userId && userEmail) {
            auditService.logDelete(
                userId,
                userEmail,
                'Chapter',
                id,
                { title: chapter.title, bookId: chapter.bookId }
            ).catch(err => console.error('[AUDIT]', err));
        }

        return { message: 'Chapter deleted successfully' };
    }

    async reorder(bookId: string, orderedIds: string[], userId?: string, userEmail?: string) {
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

        // Audit log - chapters reordered
        if (userId && userEmail) {
            auditService.log({
                userId,
                userEmail,
                action: 'CHAPTER_REORDER' as any,
                category: 'CHAPTER' as any,
                severity: 'LOW' as any,
                resource: 'Chapter',
                resourceId: bookId,
                description: `Capítulos reordenados no livro ${bookId}`,
                metadata: { orderedIds, count: orderedIds.length }
            }).catch(err => console.error('[AUDIT]', err));
        }

        return { message: 'Chapters reordered successfully' };
    }
}

export const chaptersService = new ChaptersService();
