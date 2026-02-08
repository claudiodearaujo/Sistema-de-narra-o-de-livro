import { AIOperationType, AIProviderName } from '@prisma/client';
import { prisma } from './prisma';

// Default costs in credits per operation
const DEFAULT_COSTS: Record<string, number> = {
    TTS_GENERATE: 5,
    TTS_PREVIEW: 1,
    TTS_VOICES_LIST: 0,
    TEXT_GENERATE: 3,
    TEXT_SPELLCHECK: 1,
    TEXT_SUGGEST: 2,
    TEXT_ENRICH: 3,
    IMAGE_GENERATE: 10,
    IMAGE_EMOTION: 8,
    NARRATION_CHAPTER: 50,
};

// Estimated USD cost per operation
const USD_COSTS: Record<string, number> = {
    TTS_GENERATE: 0.015,
    TTS_PREVIEW: 0.003,
    TTS_VOICES_LIST: 0,
    TEXT_GENERATE: 0.001,
    TEXT_SPELLCHECK: 0.0005,
    TEXT_SUGGEST: 0.001,
    TEXT_ENRICH: 0.001,
    IMAGE_GENERATE: 0.04,
    IMAGE_EMOTION: 0.03,
    NARRATION_CHAPTER: 0.15,
};

export interface UsageLogData {
    userId: string;
    clientId: string;
    operation: AIOperationType;
    provider: AIProviderName;
    resourceType?: string;
    resourceId?: string;
    inputChars?: number;
    outputBytes?: number;
    durationMs?: number;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
}

class UsageService {
    /**
     * Get cost configuration for an operation
     */
    async getCost(operation: string): Promise<{ credits: number; estimatedUsd: number }> {
        // Try to get from database first
        const config = await prisma.costConfig.findUnique({
            where: { key: operation },
        });

        const credits = config?.value ?? DEFAULT_COSTS[operation] ?? 0;
        const estimatedUsd = USD_COSTS[operation] ?? 0;

        return { credits, estimatedUsd };
    }

    /**
     * Get all cost configurations
     */
    async getAllCosts(): Promise<Record<string, { credits: number; estimatedUsd: number }>> {
        const configs = await prisma.costConfig.findMany();

        const costs: Record<string, { credits: number; estimatedUsd: number }> = {};

        for (const operation of Object.keys(DEFAULT_COSTS)) {
            const config = configs.find(c => c.key === operation);
            costs[operation] = {
                credits: config?.value ?? DEFAULT_COSTS[operation],
                estimatedUsd: USD_COSTS[operation] ?? 0,
            };
        }

        return costs;
    }

    /**
     * Update cost for an operation (admin only)
     */
    async updateCost(operation: string, credits: number): Promise<void> {
        await prisma.costConfig.upsert({
            where: { key: operation },
            update: { value: credits },
            create: { key: operation, value: credits },
        });
    }

    /**
     * Log AI usage
     */
    async logUsage(data: UsageLogData): Promise<string> {
        const cost = await this.getCost(data.operation);

        const log = await prisma.aIUsageLog.create({
            data: {
                userId: data.userId,
                clientId: data.clientId,
                operation: data.operation,
                provider: data.provider,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                inputChars: data.inputChars ?? 0,
                outputBytes: data.outputBytes ?? 0,
                durationMs: data.durationMs ?? 0,
                estimatedCost: cost.estimatedUsd,
                creditsCost: cost.credits,
                success: data.success ?? true,
                errorMessage: data.errorMessage,
                metadata: data.metadata,
            },
        });

        return log.id;
    }

    /**
     * Get usage summary for a user
     */
    async getUserUsage(
        userId: string,
        period: 'day' | 'week' | 'month' = 'month'
    ): Promise<{
        totalOperations: number;
        totalCreditsSpent: number;
        totalEstimatedUsd: number;
        byOperation: Record<string, { count: number; credits: number }>;
        byProvider: Record<string, { count: number; credits: number }>;
    }> {
        const startDate = this.getPeriodStartDate(period);

        const logs = await prisma.aIUsageLog.findMany({
            where: {
                userId,
                createdAt: { gte: startDate },
                success: true,
            },
        });

        const byOperation: Record<string, { count: number; credits: number }> = {};
        const byProvider: Record<string, { count: number; credits: number }> = {};
        let totalCredits = 0;
        let totalUsd = 0;

        for (const log of logs) {
            totalCredits += log.creditsCost;
            totalUsd += log.estimatedCost;

            if (!byOperation[log.operation]) {
                byOperation[log.operation] = { count: 0, credits: 0 };
            }
            byOperation[log.operation].count++;
            byOperation[log.operation].credits += log.creditsCost;

            if (!byProvider[log.provider]) {
                byProvider[log.provider] = { count: 0, credits: 0 };
            }
            byProvider[log.provider].count++;
            byProvider[log.provider].credits += log.creditsCost;
        }

        return {
            totalOperations: logs.length,
            totalCreditsSpent: totalCredits,
            totalEstimatedUsd: totalUsd,
            byOperation,
            byProvider,
        };
    }

