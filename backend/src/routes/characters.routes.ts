import { Router } from 'express';
import { charactersController } from '../controllers/characters.controller';
import { authenticate, optionalAuth, requireWriter } from '../middleware';
import { checkLimit } from '../middleware';
import prisma from '../lib/prisma';

const router = Router();

// Book-related character routes
router.get('/books/:bookId/characters', optionalAuth, charactersController.getByBookId);
router.post('/books/:bookId/characters', 
  authenticate, 
  requireWriter,
  checkLimit('maxCharactersPerBook', async (req) => {
    const bookId = req.params.bookId as string;
    return prisma.character.count({ where: { bookId } });
  }),
  charactersController.create
);

// Character-specific routes
router.get('/characters', optionalAuth, charactersController.getAll);
router.get('/characters/:id', optionalAuth, charactersController.getById);
router.put('/characters/:id', authenticate, requireWriter, charactersController.update);
router.delete('/characters/:id', authenticate, requireWriter, charactersController.delete);

// Preview audio routes
router.get('/characters/:id/preview-audio', optionalAuth, charactersController.getPreviewAudio);
router.post('/characters/:id/preview-audio', authenticate, requireWriter, charactersController.generatePreviewAudio);

export default router;
