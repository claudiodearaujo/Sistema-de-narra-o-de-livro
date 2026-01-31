"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaptersController = exports.ChaptersController = void 0;
const chapters_service_1 = require("../services/chapters.service");
class ChaptersController {
    async getByBookId(req, res) {
        try {
            const bookId = req.params.bookId;
            const chapters = await chapters_service_1.chaptersService.getByBookId(bookId);
            res.json(chapters);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to fetch chapters',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const chapter = await chapters_service_1.chaptersService.getById(id);
            res.json(chapter);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Chapter not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to fetch chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async create(req, res) {
        try {
            const bookId = req.params.bookId;
            const chapter = await chapters_service_1.chaptersService.create(bookId, req.body);
            res.status(201).json(chapter);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else if (error instanceof Error && error.message.includes('Title')) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to create chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
            const chapter = await chapters_service_1.chaptersService.update(id, req.body);
            res.json(chapter);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Chapter not found') {
                res.status(404).json({ error: error.message });
            }
            else if (error instanceof Error && error.message.includes('Title')) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to update chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async delete(req, res) {
        try {
            const id = req.params.id;
            const result = await chapters_service_1.chaptersService.delete(id);
            res.json(result);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Chapter not found') {
                res.status(404).json({ error: error.message });
            }
            else if (error instanceof Error && error.message.includes('Cannot delete')) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to delete chapter',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async reorder(req, res) {
        try {
            const bookId = req.params.bookId;
            const { orderedIds } = req.body;
            if (!Array.isArray(orderedIds)) {
                return res.status(400).json({ error: 'orderedIds must be an array' });
            }
            const result = await chapters_service_1.chaptersService.reorder(bookId, orderedIds);
            res.json(result);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else if (error instanceof Error && error.message.includes('Invalid chapter')) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to reorder chapters',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
}
exports.ChaptersController = ChaptersController;
exports.chaptersController = new ChaptersController();