    /**
     * Get platform-wide usage statistics (admin)
     */
    async getPlatformStats(period: 'day' | 'week' | 'month' = 'month'): Promise<{
        totalOperations: number;
        totalUsers: number;
        totalCreditsSpent: number;
        totalEstimatedUsd: number;
        successRate: number;
        byOperation: Record<string, { count: number; credits: number; usd: number }>;
        byProvider: Record<string, { count: number; credits: number; usd: number }>;
        topUsers: Array<{ userId: string; operations: number; credits: number }>;
    }> {
        const startDate = this.getPeriodStartDate(period);

        const logs = await prisma.aIUsageLog.findMany({
            where: { createdAt: { gte: startDate } },
        });

        const successLogs = logs.filter(l => l.success);
        const uniqueUsers = new Set(logs.map(l => l.userId));

        const byOperation: Record<string, { count: number; credits: number; usd: number }> = {};
        const byProvider: Record<string, { count: number; credits: number; usd: number }> = {};
        const userStats: Record<string, { operations: number; credits: number }> = {};

        let totalCredits = 0;
        let totalUsd = 0;

        for (const log of successLogs) {
            totalCredits += log.creditsCost;
            totalUsd += log.estimatedCost;

            if (!byOperation[log.operation]) {
                byOperation[log.operation] = { count: 0, credits: 0, usd: 0 };
            }
            byOperation[log.operation].count++;
            byOperation[log.operation].credits += log.creditsCost;
            byOperation[log.operation].usd += log.estimatedCost;

            if (!byProvider[log.provider]) {
                byProvider[log.provider] = { count: 0, credits: 0, usd: 0 };
            }
            byProvider[log.provider].count++;
            byProvider[log.provider].credits += log.creditsCost;
            byProvider[log.provider].usd += log.estimatedCost;

            if (!userStats[log.userId]) {
                userStats[log.userId] = { operations: 0, credits: 0 };
            }
            userStats[log.userId].operations++;
            userStats[log.userId].credits += log.creditsCost;
        }

        const topUsers = Object.entries(userStats)
            .map(([userId, stats]) => ({ userId, ...stats }))
            .sort((a, b) => b.operations - a.operations)
            .slice(0, 10);

        return {
            totalOperations: logs.length,
            totalUsers: uniqueUsers.size,
            totalCreditsSpent: totalCredits,
            totalEstimatedUsd: totalUsd,
            successRate: logs.length > 0 ? (successLogs.length / logs.length) * 100 : 100,
            byOperation,
            byProvider,
            topUsers,
        };
    }

    /**
     * Get daily usage history
     */
    async getUsageHistory(days: number = 30): Promise<Array<{
        date: string;
        operations: number;
        credits: number;
        usd: number;
    }>> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await prisma.aIUsageLog.findMany({
            where: {
                createdAt: { gte: startDate },
                success: true,
            },
            select: {
                createdAt: true,
                creditsCost: true,
                estimatedCost: true,
            },
        });

        const byDate: Record<string, { operations: number; credits: number; usd: number }> = {};

        for (const log of logs) {
            const dateKey = log.createdAt.toISOString().split('T')[0];
            if (!byDate[dateKey]) {
                byDate[dateKey] = { operations: 0, credits: 0, usd: 0 };
            }
            byDate[dateKey].operations++;
            byDate[dateKey].credits += log.creditsCost;
            byDate[dateKey].usd += log.estimatedCost;
        }

        // Fill in missing days
        const result: Array<{ date: string; operations: number; credits: number; usd: number }> = [];
        const currentDate = new Date(startDate);
        const today = new Date();

        while (currentDate <= today) {
            const dateKey = currentDate.toISOString().split('T')[0];
            result.push({
                date: dateKey,
                ...byDate[dateKey] || { operations: 0, credits: 0, usd: 0 },
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;
    }

    private getPeriodStartDate(period: 'day' | 'week' | 'month'): Date {
        const now = new Date();
        switch (period) {
            case 'day':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return weekAgo;
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }
}

export const usageService = new UsageService();
