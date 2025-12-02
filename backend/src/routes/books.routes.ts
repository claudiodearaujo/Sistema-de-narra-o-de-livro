import { Router } from 'express';
import { booksController } from '../controllers/books.controller';

const router = Router();

router.get('/', (req, res) => booksController.getAll(req, res));
router.get('/:id', (req, res) => booksController.getById(req, res));
router.post('/', (req, res) => booksController.create(req, res));
router.put('/:id', (req, res) => booksController.update(req, res));
router.delete('/:id', (req, res) => booksController.delete(req, res));
router.get('/:id/stats', (req, res) => booksController.getStats(req, res));

export default router;
