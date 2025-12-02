"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booksService = exports.BooksService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class BooksService {
    async getAll(page = 1, limit = 10, title, author) {
        const skip = (page - 1) * limit;
        const where = {};
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
    async getById(id) {
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
    async create(data) {
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
    async update(id, data) {
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
    async delete(id) {
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) {
            throw new Error('Book not found');
        }
        await prisma.book.delete({ where: { id } });
        return { message: 'Book deleted successfully' };
    }
    async getStats(id) {
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
        const totalSpeeches = book.chapters.reduce((sum, chapter) => sum + chapter.speeches.length, 0);
        return {
            totalChapters: book.chapters.length,
            totalSpeeches,
            totalCharacters: book.characters.length,
        };
    }
}
exports.BooksService = BooksService;
exports.booksService = new BooksService();
