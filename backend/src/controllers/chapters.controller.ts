import { Request, Response } from 'express';
import { chaptersService } from '../services/chapters.service';

export class ChaptersController {
    async getByBookId(req: Request, res: Response) {
        try {
            const { bookId } = req.params;
            const chapters = await chaptersService.getByBookId(bookId);
            res.json(chapters);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch chapters',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const chapter = await chaptersService.getById(id);
            res.json(chapter);
        } catch (error) {
            if (error instanceof Error && error.message === 'Chapter not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to fetch chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { bookId } = req.params;
            const chapter = await chaptersService.create(bookId, req.body);
            res.status(201).json(chapter);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else if (error instanceof Error && error.message.includes('Title')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to create chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const chapter = await chaptersService.update(id, req.body);
            res.json(chapter);
        } catch (error) {
            if (error instanceof Error && error.message === 'Chapter not found') {
                res.status(404).json({ error: error.message });
            } else if (error instanceof Error && error.message.includes('Title')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to update chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await chaptersService.delete(id);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Chapter not found') {
                res.status(404).json({ error: error.message });
            } else if (error instanceof Error && error.message.includes('Cannot delete')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to delete chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    async reorder(req: Request, res: Response) {
        try {
            const { bookId } = req.params;
            const { orderedIds } = req.body;

            if (!Array.isArray(orderedIds)) {
                return res.status(400).json({ error: 'orderedIds must be an array' });
            }

            const result = await chaptersService.reorder(bookId, orderedIds);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else if (error instanceof Error && error.message.includes('Invalid chapter')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to reorder chapters',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
}

export const chaptersController = new ChaptersController();
