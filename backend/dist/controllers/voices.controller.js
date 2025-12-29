"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voicesController = exports.VoicesController = void 0;
const ai_1 = require("../ai");
class VoicesController {
    /**
     * Lista todas as 30 vozes fixas do Gemini TTS
     */
    async listVoices(req, res) {
        try {
            const voices = await ai_1.aiService.getAvailableVoices();
            res.json(voices);
        }
        catch (error) {
            console.error('Erro ao listar vozes:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Gera preview de áudio para uma voz específica
     */
    async previewVoice(req, res) {
        try {
            const { voiceId, text } = req.body;
            if (!voiceId) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }
            const sampleText = text || `Olá! Esta é uma prévia da voz ${voiceId}. Como você está hoje?`;
            console.log(`🎤 Gerando preview para voz: ${voiceId}`);
            const result = await ai_1.aiService.previewVoice({ voiceName: voiceId, sampleText });
            // Converter buffer para base64 para o frontend
            const audioBase64 = result.buffer.toString('base64');
            res.json({
                audioBase64,
                format: result.format,
                voiceId
            });
        }
        catch (error) {
            console.error('Erro ao gerar preview:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.VoicesController = VoicesController;
exports.voicesController = new VoicesController();
