"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechesController = exports.SpeechesController = void 0;
const speeches_service_1 = require("../services/speeches.service");
const tts_service_1 = require("../tts/tts.service");
const speech_assist_service_1 = require("../services/speech-assist.service");
class SpeechesController {
    async getByChapterId(req, res) {
        try {
            const { chapterId } = req.params;
            const speeches = await speeches_service_1.speechesService.getByChapterId(chapterId);
            res.json(speeches);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const speech = await speeches_service_1.speechesService.getById(id);
            res.json(speech);
        }
        catch (error) {
            if (error.message === 'Speech not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    async create(req, res) {
        try {
            const { chapterId } = req.params;
            const speech = await speeches_service_1.speechesService.create({ ...req.body, chapterId });
            res.status(201).json(speech);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const speech = await speeches_service_1.speechesService.update(id, req.body);
            res.json(speech);
        }
        catch (error) {
            if (error.message === 'Speech not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await speeches_service_1.speechesService.delete(id);
            res.json(result);
        }
        catch (error) {
            if (error.message === 'Speech not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    async reorder(req, res) {
        try {
            const { chapterId } = req.params;
            const { orderedIds } = req.body;
            if (!orderedIds || !Array.isArray(orderedIds)) {
                return res.status(400).json({ error: 'orderedIds array is required' });
            }
            const result = await speeches_service_1.speechesService.reorder(chapterId, orderedIds);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async bulkCreate(req, res) {
        try {
            const { chapterId } = req.params;
            const { text, strategy, defaultCharacterId } = req.body;
            if (!text || !strategy || !defaultCharacterId) {
                return res.status(400).json({ error: 'Text, strategy, and defaultCharacterId are required' });
            }
            const result = await speeches_service_1.speechesService.bulkCreate(chapterId, text, strategy, defaultCharacterId);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async validateSSML(req, res) {
        try {
            const { ssmlText } = req.body;
            if (!ssmlText) {
                return res.status(400).json({ error: 'ssmlText is required' });
            }
            const result = await tts_service_1.ttsService.validateSSML(ssmlText);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async spellCheck(req, res) {
        try {
            const { text, language } = req.body;
            const result = await speech_assist_service_1.speechAssistService.spellCheck(text, language);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async suggestImprovements(req, res) {
        try {
            const result = await speech_assist_service_1.speechAssistService.suggestImprovements(req.body);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async enrichWithCharacter(req, res) {
        try {
            const result = await speech_assist_service_1.speechAssistService.enrichWithCharacterDetails(req.body);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async generateEmotionImage(req, res) {
        try {
            const result = await speech_assist_service_1.speechAssistService.generateEmotionImage(req.body);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.SpeechesController = SpeechesController;
exports.speechesController = new SpeechesController();
