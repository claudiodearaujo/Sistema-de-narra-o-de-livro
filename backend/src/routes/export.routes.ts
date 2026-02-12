import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/chapters/:id/export/print', authenticate, exportController.exportChapterPrint.bind(exportController));

export default router;
