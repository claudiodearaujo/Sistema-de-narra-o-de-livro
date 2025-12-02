import { Router } from 'express';
import { narrationController } from '../controllers/narration.controller';

const router = Router();

router.post('/chapters/:chapterId/narration/start', narrationController.startNarration);
router.get('/chapters/:chapterId/narration/status', narrationController.getNarrationStatus);
router.post('/chapters/:chapterId/narration/cancel', narrationController.cancelNarration);

export const narrationRoutes = router;
