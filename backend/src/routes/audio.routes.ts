import { Router } from 'express';
import { audioController } from '../controllers/audio.controller';
import { authenticate, requireWriter, requireFeature } from '../middleware';

const router = Router();

// Process audio - requires auth, writer role, and TTS feature
router.post('/chapters/:chapterId/audio/process', 
  authenticate, 
  requireWriter,
  requireFeature('canUseTTS'),
  audioController.processAudio
);

// Get audio status - requires auth only
router.get('/chapters/:chapterId/audio/status', 
  authenticate, 
  audioController.getStatus
);

export const audioRoutes = router;
