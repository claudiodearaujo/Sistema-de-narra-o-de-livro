/**
 * Subscription Models
 * Sprint 9: Planos e Pagamentos
 */

export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  features?: PlanFeatures;
}

export interface PlanFeatures {
  maxBooks: number;
  maxCharactersPerBook: number;
  maxSpeechesPerChapter: number;
  ttsMinutesPerMonth: number;
  canUsePremiumVoices: boolean;
  canAccessApi: boolean;
  monthlyLivras: number;
  maxDmsPerDay: number;
  canCreateGroups: boolean;
  maxStoriesPerDay: number;
}

export interface Plan {
  id: SubscriptionPlan;
  name: string;
  description: string;
  features: string[];
  price: {
    monthly: number;
    yearly: number;
  };
  priceId?: {
    monthly: string;
    yearly: string;
  };
  livrasMonthly: number;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface LivraPackage {
  id: string;
  name: string;
  amount: number;
  price: number;
  displayPrice: string;
  pricePerLivra: string;
}

export type BillingPeriod = 'monthly' | 'yearly';

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'PRO':
      return 'Pro';
    case 'PREMIUM':
      return 'Premium';
    default:
      return 'Gratuito';
  }
}

/**
 * Get plan badge color
 */
export function getPlanBadgeClass(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'PRO':
      return 'bg-primary-500 text-white';
    case 'PREMIUM':
      return 'bg-amber-500 text-white';
    default:
      return 'bg-secondary-500 text-white';
  }
}

/**
 * Check if plan is paid
 */
export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan !== 'FREE';
}

/**
 * Get plan icon
 */
export function getPlanIcon(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'PRO':
      return 'pi pi-star-fill';
    case 'PREMIUM':
      return 'pi pi-star';
    default:
      return 'pi pi-user';
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavings(monthly: number, yearly: number): number {
  const yearlyFromMonthly = monthly * 12;
  if (yearlyFromMonthly === 0) return 0;
  return Math.round(((yearlyFromMonthly - yearly) / yearlyFromMonthly) * 100);
}
