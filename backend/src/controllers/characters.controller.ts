import { Request, Response } from 'express';
import { charactersService } from '../services/characters.service';

export class CharactersController {
    async getByBookId(req: Request, res: Response) {
        try {
            const { bookId } = req.params;
            console.log(`[Backend] Fetching characters for bookId: ${bookId}`);
            
            const characters = await charactersService.getByBookId(bookId);
            console.log(`[Backend] Found ${characters.length} characters`);
            
            res.json(characters);
        } catch (error: any) {
            console.error('[Backend] Error fetching characters:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            console.log('[Backend] Fetching all characters');
            const characters = await charactersService.getAll();
            console.log(`[Backend] Found ${characters.length} characters`);
            res.json(characters);
        } catch (error: any) {
            console.error('[Backend] Error fetching all characters:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const character = await charactersService.getById(id);
            res.json(character);
        } catch (error: any) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { bookId } = req.params;
            const character = await charactersService.create({ ...req.body, bookId });
            res.status(201).json(character);
        } catch (error: any) {
            if (error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const character = await charactersService.update(id, req.body);
            res.json(character);
        } catch (error: any) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await charactersService.delete(id);
            res.json(result);
        } catch (error: any) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
}

export const charactersController = new CharactersController();
