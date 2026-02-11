import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { authenticate, requireWriter } from '../middleware';

const router = Router();

// Speech media routes - require authentication and writer role

/**
 * POST /api/speeches/:id/scene-image
 * Generate AI scene image for a speech
 */
router.post('/speeches/:id/scene-image',
    authenticate,
    requireWriter,
    mediaController.generateSceneImage.bind(mediaController)
);

/**
 * POST /api/speeches/:id/ambient-audio
 * Generate ambient audio for a speech
 */
router.post('/speeches/:id/ambient-audio',
    authenticate,
    requireWriter,
    mediaController.generateAmbientAudio.bind(mediaController)
);

// Chapter soundtrack routes

/**
 * GET /api/chapters/:id/soundtrack
 * Get soundtrack configuration for a chapter
 */
router.get('/chapters/:id/soundtrack',
    authenticate,
    mediaController.getChapterSoundtrack.bind(mediaController)
);

/**
 * PUT /api/chapters/:id/soundtrack
 * Update soundtrack configuration for a chapter
 */
router.put('/chapters/:id/soundtrack',
    authenticate,
    requireWriter,
    mediaController.updateChapterSoundtrack.bind(mediaController)
);

/**
 * POST /api/chapters/:id/soundtrack/generate
 * Generate AI-powered soundtrack suggestion
 */
router.post('/chapters/:id/soundtrack/generate',
    authenticate,
    requireWriter,
    mediaController.generateSoundtrackSuggestion.bind(mediaController)
);

export default router;
