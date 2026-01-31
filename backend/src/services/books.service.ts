import prisma from '../lib/prisma';
import { achievementService } from './achievement.service';
import { auditService } from './audit.service';

export interface CreateBookDto {
    title: string;
    author: string;
    description?: string;
    coverUrl?: string;
    userId?: string;
    userEmail?: string; // For audit logging
}

export interface UpdateBookDto {
    title?: string;
    author?: string;
    description?: string;
    coverUrl?: string;
}

export interface BookStats {
    totalChapters: number;
    totalSpeeches: number;
    totalCharacters: number;
}

export class BooksService {
    async getAll(page: number = 1, limit: number = 10, title?: string, author?: string, userId?: string) {
        const skip = (page - 1) * limit;

        const where: any = {};

        // Always filter by userId - only show books created by the logged in user
        if (userId) {
            where.userId = userId;
        }

        if (title) {
            where.title = { contains: title, mode: 'insensitive' };
        }
        if (author) {
            where.author = { contains: author, mode: 'insensitive' };
        }

        const [books, total] = await Promise.all([
            prisma.book.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    chapters: {
                        select: {
                            id: true,
                            status: true
                        }
                    }
                }
            }),
            prisma.book.count({ where }),
        ]);

        return {
            data: books,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(id: string) {
        const book = await prisma.book.findUnique({
            where: { id },
            include: {
                chapters: {
                    orderBy: { orderIndex: 'asc' },
                },
                characters: true,
            },
        });

        if (!book) {
            throw new Error('Book not found');
        }

        return book;
    }

    async create(data: CreateBookDto) {
        // Validation
        if (!data.title || data.title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters long');
        }
        if (!data.author || data.author.trim().length === 0) {
            throw new Error('Author is required');
        }

        const book = await prisma.book.create({
            data: {
                title: data.title.trim(),
                author: data.author.trim(),
                description: data.description?.trim(),
                coverUrl: data.coverUrl,
                userId: data.userId,
            },
        });

        // Audit log - book created
        if (data.userId && data.userEmail) {
            auditService.logCreate(
                data.userId,
                data.userEmail,
                'Book',
                book.id,
                { title: book.title, author: book.author }
            ).catch(err => console.error('[AUDIT]', err));
        }

        // Sprint 10: Check achievements for books created
        if (data.userId) {
            setImmediate(async () => {
                try {
                    await achievementService.checkAndUnlock(data.userId!, 'books_count');
                } catch (err) {
                    console.error('Failed to check achievements:', err);
                }
            });
        }

        return book;
    }

    async update(id: string, data: UpdateBookDto, userId?: string, userEmail?: string) {
        // Validation
        if (data.title !== undefined && data.title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters long');
        }
        if (data.author !== undefined && data.author.trim().length === 0) {
            throw new Error('Author is required');
        }

        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) {
            throw new Error('Book not found');
        }

        // Check if user owns this book
        if (userId && book.userId !== userId) {
            throw new Error('Unauthorized: You can only update your own books');
        }

        // Capture before state for audit
        const before = {
            title: book.title,
            author: book.author,
            description: book.description,
        };

        const updatedBook = await prisma.book.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title.trim() }),
                ...(data.author && { author: data.author.trim() }),
                ...(data.description !== undefined && { description: data.description?.trim() }),
                ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
            },
        });

        // Audit log - book updated
        if (userId && userEmail) {
            auditService.logUpdate(
                userId,
                userEmail,
                'Book',
                id,
                {
                    before,
                    after: {
                        title: updatedBook.title,
                        author: updatedBook.author,
                        description: updatedBook.description,
                    }
                }
            ).catch(err => console.error('[AUDIT]', err));
        }

        return updatedBook;
    }

    async delete(id: string, userId?: string, userEmail?: string) {
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) {
            throw new Error('Book not found');
        }

        // Check if user owns this book
        if (userId && book.userId !== userId) {
            throw new Error('Unauthorized: You can only delete your own books');
        }

        await prisma.book.delete({ where: { id } });

        // Audit log - book deleted
        if (userId && userEmail) {
            auditService.logDelete(
                userId,
                userEmail,
                'Book',
                id,
                { title: book.title, author: book.author }
            ).catch(err => console.error('[AUDIT]', err));
        }

        return { message: 'Book deleted successfully' };
    }

    async getStats(id: string): Promise<BookStats> {
        const book = await prisma.book.findUnique({
            where: { id },
            include: {
                chapters: {
                    include: {
                        speeches: true,
                    },
                },
                characters: true,
            },
        });

        if (!book) {
            throw new Error('Book not found');
        }

        const totalSpeeches = book.chapters.reduce(
            (sum: number, chapter: any) => sum + chapter.speeches.length,
            0
        );

        return {
            totalChapters: book.chapters.length,
            totalSpeeches,
            totalCharacters: book.characters.length,
        };
    }
}

export const booksService = new BooksService();
