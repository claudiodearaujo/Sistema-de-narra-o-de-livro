import { Request, Response } from 'express';
import { ttsService } from '../tts/tts.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VoicesController {
    async listVoices(req: Request, res: Response) {
        try {
            // Buscar vozes do Gemini
            const geminiVoices = await ttsService.getAvailableVoices();

            // Buscar vozes customizadas do banco
            const customVoices = await prisma.customVoice.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });

            // Converter vozes customizadas para o formato padrão
            const formattedCustomVoices = customVoices.map(v => ({
                id: v.voiceId,
                name: v.name,
                languageCode: v.languageCode,
                gender: v.gender,
                provider: v.provider,
                description: v.description || undefined
            }));

            // Mesclar as duas listas
            const allVoices = [...geminiVoices, ...formattedCustomVoices];

            res.json(allVoices);
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
