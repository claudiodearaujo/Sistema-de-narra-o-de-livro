"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voicesController = exports.VoicesController = void 0;
const tts_service_1 = require("../tts/tts.service");
class VoicesController {
    /**
     * Lista todas as 30 vozes fixas do Gemini TTS
     */
    async listVoices(req, res) {
        try {
            const voices = await tts_service_1.ttsService.getAvailableVoices();
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
            const sampleText =  `Olá! Esta é uma prévia da voz ${text}. Como você está hoje?`;
            console.log(`🎤 Gerando preview para voz: ${voiceId}`);
            const result = await tts_service_1.ttsService.previewVoice(voiceId, sampleText);
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
