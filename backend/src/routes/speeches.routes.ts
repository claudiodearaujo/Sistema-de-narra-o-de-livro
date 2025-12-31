import { Router } from 'express';
import { speechesController } from '../controllers/speeches.controller';
import { authenticate, optionalAuth, requireWriter } from '../middleware';

const router = Router();

// Chapter-related speech routes
router.get('/chapters/:chapterId/speeches', optionalAuth, speechesController.getByChapterId);
router.post('/chapters/:chapterId/speeches', authenticate, requireWriter, speechesController.create);
router.put('/chapters/:chapterId/speeches/reorder', authenticate, requireWriter, speechesController.reorder);
router.post('/chapters/:chapterId/speeches/bulk', authenticate, requireWriter, speechesController.bulkCreate);

// Speech-specific routes
router.get('/speeches/:id', optionalAuth, speechesController.getById);
router.put('/speeches/:id', authenticate, requireWriter, speechesController.update);
router.delete('/speeches/:id', authenticate, requireWriter, speechesController.delete);

// SSML validation (protected - requires auth)
router.post('/ssml/validate', authenticate, speechesController.validateSSML);

// AI assist tools (protected - requires writer role)
router.post('/speeches/tools/spell-check', authenticate, requireWriter, speechesController.spellCheck);
router.post('/speeches/tools/suggestions', authenticate, requireWriter, speechesController.suggestImprovements);
router.post('/speeches/tools/character-context', authenticate, requireWriter, speechesController.enrichWithCharacter);
router.post('/speeches/tools/emotion-image', authenticate, requireWriter, speechesController.generateEmotionImage);

export default router;
