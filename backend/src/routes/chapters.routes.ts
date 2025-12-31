import { Router } from 'express';
import { chaptersController } from '../controllers/chapters.controller';
import { authenticate, optionalAuth, requireWriter } from '../middleware';

const router = Router();

// Book-related routes
router.get('/books/:bookId/chapters', optionalAuth, (req, res) => chaptersController.getByBookId(req, res));
router.post('/books/:bookId/chapters', authenticate, requireWriter, (req, res) => chaptersController.create(req, res));
router.put('/books/:bookId/chapters/reorder', authenticate, requireWriter, (req, res) => chaptersController.reorder(req, res));

// Chapter-specific routes
router.get('/chapters/:id', optionalAuth, (req, res) => chaptersController.getById(req, res));
router.put('/chapters/:id', authenticate, requireWriter, (req, res) => chaptersController.update(req, res));
router.delete('/chapters/:id', authenticate, requireWriter, (req, res) => chaptersController.delete(req, res));

export default router;
