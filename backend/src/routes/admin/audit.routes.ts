import { Router } from 'express';
import { auditController } from '../../controllers/admin/audit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';

const router = Router();

// All audit routes require admin role
router.use(authenticate, requireAdmin);

/**
 * @route GET /api/admin/audit/stats
 * @desc Get quick stats for audit logs
 */
router.get('/stats', auditController.getStats);

/**
 * @route GET /api/admin/audit/export
 * @desc Export audit logs to CSV or JSON
 */
router.get('/export', auditController.export);

/**
 * @route GET /api/admin/audit/:id
 * @desc Get audit log details by ID
 */
router.get('/:id', auditController.getById);

/**
 * @route GET /api/admin/audit
 * @desc List audit logs with filtering and pagination
 */
router.get('/', auditController.list);

export default router;
