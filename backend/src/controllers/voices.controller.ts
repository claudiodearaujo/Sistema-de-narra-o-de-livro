import { Request, Response } from 'express';
import { ttsService } from '../tts/tts.service';

export class VoicesController {
    /**
     * Lista todas as 30 vozes fixas do Gemini TTS
     */
    async listVoices(req: Request, res: Response) {
        try {
            const voices = await ttsService.getAvailableVoices();
            res.json(voices);
        } catch (error: any) {
            console.error('Erro ao listar vozes:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Gera preview de áudio para uma voz específica
     */
    async previewVoice(req: Request, res: Response) {
        try {
            const { voiceId, text } = req.body;
            
            if (!voiceId) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }

            const sampleText = text || `Olá! Esta é uma prévia da voz ${voiceId}. Como você está hoje?`;
            
            console.log(`🎤 Gerando preview para voz: ${voiceId}`);
            
            const result = await ttsService.previewVoice(voiceId, sampleText);
            
            // Converter buffer para base64 para o frontend
            const audioBase64 = result.buffer.toString('base64');
            
            res.json({ 
                audioBase64,
                format: result.format,
                voiceId
            });
        } catch (error: any) {
            console.error('Erro ao gerar preview:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const voicesController = new VoicesController();
