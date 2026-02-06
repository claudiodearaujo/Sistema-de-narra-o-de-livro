import { AIOperationType, AIProviderName } from '@prisma/client';
import prisma from '../lib/prisma';
import { livraService } from './livra.service';
import { auditService } from './audit.service';

/**
 * Custo estimado por operação em USD (valores aproximados)
 * Estes valores são usados para estimativa de custo e podem ser
 * ajustados via LivraConfig no banco de dados.
 */
const ESTIMATED_COSTS: Record<string, number> = {
    // ElevenLabs (por 1000 caracteres)
    'elevenlabs:TTS_GENERATE': 0.30,
    'elevenlabs:TTS_PREVIEW': 0.05,
    'elevenlabs:TTS_VOICES_LIST': 0.0,

    // Gemini TTS (por 1000 caracteres)
    'gemini:TTS_GENERATE': 0.01,
    'gemini:TTS_PREVIEW': 0.002,
    'gemini:TTS_VOICES_LIST': 0.0,

    // Gemini Text (por 1000 tokens)
    'gemini:TEXT_GENERATE': 0.001,
    'gemini:TEXT_SPELLCHECK': 0.0005,
    'gemini:TEXT_SUGGEST': 0.001,
    'gemini:TEXT_ENRICH': 0.001,

    // Gemini Image
    'gemini:IMAGE_GENERATE': 0.04,
    'gemini:IMAGE_EMOTION': 0.04,

    // Narração de capítulo (estimativa composta)
    'gemini:NARRATION_CHAPTER': 0.10,
    'elevenlabs:NARRATION_CHAPTER': 2.00,
};

/**
 * Custo em Livras por tipo de operação
 * Pode ser sobrescrito via LivraConfig no banco
 */
const LIVRA_COSTS: Record<string, string> = {
    'TTS_GENERATE': 'AI_TTS_COST',
    'TTS_PREVIEW': 'AI_TTS_PREVIEW_COST',
    'TEXT_GENERATE': 'AI_TEXT_COST',
    'TEXT_SPELLCHECK': 'AI_TEXT_COST',
    'TEXT_SUGGEST': 'AI_TEXT_COST',
    'TEXT_ENRICH': 'AI_TEXT_COST',
    'IMAGE_GENERATE': 'AI_IMAGE_COST',
    'IMAGE_EMOTION': 'AI_IMAGE_COST',
    'NARRATION_CHAPTER': 'AI_NARRATION_COST',
};

const DEFAULT_LIVRA_COSTS: Record<string, number> = {
    AI_TTS_COST: 5,
    AI_TTS_PREVIEW_COST: 1,
    AI_TEXT_COST: 2,
    AI_IMAGE_COST: 10,
    AI_NARRATION_COST: 15,
};

export interface TrackUsageParams {
    userId: string;
    operation: AIOperationType;
    provider: AIProviderName;
    resourceType?: string;
    resourceId?: string;
    inputChars?: number;
    outputBytes?: number;
    inputTokens?: number;
    outputTokens?: number;
    durationMs?: number;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
}

export interface UsageSummary {
    totalOperations: number;
    totalInputChars: number;
    totalOutputBytes: number;
    totalEstimatedCost: number;
    totalLivrasSpent: number;
    byOperation: Record<string, number>;
    byProvider: Record<string, number>;
}

export interface UsageQuota {
    dailyLimit: number;
    dailyUsed: number;
    monthlyLimit: number;
    monthlyUsed: number;
    canProceed: boolean;
}

class AITokenService {
    /**
     * Registra o uso de uma operação de IA e cobra Livras
     */
    async trackUsage(params: TrackUsageParams): Promise<{ usageLogId: string; livrasCost: number }> {
        const {
            userId,
            operation,
            provider,
            resourceType,
            resourceId,
            inputChars = 0,
            outputBytes = 0,
            inputTokens = 0,
            outputTokens = 0,
            durationMs = 0,
            success = true,
            errorMessage,
            metadata,
        } = params;

        // Calcular custo estimado em USD
        const costKey = `${provider.toLowerCase()}:${operation}`;
        const costPer1k = ESTIMATED_COSTS[costKey] || 0;
        const units = inputChars > 0 ? inputChars : inputTokens;
        const estimatedCost = (units / 1000) * costPer1k;

        // Calcular custo em Livras
        let livrasCost = 0;
        if (success) {
            livrasCost = await this.getLivraCost(operation);
        }

        // Registrar no banco
        const usageLog = await prisma.aIUsageLog.create({
            data: {
                userId,
                operation,
                provider,
                resourceType,
                resourceId,
                inputTokens,
                outputTokens,
                inputChars,
                outputBytes,
                durationMs,
                estimatedCost,
                livrasCost,
                success,
                errorMessage,
                metadata: metadata || undefined,
            },
        });

        // Cobrar Livras (apenas para operações bem-sucedidas)
        if (success && livrasCost > 0) {
            try {
                const hasFunds = await livraService.hasSufficientBalance(userId, livrasCost);
                if (hasFunds) {
                    await livraService.spendLivras(userId, {
                        type: this.mapOperationToLivraType(operation),
                        amount: livrasCost,
                        metadata: {
                            aiUsageLogId: usageLog.id,
                            operation,
                            provider: provider.toString(),
                        },
                    });
                }
            } catch (err: any) {
                console.error(`[AI-TOKEN] Erro ao cobrar Livras: ${err.message}`);
            }
        }

        return { usageLogId: usageLog.id, livrasCost };
    }

