import { Router } from 'express';
import { booksController } from '../controllers/books.controller';
import { authenticate, optionalAuth } from '../middleware';
import { requireMinimumRole, requireWriter } from '../middleware';
import { checkLimit } from '../middleware';
import prisma from '../lib/prisma';

const router = Router();

// List books - require authentication to show only user's books
router.get('/', authenticate, (req, res) => booksController.getAll(req, res));

// Public routes for viewing books
router.get('/:id', optionalAuth, (req, res) => booksController.getById(req, res));
router.get('/:id/stats', optionalAuth, (req, res) => booksController.getStats(req, res));

// Protected routes - require authentication and WRITER role minimum
router.post('/', 
  authenticate, 
  requireWriter,
  checkLimit('maxBooks', async (req) => {
    return prisma.book.count({ where: { userId: req.user!.userId } });
  }),
  (req, res) => booksController.create(req, res)
);

router.put('/:id', authenticate, requireWriter, (req, res) => booksController.update(req, res));
router.delete('/:id', authenticate, requireWriter, (req, res) => booksController.delete(req, res));

export default router;
