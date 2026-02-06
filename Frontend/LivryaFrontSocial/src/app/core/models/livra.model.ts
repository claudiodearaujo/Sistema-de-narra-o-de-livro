/**
 * Livra Transaction Types
 */
export type LivraTransactionType =
  | 'EARNED_LIKE'
  | 'EARNED_COMMENT'
  | 'EARNED_FOLLOW'
  | 'EARNED_POST'
  | 'EARNED_CAMPAIGN'
  | 'EARNED_PLAN'
  | 'EARNED_ACHIEVEMENT'
  | 'EARNED_PURCHASE'
  | 'SPENT_TTS'
  | 'SPENT_IMAGE'
  | 'SPENT_CHARACTER'
  | 'SPENT_BOOST'
  | 'EXPIRED'
  | 'ADMIN_ADJUSTMENT';

/**
 * Livra Balance DTO
 */
export interface LivraBalance {
  balance: number;
  lifetime: number;
  spent: number;
}

/**
 * Livra Transaction DTO
 */
export interface LivraTransaction {
  id: string;
  type: LivraTransactionType;
  amount: number;
  balance: number;
  metadata: any;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Paginated Transactions Response
 */
export interface PaginatedTransactions {
  transactions: LivraTransaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Transaction Filters
 */
export interface TransactionFilters {
  type?: LivraTransactionType;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Cost Check Response
 */
export interface CostCheckResponse {
  action: string;
  cost: number;
}

/**
 * Afford Check Response
 */
export interface AffordCheckResponse {
  canAfford: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
}

/**
 * Livra Update WebSocket Event
 */
export interface LivraUpdateEvent {
  type: LivraTransactionType;
  amount: number;
  balance: number;
  timestamp: Date;
}

/**
 * Get transaction type display info
 * Returns a translation key for the label that should be translated by the consuming component
 */
export function getTransactionTypeInfo(type: LivraTransactionType): {
  labelKey: string;
  icon: string;
  color: string;
  isEarned: boolean;
} {
  const typeMap: Record<LivraTransactionType, { labelKey: string; icon: string; color: string; isEarned: boolean }> = {
    EARNED_LIKE: { labelKey: 'livraTransactions.earnedLike', icon: 'pi-heart-fill', color: 'text-accent-500', isEarned: true },
    EARNED_COMMENT: { labelKey: 'livraTransactions.earnedComment', icon: 'pi-comment', color: 'text-primary-500', isEarned: true },
    EARNED_FOLLOW: { labelKey: 'livraTransactions.earnedFollow', icon: 'pi-user-plus', color: 'text-primary-600', isEarned: true },
    EARNED_POST: { labelKey: 'livraTransactions.earnedPost', icon: 'pi-pencil', color: 'text-primary-700', isEarned: true },
    EARNED_CAMPAIGN: { labelKey: 'livraTransactions.earnedCampaign', icon: 'pi-trophy', color: 'text-livra-500', isEarned: true },
    EARNED_PLAN: { labelKey: 'livraTransactions.earnedPlan', icon: 'pi-star-fill', color: 'text-livra-400', isEarned: true },
    EARNED_ACHIEVEMENT: { labelKey: 'livraTransactions.earnedAchievement', icon: 'pi-shield', color: 'text-primary-500', isEarned: true },
    EARNED_PURCHASE: { labelKey: 'livraTransactions.earnedPurchase', icon: 'pi-shopping-cart', color: 'text-teal-500', isEarned: true },
    SPENT_TTS: { labelKey: 'livraTransactions.spentTts', icon: 'pi-volume-up', color: 'text-orange-500', isEarned: false },
    SPENT_IMAGE: { labelKey: 'livraTransactions.spentImage', icon: 'pi-image', color: 'text-cyan-500', isEarned: false },
    SPENT_CHARACTER: { labelKey: 'livraTransactions.spentCharacter', icon: 'pi-user', color: 'text-violet-500', isEarned: false },
    SPENT_BOOST: { labelKey: 'livraTransactions.spentBoost', icon: 'pi-bolt', color: 'text-red-500', isEarned: false },
    EXPIRED: { labelKey: 'livraTransactions.expired', icon: 'pi-clock', color: 'text-secondary-500', isEarned: false },
    ADMIN_ADJUSTMENT: { labelKey: 'livraTransactions.adminAdjustment', icon: 'pi-cog', color: 'text-slate-500', isEarned: true },
  };

  return typeMap[type] || { labelKey: type, icon: 'pi-circle', color: 'text-secondary-500', isEarned: false };
}
