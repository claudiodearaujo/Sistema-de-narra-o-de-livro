import { Request, Response } from 'express';
import { auditService, AuditQueryFilters } from '../../services/audit.service';
import { AuditAction, AuditCategory, AuditSeverity } from '@prisma/client';

export class AuditController {
  /**
   * List audit logs with filters and pagination
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        action,
        category,
        severity,
        resource,
        resourceId,
        success,
        startDate,
        endDate,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const filters: AuditQueryFilters = {
        userId: userId as string,
        action: action as any,
        category: category as any,
        severity: severity as any,
        resource: resource as string,
        resourceId: resourceId as string,
        success: success === 'true' ? true : success === 'false' ? false : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const result = await auditService.query(filters);
      res.json(result);
    } catch (error) {
      console.error('[AuditController] Error listing logs:', error);
      res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
    }
  }

  /**
   * Get audit log by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const log = await auditService.getById(id);

      if (!log) {
        res.status(404).json({ error: 'Log não encontrado' });
        return;
      }

      res.json(log);
    } catch (error) {
      console.error('[AuditController] Error getting log by ID:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhes do log' });
    }
  }

  /**
   * Get quick statistics for audit logs
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await auditService.getQuickStats();
      res.json(stats);
    } catch (error) {
      console.error('[AuditController] Error getting stats:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  /**
   * Export audit logs
   */
  async export(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format === 'csv' ? 'csv' : 'json';
      
      // Parse query into valid filters
      const filters: AuditQueryFilters = {
        userId: req.query.userId as string,
        action: req.query.action as any,
        category: req.query.category as any,
        severity: req.query.severity as any,
        resource: req.query.resource as string,
        resourceId: req.query.resourceId as string,
        success: req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await auditService.export(filters, format);

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString()}.${format}`);
      res.send(result);
    } catch (error) {
      console.error('[AuditController] Error exporting logs:', error);
      res.status(500).json({ error: 'Erro ao exportar logs' });
    }
  }
}

export const auditController = new AuditController();
