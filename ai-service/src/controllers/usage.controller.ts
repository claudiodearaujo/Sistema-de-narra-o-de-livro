import { Request, Response } from 'express';
import { usageService } from '../services/usage.service';
import { audioCacheService } from '../services/cache.service';

class UsageController {
    /**
     * GET /api/usage
     * Get usage summary for current user
     */
    async getUsage(req: Request, res: Response) {
        try {
            const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

            const usage = await usageService.getUserUsage(req.auth!.userId, period);

            res.json({
                period,
                ...usage,
            });
        } catch (error: any) {
            console.error('Get usage error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/costs
     * Get costs for all operations
     */
    async getCosts(req: Request, res: Response) {
        try {
            const costs = await usageService.getAllCosts();
            res.json({ costs });
        } catch (error: any) {
            console.error('Get costs error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/admin/stats
     * Get platform-wide statistics (admin only)
     */
    async getPlatformStats(req: Request, res: Response) {
        try {
            const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

            const stats = await usageService.getPlatformStats(period);

            res.json({
                period,
                ...stats,
            });
        } catch (error: any) {
            console.error('Get platform stats error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/admin/history
     * Get daily usage history (admin only)
     */
    async getUsageHistory(req: Request, res: Response) {
        try {
            const days = parseInt(req.query.days as string) || 30;

            const history = await usageService.getUsageHistory(days);

            res.json({
                days,
                history,
            });
        } catch (error: any) {
            console.error('Get usage history error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/admin/costs
     * Get all cost configurations (admin only)
     */
    async getAdminCosts(req: Request, res: Response) {
        try {
            const costs = await usageService.getAllCosts();

            const result = Object.entries(costs).map(([operation, cost]) => ({
                operation,
                credits: cost.credits,
                estimatedUsd: cost.estimatedUsd,
            }));

            res.json({ costs: result });
        } catch (error: any) {
            console.error('Get admin costs error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * PUT /api/admin/costs/:operation
     * Update cost for an operation (admin only)
     */
    async updateCost(req: Request, res: Response) {
        try {
            const operation = req.params.operation as string;
            const { credits } = req.body;

            if (credits === undefined || credits < 0) {
                return res.status(400).json({ error: 'Credits must be a non-negative number' });
            }

            const oldCost = await usageService.getCost(operation);
            await usageService.updateCost(operation, credits);

            res.json({
                message: 'Cost updated successfully',
                operation,
                oldCredits: oldCost.credits,
                newCredits: credits,
            });
        } catch (error: any) {
            console.error('Update cost error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/admin/cache/stats
     * Get cache statistics (admin only)
     */
    async getCacheStats(req: Request, res: Response) {
        try {
            const stats = await audioCacheService.getStats();

            res.json({
                ...stats,
                totalSizeMB: (stats.totalSizeBytes / (1024 * 1024)).toFixed(2),
            });
        } catch (error: any) {
            console.error('Get cache stats error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/admin/cache/clean
     * Clean cache entries (admin only)
     */
    async cleanCache(req: Request, res: Response) {
        try {
            const { type, daysUnused } = req.body;

            let removedCount = 0;

            switch (type) {
                case 'expired':
                    removedCount = await audioCacheService.cleanExpired();
                    break;
                case 'unused':
                    removedCount = await audioCacheService.cleanUnused(daysUnused || 30);
                    break;
                case 'all':
                    removedCount = await audioCacheService.clearAll();
                    break;
                default:
                    return res.status(400).json({
                        error: 'Invalid clean type. Use: expired, unused, or all',
                    });
            }

            res.json({
                message: 'Cache cleaned successfully',
                type,
                removedCount,
            });
        } catch (error: any) {
            console.error('Clean cache error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const usageController = new UsageController();
