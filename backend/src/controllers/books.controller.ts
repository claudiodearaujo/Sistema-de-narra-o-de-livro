import { Request, Response } from 'express';
import { booksService } from '../services/books.service';

export class BooksController {
    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const title = req.query.title as string;
            const author = req.query.author as string;

            const result = await booksService.getAll(page, limit, title, author);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch books',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const book = await booksService.getById(id);
            res.json(book);
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
            const book = await booksService.create(req.body);
            res.status(201).json(book);
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
            const { id } = req.params;
            const book = await booksService.update(id, req.body);
            res.json(book);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
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
            const { id } = req.params;
            const result = await booksService.delete(id);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
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
            const { id } = req.params;
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
