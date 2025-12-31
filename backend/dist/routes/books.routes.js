"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const books_controller_1 = require("../controllers/books.controller");
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
const middleware_3 = require("../middleware");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
// Public routes (with optional auth for personalized data)
router.get('/', middleware_1.optionalAuth, (req, res) => books_controller_1.booksController.getAll(req, res));
router.get('/:id', middleware_1.optionalAuth, (req, res) => books_controller_1.booksController.getById(req, res));
router.get('/:id/stats', middleware_1.optionalAuth, (req, res) => books_controller_1.booksController.getStats(req, res));
// Protected routes - require authentication and WRITER role minimum
router.post('/', middleware_1.authenticate, middleware_2.requireWriter, (0, middleware_3.checkLimit)('maxBooks', async (req) => {
    return prisma_1.default.book.count({ where: { userId: req.user.userId } });
}), (req, res) => books_controller_1.booksController.create(req, res));
router.put('/:id', middleware_1.authenticate, middleware_2.requireWriter, (req, res) => books_controller_1.booksController.update(req, res));
router.delete('/:id', middleware_1.authenticate, middleware_2.requireWriter, (req, res) => books_controller_1.booksController.delete(req, res));
exports.default = router;
