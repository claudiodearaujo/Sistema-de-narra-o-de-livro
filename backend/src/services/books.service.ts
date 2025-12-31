import prisma from '../lib/prisma';

export interface CreateBookDto {
    title: string;
    author: string;
    description?: string;
    coverUrl?: string;
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
    async getAll(page: number = 1, limit: number = 10, title?: string, author?: string) {
        const skip = (page - 1) * limit;

        const where: any = {};
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

        return await prisma.book.create({
            data: {
                title: data.title.trim(),
                author: data.author.trim(),
                description: data.description?.trim(),
                coverUrl: data.coverUrl,
            },
        });
    }

    async update(id: string, data: UpdateBookDto) {
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

        return await prisma.book.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title.trim() }),
                ...(data.author && { author: data.author.trim() }),
                ...(data.description !== undefined && { description: data.description?.trim() }),
                ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
            },
        });
    }

    async delete(id: string) {
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) {
            throw new Error('Book not found');
        }

        await prisma.book.delete({ where: { id } });
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
