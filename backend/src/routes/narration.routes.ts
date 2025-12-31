import { Router } from 'express';
import { narrationController } from '../controllers/narration.controller';
import { authenticate, requireWriter, requireFeature } from '../middleware';

const router = Router();

// All narration routes require authentication, writer role, and TTS feature
router.post('/chapters/:chapterId/narration/start', 
  authenticate, 
  requireWriter, 
  requireFeature('canUseTTS'),
  narrationController.startNarration
);

router.get('/chapters/:chapterId/narration/status', 
  authenticate, 
  narrationController.getNarrationStatus
);

router.post('/chapters/:chapterId/narration/cancel', 
  authenticate, 
  requireWriter,
  narrationController.cancelNarration
);

export const narrationRoutes = router;
