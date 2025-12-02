"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voicesController = exports.VoicesController = void 0;
const tts_service_1 = require("../tts/tts.service");
class VoicesController {
    async listVoices(req, res) {
        try {
            const voices = await tts_service_1.ttsService.getAvailableVoices();
            res.json(voices);
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
