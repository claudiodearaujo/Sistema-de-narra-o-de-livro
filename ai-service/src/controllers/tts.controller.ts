import { Request, Response } from 'express';
import { ttsService } from '../services/tts.service';
import { aiFactory } from '../ai/ai.factory';

class TTSController {
    /**
     * POST /api/tts/generate
     * Generate audio from text
     */
    async generate(req: Request, res: Response) {
        try {
            const { text, voiceId, outputFormat, provider, useCache } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Text is required' });
            }

            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'VoiceId is required' });
            }

            const result = await ttsService.generate(
                { text, voiceId, outputFormat, provider, useCache },
                req.auth!.userId,
                req.auth!.clientId
            );

            res.json(result);
        } catch (error: any) {
            console.error('TTS generate error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/tts/preview
     * Generate voice preview
     */
    async preview(req: Request, res: Response) {
        try {
            const { voiceId, sampleText, provider } = req.body;

            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'VoiceId is required' });
            }

            const result = await ttsService.preview(
                { voiceId, sampleText, provider },
                req.auth!.userId,
                req.auth!.clientId
            );

            res.json(result);
        } catch (error: any) {
            console.error('TTS preview error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/tts/voices
     * List available voices
     */
    async listVoices(req: Request, res: Response) {
        try {
            const provider = req.query.provider as string | undefined;

            const result = await ttsService.listVoices(
                provider,
                req.auth?.userId,
                req.auth?.clientId
            );

            res.json(result);
        } catch (error: any) {
            console.error('List voices error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/tts/batch
     * Generate audio for multiple items
     */
    async batch(req: Request, res: Response) {
        try {
            const { items, provider } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Items array is required' });
            }

            if (items.length > 100) {
                return res.status(400).json({ error: 'Maximum 100 items per batch' });
            }

            // Validate each item
            for (const item of items) {
                if (!item.id || !item.text || !item.voiceId) {
                    return res.status(400).json({
                        error: 'Each item must have id, text, and voiceId',
                    });
                }
            }

            const results = await ttsService.generateBatch(
                items,
                req.auth!.userId,
                req.auth!.clientId,
                provider
            );

            const successCount = results.filter(r => r.success).length;
            const failedCount = results.filter(r => !r.success).length;

            res.json({
                totalItems: items.length,
                successCount,
                failedCount,
                results,
            });
        } catch (error: any) {
            console.error('TTS batch error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/tts/providers
     * Get available TTS providers
     */
    async getProviders(req: Request, res: Response) {
        try {
            const info = aiFactory.getProviderInfo();
            res.json({ tts: info.tts });
        } catch (error: any) {
            console.error('Get providers error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const ttsController = new TTSController();
