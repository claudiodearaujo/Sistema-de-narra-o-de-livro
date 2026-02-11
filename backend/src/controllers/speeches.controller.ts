import { Request, Response } from 'express';
import { speechesService } from '../services/speeches.service';
import { aiService } from '../ai';
import prisma from '../lib/prisma';

export class SpeechesController {
    async getByChapterId(req: Request, res: Response) {
        try {
            const chapterId = req.params.chapterId as string;
            const speeches = await speechesService.getByChapterId(chapterId);
            res.json(speeches);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
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
            const chapterId = req.params.chapterId as string;
            const speech = await speechesService.create({ ...req.body, chapterId });
            res.status(201).json(speech);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
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
            const id = req.params.id as string;
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
            const chapterId = req.params.chapterId as string;
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
            const chapterId = req.params.chapterId as string;
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
            const result = await aiService.validateSSML(ssmlText);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async spellCheck(req: Request, res: Response) {
        try {
            const { text, language } = req.body;
            const result = await aiService.spellCheck({ text, language });
            res.json(result);
        } catch (error: any) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            } else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }

    async suggestImprovements(req: Request, res: Response) {
        try {
            const result = await aiService.suggestImprovements(req.body);
            res.json(result);
        } catch (error: any) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            } else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }

    async enrichWithCharacter(req: Request, res: Response) {
        try {
            const result = await aiService.enrichWithCharacterDetails(req.body);
            res.json(result);
        } catch (error: any) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            } else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }

    async generateEmotionImage(req: Request, res: Response) {
        try {
            const result = await aiService.generateEmotionImage(req.body);
            res.json(result);
        } catch (error: any) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            } else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }

    /**
     * POST /speeches/:id/audio
     * Generate TTS audio for a single speech
     */
    async generateAudio(req: Request, res: Response) {
        try {
            const speechId = req.params.id as string;
            
            // Get speech with character info
            const speech = await speechesService.getById(speechId);
            if (!speech) {
                return res.status(404).json({ error: 'Speech not found' });
            }

            // Get character to get voice info
            const character = await prisma.character.findUnique({
                where: { id: speech.characterId }
            });

            if (!character) {
                return res.status(404).json({ error: 'Character not found' });
            }

            // Use SSML text if available, otherwise plain text
            const textToNarrate = speech.ssmlText || speech.text;

            // Generate audio using AI service
            const audioResult = await aiService.generateAudio({
                text: textToNarrate,
                voiceName: character.voiceId,
                useSSML: !!speech.ssmlText,
                outputFormat: 'mp3'
            });

            // Update speech with audio URL and duration
            const updatedSpeech = await speechesService.update(speechId, {
                audioUrl: audioResult.audioUrl,
                audioDurationMs: audioResult.durationMs
            });

            res.json({
                success: true,
                speech: updatedSpeech,
                audioUrl: audioResult.audioUrl,
                durationMs: audioResult.durationMs
            });
        } catch (error: any) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            } else if (errorMessage.includes('insuficiente')) {
                res.status(402).json({ error: errorMessage });
            } else {
                res.status(500).json({ error: errorMessage });
            }
        }
    }
}

export const speechesController = new SpeechesController();
