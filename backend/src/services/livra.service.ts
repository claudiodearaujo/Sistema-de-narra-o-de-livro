import { LivraTransactionType } from '@prisma/client';
import prisma from '../lib/prisma';

// WebSocket emitter type
type WebSocketEmitter = (userId: string, event: string, data: any) => void;
let wsEmitter: WebSocketEmitter | null = null;

/**
 * Set WebSocket emitter for real-time updates
 */
export function setLivraWebSocketEmitter(emitter: WebSocketEmitter): void {
  wsEmitter = emitter;
}

/**
 * Emit Livra update event to user
 */
function emitLivraUpdate(userId: string, transaction: LivraTransactionDto): void {
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
const DEFAULT_LIVRA_CONFIG: Record<string, number> = {
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

export interface LivraBalanceDto {
  balance: number;
  lifetime: number;
  spent: number;
}

export interface LivraTransactionDto {
  id: string;
  type: LivraTransactionType;
  amount: number;
  balance: number;
  metadata: any;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface AddLivrasDto {
  type: LivraTransactionType;
  amount: number;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface SpendLivrasDto {
  type: LivraTransactionType;
  amount: number;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  type?: LivraTransactionType;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedTransactions {
  transactions: LivraTransactionDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class LivraService {
  /**
   * Get user's Livra balance
   */
  async getBalance(userId: string): Promise<LivraBalanceDto> {
    let balance = await prisma.livraBalance.findUnique({
      where: { userId },
    });

    // Create balance record if it doesn't exist
    if (!balance) {
      balance = await prisma.livraBalance.create({
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
  async addLivras(userId: string, dto: AddLivrasDto): Promise<LivraTransactionDto> {
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
    const result = await prisma.$transaction(async (tx) => {
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
  async spendLivras(userId: string, dto: SpendLivrasDto): Promise<LivraTransactionDto> {
    const { type, amount, metadata } = dto;

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
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
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await prisma.livraBalance.findUnique({
      where: { userId },
    });

    return balance ? balance.balance >= amount : false;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: TransactionFilters
  ): Promise<PaginatedTransactions> {
    const where: any = { userId };

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
      prisma.livraTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.livraTransaction.count({ where }),
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
  async getConfigValue(key: string): Promise<number> {
    const config = await prisma.livraConfig.findUnique({
      where: { key },
    });

    return config ? config.value : (DEFAULT_LIVRA_CONFIG[key] || 0);
  }

  /**
   * Set configuration value
   */
  async setConfigValue(key: string, value: number, description?: string): Promise<void> {
    await prisma.livraConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  /**
   * Get all configuration values
   */
  async getAllConfigValues(): Promise<Record<string, number>> {
    const configs = await prisma.livraConfig.findMany();
    const result: Record<string, number> = { ...DEFAULT_LIVRA_CONFIG };

    for (const config of configs) {
      result[config.key] = config.value;
    }

    return result;
  }

  /**
   * Process expired Livras (should be called by a cron job)
   */
  async processExpiredLivras(): Promise<number> {
    const now = new Date();
    let processedCount = 0;

    // Find all transactions that have expired and haven't been processed
    const expiredTransactions = await prisma.livraTransaction.findMany({
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
    const userExpiredAmounts: Record<string, number> = {};
    
    for (const tx of expiredTransactions) {
      if (!userExpiredAmounts[tx.userId]) {
        userExpiredAmounts[tx.userId] = 0;
      }
      userExpiredAmounts[tx.userId] += tx.amount;
    }

    // Process each user's expired Livras
    for (const [userId, expiredAmount] of Object.entries(userExpiredAmounts)) {
      const balance = await prisma.livraBalance.findUnique({
        where: { userId },
      });

      if (balance) {
        // Calculate actual expired amount (can't expire more than current balance)
        const actualExpiredAmount = Math.min(expiredAmount, balance.balance);

        if (actualExpiredAmount > 0) {
          await prisma.$transaction(async (tx) => {
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
  async awardForLikeReceived(userId: string, postId: string, likerId: string): Promise<LivraTransactionDto> {
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
  async awardForCommentReceived(userId: string, postId: string, commenterId: string, commentId: string): Promise<LivraTransactionDto> {
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
  async awardForFollowReceived(userId: string, followerId: string): Promise<LivraTransactionDto> {
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
  async awardForPostCreated(userId: string, postId: string): Promise<LivraTransactionDto> {
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
  async awardForCampaignCompleted(userId: string, campaignId: string): Promise<LivraTransactionDto> {
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
  async awardForAchievementUnlocked(userId: string, achievementId: string, bonusAmount?: number): Promise<LivraTransactionDto> {
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
  async awardMonthlyPlanBonus(userId: string, plan: 'PREMIUM' | 'PRO'): Promise<LivraTransactionDto> {
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
  async spendForTTS(userId: string, chapterId: string): Promise<LivraTransactionDto> {
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
  async spendForImageGeneration(userId: string, description: string): Promise<LivraTransactionDto> {
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
  async spendForCharacterCreation(userId: string, characterId: string): Promise<LivraTransactionDto> {
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
  async spendForPostBoost(userId: string, postId: string): Promise<LivraTransactionDto> {
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
  async getCost(action: 'TTS' | 'IMAGE' | 'CHARACTER' | 'BOOST'): Promise<number> {
    const configKey = `${action}_COST`;
    return this.getConfigValue(configKey);
  }
}

export const livraService = new LivraService();
