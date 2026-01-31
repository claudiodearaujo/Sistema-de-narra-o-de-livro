"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.AuditController = void 0;
const audit_service_1 = require("../../services/audit.service");
class AuditController {
    /**
     * List audit logs with filters and pagination
     */
    async list(req, res) {
        try {
            const { userId, action, category, severity, resource, resourceId, success, startDate, endDate, search, page, limit, sortBy, sortOrder } = req.query;
            const filters = {
                userId: userId,
                action: action,
                category: category,
                severity: severity,
                resource: resource,
                resourceId: resourceId,
                success: success === 'true' ? true : success === 'false' ? false : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                search: search,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 50,
                sortBy: sortBy,
                sortOrder: sortOrder,
            };
            const result = await audit_service_1.auditService.query(filters);
            res.json(result);
        }
        catch (error) {
            console.error('[AuditController] Error listing logs:', error);
            res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
        }
    }
    /**
     * Get audit log by ID
     */
    async getById(req, res) {
        try {
            const id = req.params.id;
            const log = await audit_service_1.auditService.getById(id);
            if (!log) {
                res.status(404).json({ error: 'Log não encontrado' });
                return;
            }
            res.json(log);
        }
        catch (error) {
            console.error('[AuditController] Error getting log by ID:', error);
            res.status(500).json({ error: 'Erro ao buscar detalhes do log' });
        }
    }
    /**
     * Get quick statistics for audit logs
     */
    async getStats(req, res) {
        try {
            const stats = await audit_service_1.auditService.getQuickStats();
            res.json(stats);
        }
        catch (error) {
            console.error('[AuditController] Error getting stats:', error);
            res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }
    }
    /**
     * Export audit logs
     */
    async export(req, res) {
        try {
            const format = req.query.format === 'csv' ? 'csv' : 'json';
            // Parse query into valid filters
            const filters = {
                userId: req.query.userId,
                action: req.query.action,
                category: req.query.category,
                severity: req.query.severity,
                resource: req.query.resource,
                resourceId: req.query.resourceId,
                success: req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                search: req.query.search,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            const result = await audit_service_1.auditService.export(filters, format);
            res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString()}.${format}`);
            res.send(result);
        }
        catch (error) {
            console.error('[AuditController] Error exporting logs:', error);
            res.status(500).json({ error: 'Erro ao exportar logs' });
        }
    }
}
exports.AuditController = AuditController;
exports.auditController = new AuditController();
