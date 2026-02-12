import { Request, Response } from 'express';
import { chaptersService } from '../services/chapters.service';
import { calculateWordCountFromSpeeches } from '../utils/transform.utils';

/**
 * Transform chapter data from database format to API format
 * Maps orderIndex -> order and adds computed fields
 */
function transformChapter(chapter: any) {
    const { orderIndex, speeches, _count, ...rest } = chapter;
    
    // Calculate word count from speeches
    const wordCount = calculateWordCountFromSpeeches(speeches || []);
    
    // Get speech count from _count if available, otherwise from speeches array
    const speechesCount = _count?.speeches ?? speeches?.length ?? 0;
    
    return {
        ...rest,
        order: orderIndex,
        wordCount,
        speechesCount,
    };
}

export class ChaptersController {
    async getByBookId(req: Request, res: Response) {
        try {
            const bookId = req.params.bookId as string;
            console.log('[ChaptersController] getByBookId called with bookId:', bookId);
            console.log('[ChaptersController] Request headers:', req.headers);
            console.log('[ChaptersController] Request user:', req.user);
            
            const chapters = await chaptersService.getByBookId(bookId);
            console.log('[ChaptersController] Found chapters:', chapters.length);
            
            const transformed = chapters.map(transformChapter);
            console.log('[ChaptersController] Transformed chapters:', transformed.length);
            
            res.json(transformed);
        } catch (error) {
            console.error('[ChaptersController] Error in getByBookId:', error);
            res.status(500).json({
                error: 'Failed to fetch chapters',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const chapter = await chaptersService.getById(id);
            const transformed = transformChapter(chapter);
            res.json(transformed);
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
            const bookId = req.params.bookId as string;
            const chapter = await chaptersService.create(bookId, req.body);
            // Return transformed chapter (speeches will be empty for new chapters)
            const transformed = transformChapter({ ...chapter, speeches: [] });
            res.status(201).json(transformed);
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
            const id = req.params.id as string;
            const chapter = await chaptersService.update(id, req.body);
            // Get chapter with speeches for accurate counts
            const fullChapter = await chaptersService.getById(id);
            const transformed = transformChapter(fullChapter);
            res.json(transformed);
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
            const id = req.params.id as string;
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
            const bookId = req.params.bookId as string;
            // Accept both chapterIds (from frontend) and orderedIds for compatibility
            const { orderedIds, chapterIds } = req.body;
            const ids = orderedIds || chapterIds;

            if (!Array.isArray(ids)) {
                return res.status(400).json({ error: 'Either chapterIds or orderedIds array is required' });
            }

            const result = await chaptersService.reorder(bookId, ids);
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
