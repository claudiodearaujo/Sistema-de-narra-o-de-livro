"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const characters_controller_1 = require("../controllers/characters.controller");
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
// Book-related character routes
router.get('/books/:bookId/characters', middleware_1.optionalAuth, characters_controller_1.charactersController.getByBookId);
router.post('/books/:bookId/characters', middleware_1.authenticate, middleware_1.requireWriter, (0, middleware_2.checkLimit)('maxCharactersPerBook', async (req) => {
    const bookId = req.params.bookId;
    return prisma_1.default.character.count({ where: { bookId } });
}), characters_controller_1.charactersController.create);
// Character-specific routes
router.get('/characters', middleware_1.optionalAuth, characters_controller_1.charactersController.getAll);
router.get('/characters/:id', middleware_1.optionalAuth, characters_controller_1.charactersController.getById);
router.put('/characters/:id', middleware_1.authenticate, middleware_1.requireWriter, characters_controller_1.charactersController.update);
router.delete('/characters/:id', middleware_1.authenticate, middleware_1.requireWriter, characters_controller_1.charactersController.delete);
// Preview audio routes
router.get('/characters/:id/preview-audio', middleware_1.optionalAuth, characters_controller_1.charactersController.getPreviewAudio);
router.post('/characters/:id/preview-audio', middleware_1.authenticate, middleware_1.requireWriter, characters_controller_1.charactersController.generatePreviewAudio);
exports.default = router;
