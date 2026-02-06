import { Router } from 'express';
import { usageController } from '../controllers/usage.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Get usage summary (requires auth)
router.get('/',
    authenticate,
    usageController.getUsage.bind(usageController)
);

// Get costs (public)
router.get('/costs',
    usageController.getCosts.bind(usageController)
);

export default router;