    /**
     * Verifica se o usuário pode executar uma operação
     * (verifica saldo de Livras e quotas)
     */
    async canExecute(userId: string, operation: AIOperationType): Promise<{ allowed: boolean; reason?: string }> {
        const livrasCost = await this.getLivraCost(operation);

        if (livrasCost > 0) {
            const hasFunds = await livraService.hasSufficientBalance(userId, livrasCost);
            if (!hasFunds) {
                return {
                    allowed: false,
                    reason: `Saldo insuficiente de Livras. Necessário: ${livrasCost}`,
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Retorna o resumo de uso de IA para um usuário
     */
    async getUsageSummary(userId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<UsageSummary> {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        const logs = await prisma.aIUsageLog.findMany({
            where: {
                userId,
                createdAt: { gte: startDate },
                success: true,
            },
        });

        const summary: UsageSummary = {
            totalOperations: logs.length,
            totalInputChars: 0,
            totalOutputBytes: 0,
            totalEstimatedCost: 0,
            totalLivrasSpent: 0,
            byOperation: {},
            byProvider: {},
        };

        for (const log of logs) {
            summary.totalInputChars += log.inputChars;
            summary.totalOutputBytes += log.outputBytes;
            summary.totalEstimatedCost += log.estimatedCost;
            summary.totalLivrasSpent += log.livrasCost;

            const opKey = log.operation;
            summary.byOperation[opKey] = (summary.byOperation[opKey] || 0) + 1;

            const provKey = log.provider;
            summary.byProvider[provKey] = (summary.byProvider[provKey] || 0) + 1;
        }

        return summary;
    }

    /**
     * Retorna o custo em Livras para uma operação
     */
    async getLivraCost(operation: AIOperationType): Promise<number> {
        const configKey = LIVRA_COSTS[operation];
        if (!configKey) return 0;

        try {
            return await livraService.getConfigValue(configKey);
        } catch {
            return DEFAULT_LIVRA_COSTS[configKey] || 0;
        }
    }

    /**
     * Retorna os custos de todas as operações de IA
     */
    async getAllCosts(): Promise<Record<string, { livras: number; estimatedUsd: number }>> {
        const costs: Record<string, { livras: number; estimatedUsd: number }> = {};

        for (const [operation, configKey] of Object.entries(LIVRA_COSTS)) {
            let livras: number;
            try {
                livras = await livraService.getConfigValue(configKey);
            } catch {
                livras = DEFAULT_LIVRA_COSTS[configKey] || 0;
            }

            // Pega o custo em USD para qualquer provider (gemini como referência)
            const usdKey = `gemini:${operation}`;
            const estimatedUsd = ESTIMATED_COSTS[usdKey] || 0;

            costs[operation] = { livras, estimatedUsd };
        }

        return costs;
    }

    /**
     * Mapeia operação de IA para tipo de transação Livra
     */
    private mapOperationToLivraType(operation: AIOperationType): any {
        switch (operation) {
            case 'TTS_GENERATE':
            case 'TTS_PREVIEW':
            case 'NARRATION_CHAPTER':
                return 'SPENT_TTS';
            case 'IMAGE_GENERATE':
            case 'IMAGE_EMOTION':
                return 'SPENT_IMAGE';
            case 'TEXT_GENERATE':
            case 'TEXT_SPELLCHECK':
            case 'TEXT_SUGGEST':
            case 'TEXT_ENRICH':
                return 'SPENT_TTS'; // Reutiliza tipo existente
            default:
                return 'SPENT_TTS';
        }
    }

    // ========== Admin Methods ==========

    /**
     * Atualiza o custo em Livras de uma operação (Admin only)
     */
    async updateOperationCost(
        operation: AIOperationType,
        livrasCost: number
    ): Promise<{ operation: string; oldCost: number; newCost: number }> {
        const configKey = LIVRA_COSTS[operation];
        if (!configKey) {
            throw new Error(`Operação desconhecida: ${operation}`);
        }

        const oldCost = await this.getLivraCost(operation);
        await livraService.setConfigValue(configKey, livrasCost, `Custo em Livras para ${operation}`);

        return { operation, oldCost, newCost: livrasCost };
    }

    /**
     * Obtém estatísticas gerais de uso da plataforma (Admin only)
     */
    async getPlatformStats(period: 'day' | 'week' | 'month' = 'month'): Promise<{
        totalOperations: number;
        totalUsers: number;
        totalInputChars: number;
        totalOutputBytes: number;
        totalEstimatedCostUsd: number;
        totalLivrasSpent: number;
        successRate: number;
        byOperation: Record<string, { count: number; livras: number; usd: number }>;
        byProvider: Record<string, { count: number; livras: number; usd: number }>;
        topUsers: Array<{ userId: string; operations: number; livrasSpent: number }>;
    }> {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        const logs = await prisma.aIUsageLog.findMany({
            where: {
                createdAt: { gte: startDate },
            },
        });

        const successLogs = logs.filter(l => l.success);
        const failedLogs = logs.filter(l => !l.success);

        // Aggregate by operation
        const byOperation: Record<string, { count: number; livras: number; usd: number }> = {};
        const byProvider: Record<string, { count: number; livras: number; usd: number }> = {};
        const userStats: Record<string, { operations: number; livrasSpent: number }> = {};

        let totalInputChars = 0;
        let totalOutputBytes = 0;
        let totalEstimatedCostUsd = 0;
        let totalLivrasSpent = 0;

        for (const log of successLogs) {
            totalInputChars += log.inputChars;
            totalOutputBytes += log.outputBytes;
            totalEstimatedCostUsd += log.estimatedCost;
            totalLivrasSpent += log.livrasCost;

            // By operation
            const opKey = log.operation;
            if (!byOperation[opKey]) {
                byOperation[opKey] = { count: 0, livras: 0, usd: 0 };
            }
            byOperation[opKey].count++;
            byOperation[opKey].livras += log.livrasCost;
            byOperation[opKey].usd += log.estimatedCost;

            // By provider
            const provKey = log.provider;
            if (!byProvider[provKey]) {
                byProvider[provKey] = { count: 0, livras: 0, usd: 0 };
            }
            byProvider[provKey].count++;
            byProvider[provKey].livras += log.livrasCost;
            byProvider[provKey].usd += log.estimatedCost;

            // By user
            if (!userStats[log.userId]) {
                userStats[log.userId] = { operations: 0, livrasSpent: 0 };
            }
            userStats[log.userId].operations++;
            userStats[log.userId].livrasSpent += log.livrasCost;
        }

        // Get unique users count
        const uniqueUsers = new Set(logs.map(l => l.userId));

        // Get top 10 users by operations
        const topUsers = Object.entries(userStats)
            .map(([userId, stats]) => ({ userId, ...stats }))
            .sort((a, b) => b.operations - a.operations)
            .slice(0, 10);

        return {
            totalOperations: logs.length,
            totalUsers: uniqueUsers.size,
            totalInputChars,
            totalOutputBytes,
            totalEstimatedCostUsd,
            totalLivrasSpent,
            successRate: logs.length > 0 ? (successLogs.length / logs.length) * 100 : 100,
            byOperation,
            byProvider,
            topUsers,
        };
    }

    /**
     * Obtém histórico de uso por dia (Admin only)
     */
    async getUsageHistory(days: number = 30): Promise<Array<{
        date: string;
        operations: number;
        livrasSpent: number;
        estimatedUsd: number;
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
                livrasCost: true,
                estimatedCost: true,
            },
        });

        // Group by date
        const byDate: Record<string, { operations: number; livrasSpent: number; estimatedUsd: number }> = {};

        for (const log of logs) {
            const dateKey = log.createdAt.toISOString().split('T')[0];
            if (!byDate[dateKey]) {
                byDate[dateKey] = { operations: 0, livrasSpent: 0, estimatedUsd: 0 };
            }
            byDate[dateKey].operations++;
            byDate[dateKey].livrasSpent += log.livrasCost;
            byDate[dateKey].estimatedUsd += log.estimatedCost;
        }

        // Fill in missing days
        const result: Array<{ date: string; operations: number; livrasSpent: number; estimatedUsd: number }> = [];
        const currentDate = new Date(startDate);
        const today = new Date();

        while (currentDate <= today) {
            const dateKey = currentDate.toISOString().split('T')[0];
            result.push({
                date: dateKey,
                ...byDate[dateKey] || { operations: 0, livrasSpent: 0, estimatedUsd: 0 },
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;
    }

    /**
     * Lista todas as configurações de custo disponíveis
     */
    getAllCostConfigs(): { operation: string; configKey: string; defaultValue: number }[] {
        return Object.entries(LIVRA_COSTS).map(([operation, configKey]) => ({
            operation,
            configKey,
            defaultValue: DEFAULT_LIVRA_COSTS[configKey] || 0,
        }));
    }
}

export const aiTokenService = new AITokenService();
