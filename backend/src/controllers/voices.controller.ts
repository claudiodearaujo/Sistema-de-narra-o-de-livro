import { Request, Response } from 'express';
import { ttsService } from '../tts/tts.service';

export class VoicesController {
    async listVoices(req: Request, res: Response) {
        try {
            const voices = await ttsService.getAvailableVoices();
            res.json(voices);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async previewVoice(req: Request, res: Response) {
        try {
            const { voiceId, text } = req.body;
            if (!voiceId || !text) {
                return res.status(400).json({ error: 'Voice ID and text are required' });
            }
            const result = await ttsService.previewVoice(voiceId, text);
            // Convert buffer to base64 for frontend
            const audioBase64 = result.buffer.toString('base64');
            res.json({ audioBase64 });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const voicesController = new VoicesController();
