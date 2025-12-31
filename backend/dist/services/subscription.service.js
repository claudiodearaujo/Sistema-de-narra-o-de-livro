"use strict";
/**
 * Subscription Service
 * Manages user subscriptions and plan features
 * Sprint 9: Planos e Pagamentos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.PLAN_FEATURES = void 0;
const client_1 = require("@prisma/client");
const stripe_service_1 = require("./stripe.service");
const livra_service_1 = require("./livra.service");
const prisma = new client_1.PrismaClient();
// Plan features configuration
exports.PLAN_FEATURES = {
    FREE: {
        maxBooks: 3,
        maxCharactersPerBook: 5,
        maxSpeechesPerChapter: 10,
        ttsMinutesPerMonth: 5,
        canUsePremiumVoices: false,
        canAccessApi: false,
        monthlyLivras: 0,
        maxDmsPerDay: 10,
        canCreateGroups: false,
        maxStoriesPerDay: 1,
    },
    PREMIUM: {
        maxBooks: 10,
        maxCharactersPerBook: 20,
        maxSpeechesPerChapter: 50,
        ttsMinutesPerMonth: 60,
        canUsePremiumVoices: true,
        canAccessApi: false,
        monthlyLivras: 100,
        maxDmsPerDay: 50,
        canCreateGroups: true,
        maxStoriesPerDay: 5,
    },
    PRO: {
        maxBooks: -1, // unlimited
        maxCharactersPerBook: -1,
        maxSpeechesPerChapter: -1,
        ttsMinutesPerMonth: 300,
        canUsePremiumVoices: true,
        canAccessApi: true,
        monthlyLivras: 500,
        maxDmsPerDay: -1,
        canCreateGroups: true,
        maxStoriesPerDay: -1,
    },
};
class SubscriptionService {
    /**
     * Get user's current subscription
     */
    async getSubscription(userId) {
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
        });
        if (!subscription) {
            return null;
        }
        return {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            createdAt: subscription.createdAt,
        };
    }
    /**
     * Get user's subscription plan (defaults to FREE)
     */
    async getUserPlan(userId) {
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
            select: { plan: true, status: true },
        });
        // If no subscription or not active, return FREE
        if (!subscription || subscription.status !== 'ACTIVE') {
            return 'FREE';
        }
        return subscription.plan;
    }
    /**
     * Get plan features for a user
     */
    async getPlanFeatures(userId) {
        const plan = await this.getUserPlan(userId);
        return exports.PLAN_FEATURES[plan];
    }
    /**
     * Create a checkout session for subscription upgrade
     */
    async createCheckoutSession(userId, data) {
        return stripe_service_1.stripeService.createCheckoutSession(userId, data.plan, data.billingPeriod, data.successUrl, data.cancelUrl);
    }
    /**
     * Create a portal session for subscription management
     */
    async createPortalSession(userId, returnUrl) {
        return stripe_service_1.stripeService.createPortalSession(userId, returnUrl);
    }
    /**
     * Cancel subscription at period end
     */
    async cancelSubscription(userId) {
        await stripe_service_1.stripeService.cancelSubscription(userId);
    }
    /**
     * Resume a cancelled subscription
     */
    async resumeSubscription(userId) {
        await stripe_service_1.stripeService.resumeSubscription(userId);
    }
    /**
     * Handle successful subscription checkout
     */
    async handleCheckoutCompleted(userId, stripeSubscriptionId, priceId) {
        const plan = stripe_service_1.stripeService.mapStripePlanToLocal(priceId);
        const stripeSubscription = await stripe_service_1.stripeService.getStripeSubscription(stripeSubscriptionId);
        await prisma.subscription.upsert({
            where: { userId },
            create: {
                userId,
                plan,
                status: 'ACTIVE',
                stripeSubscriptionId,
                stripePriceId: priceId,
                currentPeriodStart: stripeSubscription
                    ? new Date(stripeSubscription.current_period_start * 1000)
                    : new Date(),
                currentPeriodEnd: stripeSubscription
                    ? new Date(stripeSubscription.current_period_end * 1000)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            update: {
                plan,
                status: 'ACTIVE',
                stripeSubscriptionId,
                stripePriceId: priceId,
                currentPeriodStart: stripeSubscription
                    ? new Date(stripeSubscription.current_period_start * 1000)
                    : new Date(),
                currentPeriodEnd: stripeSubscription
                    ? new Date(stripeSubscription.current_period_end * 1000)
                    : undefined,
                cancelAtPeriodEnd: false,
            },
        });
        // Update user role based on plan
        const role = this.mapPlanToRole(plan);
        await prisma.user.update({
            where: { id: userId },
            data: { role },
        });
        // Give monthly Livras bonus
        const monthlyLivras = exports.PLAN_FEATURES[plan].monthlyLivras;
        if (monthlyLivras > 0) {
            await livra_service_1.livraService.addLivras(userId, {
                type: 'EARNED_PLAN',
                amount: monthlyLivras,
                metadata: { plan, reason: 'subscription_activated' },
            });
        }
    }
    /**
     * Handle subscription updated (renewal, plan change)
     */
    async handleSubscriptionUpdated(stripeSubscriptionId, status, priceId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd) {
        const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId },
        });
        if (!subscription) {
            console.warn(`Subscription not found: ${stripeSubscriptionId}`);
            return;
        }
        const plan = stripe_service_1.stripeService.mapStripePlanToLocal(priceId);
        const localStatus = stripe_service_1.stripeService.mapStripeStatusToLocal(status);
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                plan,
                status: localStatus,
                stripePriceId: priceId,
                currentPeriodStart: new Date(currentPeriodStart * 1000),
                currentPeriodEnd: new Date(currentPeriodEnd * 1000),
                cancelAtPeriodEnd,
            },
        });
        // Update user role
        const role = localStatus === 'ACTIVE' ? this.mapPlanToRole(plan) : 'USER';
        await prisma.user.update({
            where: { id: subscription.userId },
            data: { role },
        });
    }
    /**
     * Handle subscription cancelled
     */
    async handleSubscriptionCancelled(stripeSubscriptionId) {
        const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId },
        });
        if (!subscription) {
            console.warn(`Subscription not found: ${stripeSubscriptionId}`);
            return;
        }
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                plan: 'FREE',
                status: 'CANCELLED',
                stripeSubscriptionId: null,
                stripePriceId: null,
                cancelAtPeriodEnd: false,
            },
        });
        // Downgrade user role
        await prisma.user.update({
            where: { id: subscription.userId },
            data: { role: 'USER' },
        });
    }
    /**
     * Handle invoice paid (renewal)
     */
    async handleInvoicePaid(stripeSubscriptionId, customerId) {
        const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId },
        });
        if (!subscription) {
            console.warn(`Subscription not found for invoice: ${stripeSubscriptionId}`);
            return;
        }
        // Give monthly Livras for renewal
        const monthlyLivras = exports.PLAN_FEATURES[subscription.plan].monthlyLivras;
        if (monthlyLivras > 0) {
            await livra_service_1.livraService.addLivras(subscription.userId, {
                type: 'EARNED_PLAN',
                amount: monthlyLivras,
                metadata: {
                    plan: subscription.plan,
                    reason: 'subscription_renewal'
                },
            });
        }
    }
    /**
     * Handle Livra package purchase completed
     */
    async handleLivraPurchase(userId, livraAmount) {
        await livra_service_1.livraService.addLivras(userId, {
            type: 'EARNED_PURCHASE',
            amount: livraAmount,
            metadata: { reason: 'livra_package_purchase' },
        });
    }
    /**
     * Check if user has access to a feature
     */
    async hasFeatureAccess(userId, feature) {
        const features = await this.getPlanFeatures(userId);
        const value = features[feature];
        if (typeof value === 'boolean') {
            return value;
        }
        // For numeric limits, -1 means unlimited
        return value !== 0;
    }
    /**
     * Check if user has reached a limit
     */
    async checkLimit(userId, feature, currentCount) {
        const features = await this.getPlanFeatures(userId);
        const limit = features[feature];
        // -1 means unlimited
        if (limit === -1) {
            return { allowed: true, limit, current: currentCount };
        }
        return {
            allowed: currentCount < limit,
            limit,
            current: currentCount,
        };
    }
    /**
     * Map subscription plan to user role
     */
    mapPlanToRole(plan) {
        switch (plan) {
            case 'PRO':
                return 'PRO';
            case 'PREMIUM':
                return 'WRITER';
            default:
                return 'USER';
        }
    }
    /**
     * Process monthly Livra credits for all active subscriptions
     * This should be called by a cron job on the 1st of each month
     */
    async processMonthlyLivraCredits() {
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'ACTIVE',
                plan: { not: 'FREE' },
            },
            select: {
                userId: true,
                plan: true,
            },
        });
        let processed = 0;
        let errors = 0;
        for (const sub of activeSubscriptions) {
            try {
                const monthlyLivras = exports.PLAN_FEATURES[sub.plan].monthlyLivras;
                if (monthlyLivras > 0) {
                    await livra_service_1.livraService.addLivras(sub.userId, {
                        type: 'EARNED_PLAN',
                        amount: monthlyLivras,
                        metadata: {
                            plan: sub.plan,
                            reason: 'monthly_credit',
                            month: new Date().toISOString().slice(0, 7), // YYYY-MM
                        },
                    });
                    processed++;
                }
            }
            catch (error) {
                console.error(`Error processing monthly Livras for user ${sub.userId}:`, error);
                errors++;
            }
        }
        console.log(`Monthly Livra credits processed: ${processed} success, ${errors} errors`);
        return { processed, errors };
    }
    /**
     * Get available plans
     */
    getPlans() {
        return stripe_service_1.stripeService.getPlans();
    }
    /**
     * Get Livra packages
     */
    getLivraPackages() {
        return stripe_service_1.stripeService.getLivraPackages();
    }
    /**
     * Create checkout session for Livra package
     */
    async createLivraCheckoutSession(userId, packageId, successUrl, cancelUrl) {
        return stripe_service_1.stripeService.createLivraCheckoutSession(userId, packageId, successUrl, cancelUrl);
    }
}
exports.subscriptionService = new SubscriptionService();
exports.default = exports.subscriptionService;
