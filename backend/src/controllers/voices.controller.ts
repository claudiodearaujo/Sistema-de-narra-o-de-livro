import { Request, Response } from 'express';
import { aiService } from '../ai';
import fs from 'fs';
import path from 'path';

export class VoicesController {
    /**
     * Lista todas as 30 vozes fixas do Gemini TTS
     */
    async listVoices(req: Request, res: Response) {
        try {
            const voices = await aiService.getAvailableVoices();
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
            
            const result = await aiService.previewVoice({ voiceName: voiceId, sampleText });

            const previewsDir = path.join(__dirname, '../../uploads/previews');
            if (!fs.existsSync(previewsDir)) {
                fs.mkdirSync(previewsDir, { recursive: true });
            }

            const fileName = `voice_preview_${voiceId}_${Date.now()}.${result.format}`;
            const filePath = path.join(previewsDir, fileName);
            fs.writeFileSync(filePath, result.buffer);
            const audioUrl = `/uploads/previews/${fileName}`;
            
            // Converter buffer para base64 para o frontend
            const audioBase64 = result.buffer.toString('base64');
            
            res.json({ 
                audioBase64,
                audioUrl,
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
