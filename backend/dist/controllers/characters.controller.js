"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.charactersController = exports.CharactersController = void 0;
const characters_service_1 = require("../services/characters.service");
class CharactersController {
    async getByBookId(req, res) {
        try {
            const { bookId } = req.params;
            const characters = await characters_service_1.charactersService.getByBookId(bookId);
            res.json(characters);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const character = await characters_service_1.charactersService.getById(id);
            res.json(character);
        }
        catch (error) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    async create(req, res) {
        try {
            const { bookId } = req.params;
            const character = await characters_service_1.charactersService.create({ ...req.body, bookId });
            res.status(201).json(character);
        }
        catch (error) {
            if (error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const character = await characters_service_1.charactersService.update(id, req.body);
            res.json(character);
        }
        catch (error) {
            if (error.message === 'Character not found') {
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
            const result = await characters_service_1.charactersService.delete(id);
            res.json(result);
        }
        catch (error) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
}
exports.CharactersController = CharactersController;
exports.charactersController = new CharactersController();
