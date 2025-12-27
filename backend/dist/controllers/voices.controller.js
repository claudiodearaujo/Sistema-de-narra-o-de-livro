"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voicesController = exports.VoicesController = void 0;
const tts_service_1 = require("../tts/tts.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class VoicesController {
    async listVoices(req, res) {
        try {
            // Buscar vozes do Gemini
            const geminiVoices = await tts_service_1.ttsService.getAvailableVoices();
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async previewVoice(req, res) {
        try {
            const { voiceId, text } = req.body;
            if (!voiceId || !text) {
                return res.status(400).json({ error: 'Voice ID and text are required' });
            }
            const result = await tts_service_1.ttsService.previewVoice(voiceId, text);
            // Convert buffer to base64 for frontend
            const audioBase64 = result.buffer.toString('base64');
            res.json({ audioBase64 });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.VoicesController = VoicesController;
exports.voicesController = new VoicesController();
