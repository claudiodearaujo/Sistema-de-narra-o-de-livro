import { Router } from 'express';
import { batchController } from '../controllers/batch.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/chapters/:id/batch/generate-audio', batchController.generateAudioBatch.bind(batchController));
router.post('/chapters/:id/batch/generate-images', batchController.generateImageBatch.bind(batchController));
router.post('/chapters/:id/export', batchController.exportChapter.bind(batchController));

export { router as batchRoutes };
