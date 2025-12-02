import { Router } from 'express';
import { charactersController } from '../controllers/characters.controller';

const router = Router();

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
router.get('/books/:bookId/characters', charactersController.getByBookId);
router.post('/books/:bookId/characters', charactersController.create);

// Character-specific routes
router.get('/characters/:id', charactersController.getById);
router.put('/characters/:id', charactersController.update);
router.delete('/characters/:id', charactersController.delete);

export default router;
