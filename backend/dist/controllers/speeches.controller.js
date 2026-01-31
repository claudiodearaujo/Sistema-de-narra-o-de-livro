"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechesController = exports.SpeechesController = void 0;
const speeches_service_1 = require("../services/speeches.service");
const ai_1 = require("../ai");
class SpeechesController {
    async getByChapterId(req, res) {
        try {
            const chapterId = req.params.chapterId;
            const speeches = await speeches_service_1.speechesService.getByChapterId(chapterId);
            res.json(speeches);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
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
            const chapterId = req.params.chapterId;
            const speech = await speeches_service_1.speechesService.create({ ...req.body, chapterId });
            res.status(201).json(speech);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
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
            const id = req.params.id;
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
            const chapterId = req.params.chapterId;
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
            const chapterId = req.params.chapterId;
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
            const result = await ai_1.aiService.validateSSML(ssmlText);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async spellCheck(req, res) {
        try {
            const { text, language } = req.body;
            const result = await ai_1.aiService.spellCheck({ text, language });
            res.json(result);
        }
        catch (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            }
            else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }
    async suggestImprovements(req, res) {
        try {
            const result = await ai_1.aiService.suggestImprovements(req.body);
            res.json(result);
        }
        catch (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            }
            else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }
    async enrichWithCharacter(req, res) {
        try {
            const result = await ai_1.aiService.enrichWithCharacterDetails(req.body);
            res.json(result);
        }
        catch (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            }
            else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }
    async generateEmotionImage(req, res) {
        try {
            const result = await ai_1.aiService.generateEmotionImage(req.body);
            res.json(result);
        }
        catch (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('quota')) {
                res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
            }
            else {
                res.status(400).json({ error: errorMessage });
            }
        }
    }
}
exports.SpeechesController = SpeechesController;
exports.speechesController = new SpeechesController();
