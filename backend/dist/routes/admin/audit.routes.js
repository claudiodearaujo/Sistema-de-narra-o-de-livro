"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("../../controllers/admin/audit.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
// All audit routes require admin role
router.use(auth_middleware_1.authenticate, role_middleware_1.requireAdmin);
/**
 * @route GET /api/admin/audit/stats
 * @desc Get quick stats for audit logs
 */
router.get('/stats', audit_controller_1.auditController.getStats);
/**
 * @route GET /api/admin/audit/export
 * @desc Export audit logs to CSV or JSON
 */
router.get('/export', audit_controller_1.auditController.export);
/**
 * @route GET /api/admin/audit/:id
 * @desc Get audit log details by ID
 */
router.get('/:id', audit_controller_1.auditController.getById);
/**
 * @route GET /api/admin/audit
 * @desc List audit logs with filtering and pagination
 */
router.get('/', audit_controller_1.auditController.list);
exports.default = router;
