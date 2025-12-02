"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrationController = exports.NarrationController = void 0;
const narration_service_1 = require("../services/narration.service");
class NarrationController {
    async startNarration(req, res) {
        try {
            const { chapterId } = req.params;
            const result = await narration_service_1.narrationService.startNarration(chapterId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getNarrationStatus(req, res) {
        try {
            const { chapterId } = req.params;
            const status = await narration_service_1.narrationService.getNarrationStatus(chapterId);
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async cancelNarration(req, res) {
        try {
            const { chapterId } = req.params;
            const result = await narration_service_1.narrationService.cancelNarration(chapterId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.NarrationController = NarrationController;
exports.narrationController = new NarrationController();
