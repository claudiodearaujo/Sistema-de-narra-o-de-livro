"use strict";
/**
 * Stripe Service
 * Handles all Stripe integration for subscriptions and payments
 * Sprint 9: Planos e Pagamentos
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = exports.LIVRA_PACKAGES = exports.PLAN_PRICES = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Plan pricing configuration
exports.PLAN_PRICES = {
    PREMIUM: {
        monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
        yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
        amount: { monthly: 990, yearly: 9900 }, // in cents (R$ 9.90/month or R$ 99/year)
    },
    PRO: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
        amount: { monthly: 2990, yearly: 29900 }, // in cents (R$ 29.90/month or R$ 299/year)
    },
};
// Livra package configuration (for one-time purchases)
exports.LIVRA_PACKAGES = [
    { id: 'livras_100', name: '100 Livras', amount: 100, price: 490 },
    { id: 'livras_500', name: '500 Livras', amount: 500, price: 1990 },
    { id: 'livras_1000', name: '1000 Livras + 100 Bônus', amount: 1100, price: 3490 },
    { id: 'livras_5000', name: '5000 Livras + 1000 Bônus', amount: 6000, price: 14990 },
];
class StripeService {
    constructor() {
        this.baseUrl = 'https://api.stripe.com/v1';
        this.apiKey = process.env.STRIPE_SECRET_KEY || '';
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        if (!this.apiKey) {
            console.warn('⚠️ STRIPE_SECRET_KEY not set - Stripe features will be disabled');
        }
    }
    /**
     * Check if Stripe is configured
     */
    isConfigured() {
        return !!this.apiKey && this.apiKey !== '';
    }
    /**
     * Make a request to Stripe API
     */
    async stripeRequest(endpoint, method = 'GET', body) {
        if (!this.isConfigured()) {
            throw new Error('Stripe is not configured');
        }
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        const options = {
            method,
            headers,
        };
        if (body) {
            const formData = new URLSearchParams();
            const flattenObject = (obj, prefix = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    const newKey = prefix ? `${prefix}[${key}]` : key;
                    if (value !== undefined && value !== null) {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                            flattenObject(value, newKey);
                        }
                        else if (Array.isArray(value)) {
                            value.forEach((item, index) => {
                                if (typeof item === 'object') {
                                    flattenObject(item, `${newKey}[${index}]`);
                                }
                                else {
                                    formData.append(`${newKey}[${index}]`, String(item));
                                }
                            });
                        }
                        else {
                            formData.append(newKey, String(value));
                        }
                    }
                }
            };
            flattenObject(body);
            options.body = formData.toString();
        }
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            console.error('Stripe API error:', data);
            throw new Error(data.error?.message || 'Stripe API error');
        }
        return data;
    }
    /**
     * Get or create a Stripe customer for a user
     */
    async getOrCreateCustomer(userId) {
        // Check if user already has a Stripe customer ID
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { userId },
            select: { stripeCustomerId: true },
        });
        if (subscription?.stripeCustomerId) {
            return subscription.stripeCustomerId;
        }
        // Get user data
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Create Stripe customer
        const customer = await this.stripeRequest('/customers', 'POST', {
            email: user.email,
            name: user.name,
            metadata: { userId },
        });
        // Save customer ID
        await prisma_1.default.subscription.upsert({
            where: { userId },
            create: {
                userId,
                stripeCustomerId: customer.id,
                plan: 'FREE',
                status: 'ACTIVE',
            },
            update: {
                stripeCustomerId: customer.id,
            },
        });
        return customer.id;
    }
    /**
     * Create a checkout session for subscription
     */
    async createCheckoutSession(userId, plan, billingPeriod = 'monthly', successUrl, cancelUrl) {
        const customerId = await this.getOrCreateCustomer(userId);
        const priceId = exports.PLAN_PRICES[plan][billingPeriod];
        const session = await this.stripeRequest('/checkout/sessions', 'POST', {
            customer: customerId,
            mode: 'subscription',
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': 1,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId,
                plan,
                billingPeriod,
            },
            subscription_data: {
                metadata: {
                    userId,
                    plan,
                },
            },
        });
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    /**
     * Create a checkout session for Livra package purchase
     */
    async createLivraCheckoutSession(userId, packageId, successUrl, cancelUrl) {
        const pkg = exports.LIVRA_PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            throw new Error('Package not found');
        }
        const customerId = await this.getOrCreateCustomer(userId);
        const session = await this.stripeRequest('/checkout/sessions', 'POST', {
            customer: customerId,
            mode: 'payment',
            'line_items[0][price_data][currency]': 'brl',
            'line_items[0][price_data][product_data][name]': pkg.name,
            'line_items[0][price_data][unit_amount]': pkg.price,
            'line_items[0][quantity]': 1,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId,
                type: 'livra_purchase',
                packageId,
                livraAmount: pkg.amount.toString(),
            },
        });
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    /**
     * Create a customer portal session
     */
    async createPortalSession(userId, returnUrl) {
        const customerId = await this.getOrCreateCustomer(userId);
        const session = await this.stripeRequest('/billing_portal/sessions', 'POST', {
            customer: customerId,
            return_url: returnUrl,
        });
        return { url: session.url };
    }
    /**
     * Cancel subscription at period end
     */
    async cancelSubscription(userId) {
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { userId },
            select: { stripeSubscriptionId: true },
        });
        if (!subscription?.stripeSubscriptionId) {
            throw new Error('No active subscription found');
        }
        await this.stripeRequest(`/subscriptions/${subscription.stripeSubscriptionId}`, 'POST', { cancel_at_period_end: true });
        await prisma_1.default.subscription.update({
            where: { userId },
            data: { cancelAtPeriodEnd: true },
        });
    }
    /**
     * Resume a cancelled subscription (before period end)
     */
    async resumeSubscription(userId) {
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { userId },
            select: { stripeSubscriptionId: true },
        });
        if (!subscription?.stripeSubscriptionId) {
            throw new Error('No subscription found');
        }
        await this.stripeRequest(`/subscriptions/${subscription.stripeSubscriptionId}`, 'POST', { cancel_at_period_end: false });
        await prisma_1.default.subscription.update({
            where: { userId },
            data: { cancelAtPeriodEnd: false },
        });
    }
    /**
     * Get Stripe subscription details
     */
    async getStripeSubscription(subscriptionId) {
        try {
            return await this.stripeRequest(`/subscriptions/${subscriptionId}`);
        }
        catch (error) {
            console.error('Error fetching Stripe subscription:', error);
            return null;
        }
    }
    /**
     * Verify webhook signature (for Express raw body)
     */
    verifyWebhookSignature(payload, signature) {
        if (!this.webhookSecret) {
            console.warn('Webhook secret not configured');
            return null;
        }
        try {
            // Simple signature verification (in production, use Stripe's crypto)
            const crypto = require('crypto');
            const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
            // Parse the signature header
            const elements = signature.split(',');
            let timestamp = '';
            let expectedSig = '';
            for (const element of elements) {
                const [key, value] = element.split('=');
                if (key === 't')
                    timestamp = value;
                if (key === 'v1')
                    expectedSig = value;
            }
            // Verify timestamp is recent (within 5 minutes)
            const timestampNum = parseInt(timestamp, 10);
            const now = Math.floor(Date.now() / 1000);
            if (Math.abs(now - timestampNum) > 300) {
                console.warn('Webhook timestamp too old');
                return null;
            }
            // Create expected signature
            const signedPayload = `${timestamp}.${payloadString}`;
            const computedSig = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(signedPayload)
                .digest('hex');
            if (computedSig !== expectedSig) {
                console.warn('Webhook signature mismatch');
                return null;
            }
            return JSON.parse(payloadString);
        }
        catch (error) {
            console.error('Error verifying webhook signature:', error);
            return null;
        }
    }
    /**
     * Map Stripe plan to our SubscriptionPlan
     */
    mapStripePlanToLocal(priceId) {
        if (priceId === exports.PLAN_PRICES.PRO.monthly || priceId === exports.PLAN_PRICES.PRO.yearly) {
            return 'PRO';
        }
        if (priceId === exports.PLAN_PRICES.PREMIUM.monthly || priceId === exports.PLAN_PRICES.PREMIUM.yearly) {
            return 'PREMIUM';
        }
        return 'FREE';
    }
    /**
     * Map Stripe status to our SubscriptionStatus
     */
    mapStripeStatusToLocal(status) {
        switch (status) {
            case 'active':
                return 'ACTIVE';
            case 'past_due':
                return 'PAST_DUE';
            case 'canceled':
                return 'CANCELLED';
            case 'trialing':
                return 'TRIALING';
            default:
                return 'ACTIVE';
        }
    }
    /**
     * Get available plans with pricing
     */
    getPlans() {
        return [
            {
                id: 'FREE',
                name: 'Gratuito',
                description: 'Comece a criar gratuitamente',
                features: [
                    '3 livros',
                    '5 personagens por livro',
                    '10 falas por capítulo',
                    '5 minutos de áudio TTS/mês',
                    'Acesso à comunidade',
                ],
                price: { monthly: 0, yearly: 0 },
                livrasMonthly: 0,
            },
            {
                id: 'PREMIUM',
                name: 'Premium',
                description: 'Para escritores dedicados',
                features: [
                    '10 livros',
                    '20 personagens por livro',
                    '50 falas por capítulo',
                    '60 minutos de áudio TTS/mês',
                    'Vozes premium',
                    'Suporte prioritário',
                    '100 Livras/mês',
                ],
                price: {
                    monthly: exports.PLAN_PRICES.PREMIUM.amount.monthly / 100,
                    yearly: exports.PLAN_PRICES.PREMIUM.amount.yearly / 100
                },
                priceId: exports.PLAN_PRICES.PREMIUM,
                livrasMonthly: 100,
            },
            {
                id: 'PRO',
                name: 'Pro',
                description: 'Para profissionais e estúdios',
                features: [
                    'Livros ilimitados',
                    'Personagens ilimitados',
                    'Falas ilimitadas',
                    '300 minutos de áudio TTS/mês',
                    'Todas as vozes',
                    'API access',
                    'Suporte dedicado',
                    '500 Livras/mês',
                ],
                price: {
                    monthly: exports.PLAN_PRICES.PRO.amount.monthly / 100,
                    yearly: exports.PLAN_PRICES.PRO.amount.yearly / 100
                },
                priceId: exports.PLAN_PRICES.PRO,
                livrasMonthly: 500,
            },
        ];
    }
    /**
     * Get Livra packages
     */
    getLivraPackages() {
        return exports.LIVRA_PACKAGES.map(pkg => ({
            ...pkg,
            displayPrice: (pkg.price / 100).toFixed(2),
            pricePerLivra: ((pkg.price / 100) / pkg.amount).toFixed(2),
        }));
    }
}
exports.stripeService = new StripeService();
exports.default = exports.stripeService;
