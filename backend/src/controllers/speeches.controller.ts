import { Request, Response } from 'express';
import { speechesService } from '../services/speeches.service';
import { ttsService } from '../tts/tts.service';
import { speechAssistService } from '../services/speech-assist.service';

export class SpeechesController {
    async getByChapterId(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const speeches = await speechesService.getByChapterId(chapterId);
            res.json(speeches);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const speech = await speechesService.getById(id);
            res.json(speech);
        } catch (error: any) {
            if (error.message === 'Speech not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const speech = await speechesService.create({ ...req.body, chapterId });
            res.status(201).json(speech);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const speech = await speechesService.update(id, req.body);
            res.json(speech);
        } catch (error: any) {
            if (error.message === 'Speech not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await speechesService.delete(id);
            res.json(result);
        } catch (error: any) {
            if (error.message === 'Speech not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async reorder(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const { orderedIds } = req.body;
            if (!orderedIds || !Array.isArray(orderedIds)) {
                return res.status(400).json({ error: 'orderedIds array is required' });
            }
            const result = await speechesService.reorder(chapterId, orderedIds);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async bulkCreate(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const { text, strategy, defaultCharacterId } = req.body;

            if (!text || !strategy || !defaultCharacterId) {
                return res.status(400).json({ error: 'Text, strategy, and defaultCharacterId are required' });
            }

            const result = await speechesService.bulkCreate(chapterId, text, strategy, defaultCharacterId);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async validateSSML(req: Request, res: Response) {
        try {
            const { ssmlText } = req.body;
            if (!ssmlText) {
                return res.status(400).json({ error: 'ssmlText is required' });
            }
            const result = await ttsService.validateSSML(ssmlText);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async spellCheck(req: Request, res: Response) {
        try {
            const { text, language } = req.body;
            const result = await speechAssistService.spellCheck(text, language);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async suggestImprovements(req: Request, res: Response) {
        try {
            const result = await speechAssistService.suggestImprovements(req.body);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async enrichWithCharacter(req: Request, res: Response) {
        try {
            const result = await speechAssistService.enrichWithCharacterDetails(req.body);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async generateEmotionImage(req: Request, res: Response) {
        try {
            const result = await speechAssistService.generateEmotionImage(req.body);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const speechesController = new SpeechesController();
