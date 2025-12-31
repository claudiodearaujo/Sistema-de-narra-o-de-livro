import { Router } from 'express';
import { voicesController } from '../controllers/voices.controller';
import { authenticate, optionalAuth, requireWriter, requireFeature } from '../middleware';

const router = Router();

// List voices - public route with optional auth
router.get('/voices', optionalAuth, voicesController.listVoices);

// Preview voice - requires auth, writer role, and TTS feature
router.post('/voices/preview', 
  authenticate, 
  requireWriter,
  requireFeature('canUseTTS'),
  voicesController.previewVoice
);

export default router;
