"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const characters_controller_1 = require("../controllers/characters.controller");
const router = (0, express_1.Router)();
// Routes relative to /api/books/:bookId/characters or /api/characters
// We need to handle both structures or be careful with how we mount them.
// The plan says:
// GET /api/books/:bookId/characters
// POST /api/books/:bookId/characters
// GET /api/characters/:id
// PUT /api/characters/:id
// DELETE /api/characters/:id
// To handle this cleanly, we might mount this router at /api
// and define full paths, or split it.
// Let's define the specific paths here to match the plan.
// Book-related character routes
router.get('/books/:bookId/characters', characters_controller_1.charactersController.getByBookId);
router.post('/books/:bookId/characters', characters_controller_1.charactersController.create);
// Character-specific routes
router.get('/characters', characters_controller_1.charactersController.getAll);
router.get('/characters/:id', characters_controller_1.charactersController.getById);
router.put('/characters/:id', characters_controller_1.charactersController.update);
router.delete('/characters/:id', characters_controller_1.charactersController.delete);
exports.default = router;
