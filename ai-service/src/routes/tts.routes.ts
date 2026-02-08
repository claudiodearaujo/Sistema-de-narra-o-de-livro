import { Router } from 'express';
import { ttsController } from '../controllers/tts.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// List available voices (requires auth)
router.get('/voices',
    authenticate,
    ttsController.listVoices.bind(ttsController)
);

// Get available providers (public)
router.get('/providers',
    ttsController.getProviders.bind(ttsController)
);

// Generate audio (requires auth + tts permission)
router.post('/generate',
    authenticate,
    requirePermission('tts', 'tts:generate', '*'),
    ttsController.generate.bind(ttsController)
);

// Preview voice (requires auth + tts permission)
router.post('/preview',
    authenticate,
    requirePermission('tts', 'tts:preview', '*'),
    ttsController.preview.bind(ttsController)
);

// Batch generate (requires auth + tts permission)
router.post('/batch',
    authenticate,
    requirePermission('tts', 'tts:batch', '*'),
    ttsController.batch.bind(ttsController)
);

export default router;
