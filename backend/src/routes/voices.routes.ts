import { Router } from 'express';
import { voicesController } from '../controllers/voices.controller';

const router = Router();

router.get('/voices', voicesController.listVoices);
router.post('/voices/preview', voicesController.previewVoice);

export default router;
