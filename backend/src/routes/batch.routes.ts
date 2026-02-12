import { Router } from 'express';
import { batchController } from '../controllers/batch.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/chapters/:id/batch/generate-audio', authenticate, batchController.generateAudioBatch.bind(batchController));
router.post('/chapters/:id/batch/generate-images', authenticate, batchController.generateImageBatch.bind(batchController));
router.post('/chapters/:id/export', authenticate, batchController.exportChapter.bind(batchController));

export { router as batchRoutes };
