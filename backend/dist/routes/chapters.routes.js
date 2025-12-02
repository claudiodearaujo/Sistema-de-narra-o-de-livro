"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chapters_controller_1 = require("../controllers/chapters.controller");
const router = (0, express_1.Router)();
// Book-related routes
router.get('/books/:bookId/chapters', (req, res) => chapters_controller_1.chaptersController.getByBookId(req, res));
router.post('/books/:bookId/chapters', (req, res) => chapters_controller_1.chaptersController.create(req, res));
router.put('/books/:bookId/chapters/reorder', (req, res) => chapters_controller_1.chaptersController.reorder(req, res));
// Chapter-specific routes
router.get('/chapters/:id', (req, res) => chapters_controller_1.chaptersController.getById(req, res));
router.put('/chapters/:id', (req, res) => chapters_controller_1.chaptersController.update(req, res));
router.delete('/chapters/:id', (req, res) => chapters_controller_1.chaptersController.delete(req, res));
exports.default = router;
