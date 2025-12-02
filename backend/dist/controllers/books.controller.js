"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booksController = exports.BooksController = void 0;
const books_service_1 = require("../services/books.service");
class BooksController {
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const title = req.query.title;
            const author = req.query.author;
            const result = await books_service_1.booksService.getAll(page, limit, title, author);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to fetch books',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const book = await books_service_1.booksService.getById(id);
            res.json(book);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to fetch book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async create(req, res) {
        try {
            const book = await books_service_1.booksService.create(req.body);
            res.status(201).json(book);
        }
        catch (error) {
            if (error instanceof Error && (error.message.includes('Title') ||
                error.message.includes('Author'))) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to create book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const book = await books_service_1.booksService.update(id, req.body);
            res.json(book);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else if (error instanceof Error && (error.message.includes('Title') ||
                error.message.includes('Author'))) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to update book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await books_service_1.booksService.delete(id);
            res.json(result);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to delete book',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async getStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await books_service_1.booksService.getStats(id);
            res.json(stats);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({
                    error: 'Failed to fetch book stats',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
}
exports.BooksController = BooksController;
exports.booksController = new BooksController();
