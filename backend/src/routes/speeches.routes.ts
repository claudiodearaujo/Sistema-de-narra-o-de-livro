import { Router } from 'express';
import { speechesController } from '../controllers/speeches.controller';

const router = Router();

// Chapter-related speech routes
router.get('/chapters/:chapterId/speeches', speechesController.getByChapterId);
router.post('/chapters/:chapterId/speeches', speechesController.create);
router.put('/chapters/:chapterId/speeches/reorder', speechesController.reorder);
router.post('/chapters/:chapterId/speeches/bulk', speechesController.bulkCreate);

// Speech-specific routes
router.get('/speeches/:id', speechesController.getById);
router.put('/speeches/:id', speechesController.update);
router.delete('/speeches/:id', speechesController.delete);

// SSML validation
router.post('/ssml/validate', speechesController.validateSSML);

export default router;
