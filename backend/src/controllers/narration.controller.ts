import { Request, Response } from 'express';
import { narrationService } from '../services/narration.service';

export class NarrationController {
    async startNarration(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const result = await narrationService.startNarration(chapterId);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getNarrationStatus(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const status = await narrationService.getNarrationStatus(chapterId);
            res.json(status);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async cancelNarration(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const result = await narrationService.cancelNarration(chapterId);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const narrationController = new NarrationController();
