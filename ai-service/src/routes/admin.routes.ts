import { Router } from 'express';
import { usageController } from '../controllers/usage.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require admin permission
router.use(authenticate, requireAdmin);

// Platform statistics
router.get('/stats', usageController.getPlatformStats.bind(usageController));

// Usage history
router.get('/history', usageController.getUsageHistory.bind(usageController));

// Cost configuration
router.get('/costs', usageController.getAdminCosts.bind(usageController));
router.put('/costs/:operation', usageController.updateCost.bind(usageController));

// Cache management
router.get('/cache/stats', usageController.getCacheStats.bind(usageController));
router.post('/cache/clean', usageController.cleanCache.bind(usageController));

export default router;
