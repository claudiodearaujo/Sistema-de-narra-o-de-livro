"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chapters_controller_1 = require("../controllers/chapters.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Book-related routes
router.get('/books/:bookId/chapters', middleware_1.optionalAuth, (req, res) => chapters_controller_1.chaptersController.getByBookId(req, res));
router.post('/books/:bookId/chapters', middleware_1.authenticate, middleware_1.requireWriter, (req, res) => chapters_controller_1.chaptersController.create(req, res));
router.put('/books/:bookId/chapters/reorder', middleware_1.authenticate, middleware_1.requireWriter, (req, res) => chapters_controller_1.chaptersController.reorder(req, res));
// Chapter-specific routes
router.get('/chapters/:id', middleware_1.optionalAuth, (req, res) => chapters_controller_1.chaptersController.getById(req, res));
router.put('/chapters/:id', middleware_1.authenticate, middleware_1.requireWriter, (req, res) => chapters_controller_1.chaptersController.update(req, res));
router.delete('/chapters/:id', middleware_1.authenticate, middleware_1.requireWriter, (req, res) => chapters_controller_1.chaptersController.delete(req, res));
exports.default = router;
