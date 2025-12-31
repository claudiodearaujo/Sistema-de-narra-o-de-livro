"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.livraService = void 0;
exports.setLivraWebSocketEmitter = setLivraWebSocketEmitter;
const prisma_1 = __importDefault(require("../lib/prisma"));
let wsEmitter = null;
/**
 * Set WebSocket emitter for real-time updates
 */
function setLivraWebSocketEmitter(emitter) {
    wsEmitter = emitter;
}
/**
 * Emit Livra update event to user
 */
function emitLivraUpdate(userId, transaction) {
    if (wsEmitter) {
        wsEmitter(userId, 'livra:update', {
            type: transaction.type,
            amount: transaction.amount,
            balance: transaction.balance,
            timestamp: transaction.createdAt,
        });
    }
}
// Default configuration values (used if not in database)
const DEFAULT_LIVRA_CONFIG = {
    LIKE_RECEIVED: 2,
    COMMENT_RECEIVED: 3,
    FOLLOW_RECEIVED: 5,
    POST_CREATED: 1,
    CAMPAIGN_COMPLETED: 50,
    ACHIEVEMENT_UNLOCKED: 10,
    // Costs
    TTS_COST: 5,
    IMAGE_GENERATION_COST: 10,
    CHARACTER_CREATION_COST: 3,
    POST_BOOST_COST: 20,
    // Plan bonuses
    PREMIUM_MONTHLY_BONUS: 100,
    PRO_MONTHLY_BONUS: 500,
    // Expiration days (0 = never expires)
    EXPIRATION_DAYS: 90,
};
class LivraService {
    /**
     * Get user's Livra balance
     */
    async getBalance(userId) {
        let balance = await prisma_1.default.livraBalance.findUnique({
            where: { userId },
        });
        // Create balance record if it doesn't exist
        if (!balance) {
            balance = await prisma_1.default.livraBalance.create({
                data: {
                    userId,
                    balance: 0,
                    lifetime: 0,
                    spent: 0,
                },
            });
        }
        return {
            balance: balance.balance,
            lifetime: balance.lifetime,
            spent: balance.spent,
        };
    }
    /**
     * Add Livras to user's balance
     */
    async addLivras(userId, dto) {
        const { type, amount, metadata, expiresAt } = dto;
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        // Calculate expiration date if not provided
        let finalExpiresAt = expiresAt;
        if (!finalExpiresAt) {
            const expirationDays = await this.getConfigValue('EXPIRATION_DAYS');
            if (expirationDays > 0) {
                finalExpiresAt = new Date();
                finalExpiresAt.setDate(finalExpiresAt.getDate() + expirationDays);
            }
        }
        // Use transaction to ensure atomicity
        const result = await prisma_1.default.$transaction(async (tx) => {
            // Get or create balance
            let balance = await tx.livraBalance.findUnique({
                where: { userId },
            });
            if (!balance) {
                balance = await tx.livraBalance.create({
                    data: {
                        userId,
                        balance: 0,
                        lifetime: 0,
                        spent: 0,
                    },
                });
            }
            const newBalance = balance.balance + amount;
            // Update balance
            await tx.livraBalance.update({
                where: { userId },
                data: {
                    balance: newBalance,
                    lifetime: balance.lifetime + amount,
                },
            });
            // Create transaction record
            const transaction = await tx.livraTransaction.create({
                data: {
                    userId,
                    type,
                    amount,
                    balance: newBalance,
                    metadata,
                    expiresAt: finalExpiresAt,
                },
            });
            return transaction;
        });
        const transactionDto = {
            id: result.id,
            type: result.type,
            amount: result.amount,
            balance: result.balance,
            metadata: result.metadata,
            expiresAt: result.expiresAt,
            createdAt: result.createdAt,
        };
        // Emit real-time update
        emitLivraUpdate(userId, transactionDto);
        return transactionDto;
    }
    /**
     * Spend Livras from user's balance
     */
    async spendLivras(userId, dto) {
        const { type, amount, metadata } = dto;
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        // Use transaction to ensure atomicity
        const result = await prisma_1.default.$transaction(async (tx) => {
            // Get balance
            const balance = await tx.livraBalance.findUnique({
                where: { userId },
            });
            if (!balance || balance.balance < amount) {
                throw new Error('Insufficient Livra balance');
            }
            const newBalance = balance.balance - amount;
            // Update balance
            await tx.livraBalance.update({
                where: { userId },
                data: {
                    balance: newBalance,
                    spent: balance.spent + amount,
                },
            });
            // Create transaction record (negative amount for spending)
            const transaction = await tx.livraTransaction.create({
                data: {
                    userId,
                    type,
                    amount: -amount,
                    balance: newBalance,
                    metadata,
                },
            });
            return transaction;
        });
        const transactionDto = {
            id: result.id,
            type: result.type,
            amount: result.amount,
            balance: result.balance,
            metadata: result.metadata,
            expiresAt: result.expiresAt,
            createdAt: result.createdAt,
        };
        // Emit real-time update
        emitLivraUpdate(userId, transactionDto);
        return transactionDto;
    }
    /**
     * Check if user has sufficient balance
     */
    async hasSufficientBalance(userId, amount) {
        const balance = await prisma_1.default.livraBalance.findUnique({
            where: { userId },
        });
        return balance ? balance.balance >= amount : false;
    }
    /**
     * Get transaction history
     */
    async getTransactionHistory(userId, page = 1, limit = 20, filters) {
        const where = { userId };
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }
        const [transactions, total] = await Promise.all([
            prisma_1.default.livraTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_1.default.livraTransaction.count({ where }),
        ]);
        return {
            transactions: transactions.map((t) => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                balance: t.balance,
                metadata: t.metadata,
                expiresAt: t.expiresAt,
                createdAt: t.createdAt,
            })),
            total,
            page,
            limit,
            hasMore: page * limit < total,
        };
    }
    /**
     * Get configuration value
     */
    async getConfigValue(key) {
        const config = await prisma_1.default.livraConfig.findUnique({
            where: { key },
        });
        return config ? config.value : (DEFAULT_LIVRA_CONFIG[key] || 0);
    }
    /**
     * Set configuration value
     */
    async setConfigValue(key, value, description) {
        await prisma_1.default.livraConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description },
        });
    }
    /**
     * Get all configuration values
     */
    async getAllConfigValues() {
        const configs = await prisma_1.default.livraConfig.findMany();
        const result = { ...DEFAULT_LIVRA_CONFIG };
        for (const config of configs) {
            result[config.key] = config.value;
        }
        return result;
    }
    /**
     * Process expired Livras (should be called by a cron job)
     */
    async processExpiredLivras() {
        const now = new Date();
        let processedCount = 0;
        // Find all transactions that have expired and haven't been processed
        const expiredTransactions = await prisma_1.default.livraTransaction.findMany({
            where: {
                expiresAt: { lte: now },
                amount: { gt: 0 }, // Only positive (earned) transactions can expire
                type: { notIn: ['EXPIRED'] },
            },
            include: {
                user: {
                    include: {
                        livraBalance: true,
                    },
                },
            },
        });
        // Group by user
        const userExpiredAmounts = {};
        for (const tx of expiredTransactions) {
            if (!userExpiredAmounts[tx.userId]) {
                userExpiredAmounts[tx.userId] = 0;
            }
            userExpiredAmounts[tx.userId] += tx.amount;
        }
        // Process each user's expired Livras
        for (const [userId, expiredAmount] of Object.entries(userExpiredAmounts)) {
            const balance = await prisma_1.default.livraBalance.findUnique({
                where: { userId },
            });
            if (balance) {
                // Calculate actual expired amount (can't expire more than current balance)
                const actualExpiredAmount = Math.min(expiredAmount, balance.balance);
                if (actualExpiredAmount > 0) {
                    await prisma_1.default.$transaction(async (tx) => {
                        // Update balance
                        await tx.livraBalance.update({
                            where: { userId },
                            data: {
                                balance: balance.balance - actualExpiredAmount,
                            },
                        });
                        // Create expiration transaction
                        await tx.livraTransaction.create({
                            data: {
                                userId,
                                type: 'EXPIRED',
                                amount: -actualExpiredAmount,
                                balance: balance.balance - actualExpiredAmount,
                                metadata: { reason: 'automatic_expiration' },
                            },
                        });
                    });
                    processedCount++;
                }
            }
        }
        return processedCount;
    }
    // ========== Convenience methods for earning Livras ==========
    /**
     * Award Livras for receiving a like
     */
    async awardForLikeReceived(userId, postId, likerId) {
        const amount = await this.getConfigValue('LIKE_RECEIVED');
        return this.addLivras(userId, {
            type: 'EARNED_LIKE',
            amount,
            metadata: { postId, likerId },
        });
    }
    /**
     * Award Livras for receiving a comment
     */
    async awardForCommentReceived(userId, postId, commenterId, commentId) {
        const amount = await this.getConfigValue('COMMENT_RECEIVED');
        return this.addLivras(userId, {
            type: 'EARNED_COMMENT',
            amount,
            metadata: { postId, commenterId, commentId },
        });
    }
    /**
     * Award Livras for receiving a follower
     */
    async awardForFollowReceived(userId, followerId) {
        const amount = await this.getConfigValue('FOLLOW_RECEIVED');
        return this.addLivras(userId, {
            type: 'EARNED_FOLLOW',
            amount,
            metadata: { followerId },
        });
    }
    /**
     * Award Livras for creating a post
     */
    async awardForPostCreated(userId, postId) {
        const amount = await this.getConfigValue('POST_CREATED');
        return this.addLivras(userId, {
            type: 'EARNED_POST',
            amount,
            metadata: { postId },
        });
    }
    /**
     * Award Livras for completing a campaign
     */
    async awardForCampaignCompleted(userId, campaignId) {
        const amount = await this.getConfigValue('CAMPAIGN_COMPLETED');
        return this.addLivras(userId, {
            type: 'EARNED_CAMPAIGN',
            amount,
            metadata: { campaignId },
        });
    }
    /**
     * Award Livras for unlocking an achievement
     */
    async awardForAchievementUnlocked(userId, achievementId, bonusAmount) {
        const defaultAmount = await this.getConfigValue('ACHIEVEMENT_UNLOCKED');
        const amount = bonusAmount || defaultAmount;
        return this.addLivras(userId, {
            type: 'EARNED_ACHIEVEMENT',
            amount,
            metadata: { achievementId },
        });
    }
    /**
     * Award monthly bonus for subscription plan
     */
    async awardMonthlyPlanBonus(userId, plan) {
        const configKey = plan === 'PRO' ? 'PRO_MONTHLY_BONUS' : 'PREMIUM_MONTHLY_BONUS';
        const amount = await this.getConfigValue(configKey);
        return this.addLivras(userId, {
            type: 'EARNED_PLAN',
            amount,
            metadata: { plan, period: new Date().toISOString().slice(0, 7) },
        });
    }
    // ========== Convenience methods for spending Livras ==========
    /**
     * Spend Livras for TTS generation
     */
    async spendForTTS(userId, chapterId) {
        const amount = await this.getConfigValue('TTS_COST');
        return this.spendLivras(userId, {
            type: 'SPENT_TTS',
            amount,
            metadata: { chapterId },
        });
    }
    /**
     * Spend Livras for image generation
     */
    async spendForImageGeneration(userId, description) {
        const amount = await this.getConfigValue('IMAGE_GENERATION_COST');
        return this.spendLivras(userId, {
            type: 'SPENT_IMAGE',
            amount,
            metadata: { description },
        });
    }
    /**
     * Spend Livras for character creation
     */
    async spendForCharacterCreation(userId, characterId) {
        const amount = await this.getConfigValue('CHARACTER_CREATION_COST');
        return this.spendLivras(userId, {
            type: 'SPENT_CHARACTER',
            amount,
            metadata: { characterId },
        });
    }
    /**
     * Spend Livras for post boost
     */
    async spendForPostBoost(userId, postId) {
        const amount = await this.getConfigValue('POST_BOOST_COST');
        return this.spendLivras(userId, {
            type: 'SPENT_BOOST',
            amount,
            metadata: { postId },
        });
    }
    /**
     * Get cost for a specific action
     */
    async getCost(action) {
        const configKey = `${action}_COST`;
        return this.getConfigValue(configKey);
    }
}
exports.livraService = new LivraService();
