import { Router } from 'express';
import { audioController } from '../controllers/audio.controller';

const router = Router();

router.post('/chapters/:chapterId/audio/process', audioController.processAudio);
router.get('/chapters/:chapterId/audio/status', audioController.getStatus);

export const audioRoutes = router;
