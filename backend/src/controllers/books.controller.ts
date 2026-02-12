import { Request, Response } from 'express';
import { booksService } from '../services/books.service';

/**
 * Transform chapter data from database format to API format
 * This is a simplified version for book listings (doesn't calculate wordCount from speeches)
 */
function transformChapterSimple(chapter: any) {
    const { orderIndex, speeches, ...rest } = chapter;
    
    // If speeches are included, calculate counts
    const wordCount = speeches?.reduce((sum: number, speech: any) => {
        const words = speech.text?.split(/\s+/).filter(Boolean).length || 0;
        return sum + words;
    }, 0) || 0;
    
    return {
        ...rest,
        order: orderIndex,
        wordCount: speeches ? wordCount : 0,
        speechesCount: speeches?.length || 0,
    };
}

/**
 * Transform book data including nested chapters
 */
function transformBook(book: any) {
    if (!book) return book;
    
    const { chapters, ...rest } = book;
    
    return {
        ...rest,
        chapters: chapters?.map(transformChapterSimple) || [],
    };
}

export class BooksController {
    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const title = req.query.title as string;
            const author = req.query.author as string;
            const userId = (req as any).user?.userId;

            const result = await booksService.getAll(page, limit, title, author, userId);
            
            // Transform books with chapters
            const transformedData = result.data.map(transformBook);
            
            res.json({
                ...result,
                data: transformedData,
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch books',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const book = await booksService.getById(id);
            const transformed = transformBook(book);
            res.json(transformed);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to fetch book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            const book = await booksService.create({ ...req.body, userId });
            const transformed = transformBook(book);
            res.status(201).json(transformed);
        } catch (error) {
            if (error instanceof Error && (
                error.message.includes('Title') ||
                error.message.includes('Author')
            )) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to create book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user?.userId;
            const book = await booksService.update(id, req.body, userId);
            const transformed = transformBook(book);
            res.json(transformed);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else if (error instanceof Error && error.message === 'Unauthorized: You can only update your own books') {
                res.status(403).json({ error: error.message });
            } else if (error instanceof Error && (
                error.message.includes('Title') ||
                error.message.includes('Author')
            )) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to update book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user?.userId;
            const result = await booksService.delete(id, userId);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else if (error instanceof Error && error.message === 'Unauthorized: You can only delete your own books') {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to delete book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async getStats(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const stats = await booksService.getStats(id);
            res.json(stats);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to fetch book stats',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
}

export const booksController = new BooksController();
