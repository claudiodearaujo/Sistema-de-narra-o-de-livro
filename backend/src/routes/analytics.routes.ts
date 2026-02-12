import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/analytics/author', analyticsController.getAuthorStats.bind(analyticsController));

export default router;
