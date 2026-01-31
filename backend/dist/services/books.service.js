"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.booksService = exports.BooksService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const achievement_service_1 = require("./achievement.service");
const audit_service_1 = require("./audit.service");
class BooksService {
    async getAll(page = 1, limit = 10, title, author, userId) {
        const skip = (page - 1) * limit;
        const where = {};
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
            prisma_1.default.book.findMany({
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
            prisma_1.default.book.count({ where }),
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
        const book = await prisma_1.default.book.findUnique({
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
        const book = await prisma_1.default.book.create({
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
            audit_service_1.auditService.logCreate(data.userId, data.userEmail, 'Book', book.id, { title: book.title, author: book.author }).catch(err => console.error('[AUDIT]', err));
        }
        // Sprint 10: Check achievements for books created
        if (data.userId) {
            setImmediate(async () => {
                try {
                    await achievement_service_1.achievementService.checkAndUnlock(data.userId, 'books_count');
                }
                catch (err) {
                    console.error('Failed to check achievements:', err);
                }
            });
        }
        return book;
    }
    async update(id, data, userId, userEmail) {
        // Validation
        if (data.title !== undefined && data.title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters long');
        }
        if (data.author !== undefined && data.author.trim().length === 0) {
            throw new Error('Author is required');
        }
        const book = await prisma_1.default.book.findUnique({ where: { id } });
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
        const updatedBook = await prisma_1.default.book.update({
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
            audit_service_1.auditService.logUpdate(userId, userEmail, 'Book', id, {
                before,
                after: {
                    title: updatedBook.title,
                    author: updatedBook.author,
                    description: updatedBook.description,
                }
            }).catch(err => console.error('[AUDIT]', err));
        }
        return updatedBook;
    }
    async delete(id, userId, userEmail) {
        const book = await prisma_1.default.book.findUnique({ where: { id } });
        if (!book) {
            throw new Error('Book not found');
        }
        // Check if user owns this book
        if (userId && book.userId !== userId) {
            throw new Error('Unauthorized: You can only delete your own books');
        }
        await prisma_1.default.book.delete({ where: { id } });
        // Audit log - book deleted
        if (userId && userEmail) {
            audit_service_1.auditService.logDelete(userId, userEmail, 'Book', id, { title: book.title, author: book.author }).catch(err => console.error('[AUDIT]', err));
        }
        return { message: 'Book deleted successfully' };
    }
    async getStats(id) {
        const book = await prisma_1.default.book.findUnique({
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
