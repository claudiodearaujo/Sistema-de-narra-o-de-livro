import { Router } from 'express';
import { chaptersController } from '../controllers/chapters.controller';

const router = Router();

// Book-related routes
router.get('/books/:bookId/chapters', (req, res) => chaptersController.getByBookId(req, res));
router.post('/books/:bookId/chapters', (req, res) => chaptersController.create(req, res));
router.put('/books/:bookId/chapters/reorder', (req, res) => chaptersController.reorder(req, res));

// Chapter-specific routes
router.get('/chapters/:id', (req, res) => chaptersController.getById(req, res));
router.put('/chapters/:id', (req, res) => chaptersController.update(req, res));
router.delete('/chapters/:id', (req, res) => chaptersController.delete(req, res));

export default router;
