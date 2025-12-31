"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaptersService = exports.ChaptersService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const achievement_service_1 = require("./achievement.service");
class ChaptersService {
    async getByBookId(bookId) {
        return await prisma_1.default.chapter.findMany({
            where: { bookId },
            orderBy: { orderIndex: 'asc' },
            include: {
                speeches: true,
            },
        });
    }
    async getById(id) {
        const chapter = await prisma_1.default.chapter.findUnique({
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
    async create(bookId, data) {
        // Validation
        if (!data.title || data.title.trim().length === 0) {
            throw new Error('Title is required');
        }
        const book = await prisma_1.default.book.findUnique({ where: { id: bookId } });
        if (!book) {
            throw new Error('Book not found');
        }
        // Get max order index
        const lastChapter = await prisma_1.default.chapter.findFirst({
            where: { bookId },
            orderBy: { orderIndex: 'desc' },
        });
        const newOrderIndex = lastChapter ? lastChapter.orderIndex + 1 : 1;
        return await prisma_1.default.chapter.create({
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
                        await achievement_service_1.achievementService.checkAndUnlock(book.userId, 'chapters_count');
                    }
                    catch (err) {
                        console.error('Failed to check achievements:', err);
                    }
                });
            }
            return chapter;
        });
    }
    async update(id, data) {
        if (data.title !== undefined && data.title.trim().length === 0) {
            throw new Error('Title is required');
        }
        const chapter = await prisma_1.default.chapter.findUnique({ where: { id } });
        if (!chapter) {
            throw new Error('Chapter not found');
        }
        return await prisma_1.default.chapter.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title.trim() }),
            },
        });
    }
    async delete(id) {
        const chapter = await prisma_1.default.chapter.findUnique({
            where: { id },
            include: { narration: true }
        });
        if (!chapter) {
            throw new Error('Chapter not found');
        }
        if (chapter.narration && chapter.narration.status === 'completed') {
            throw new Error('Cannot delete chapter with completed narration');
        }
        await prisma_1.default.chapter.delete({ where: { id } });
        return { message: 'Chapter deleted successfully' };
    }
    async reorder(bookId, orderedIds) {
        const book = await prisma_1.default.book.findUnique({ where: { id: bookId } });
        if (!book) {
            throw new Error('Book not found');
        }
        // Verify all chapters belong to the book
        const chapters = await prisma_1.default.chapter.findMany({
            where: {
                bookId,
                id: { in: orderedIds }
            }
        });
        if (chapters.length !== orderedIds.length) {
            throw new Error('Invalid chapter IDs provided');
        }
        // Update order in transaction
        await prisma_1.default.$transaction(orderedIds.map((id, index) => prisma_1.default.chapter.update({
            where: { id },
            data: { orderIndex: index + 1 }
        })));
        return { message: 'Chapters reordered successfully' };
    }
}
exports.ChaptersService = ChaptersService;
exports.chaptersService = new ChaptersService();
