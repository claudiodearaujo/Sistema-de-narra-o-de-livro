"use strict";
/**
 * Subscription Controller
 * Handles HTTP requests for subscriptions and payments
 * Sprint 9: Planos e Pagamentos
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscription = getSubscription;
exports.getPlans = getPlans;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.cancelSubscription = cancelSubscription;
exports.resumeSubscription = resumeSubscription;
exports.getPlanFeatures = getPlanFeatures;
const subscription_service_1 = require("../services/subscription.service");
const stripe_service_1 = require("../services/stripe.service");
const crypto_1 = __importDefault(require("crypto"));
/**
 * GET /subscription
 * Get current user's subscription
 */
async function getSubscription(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const subscription = await subscription_service_1.subscriptionService.getSubscription(userId);
        if (!subscription) {
            // Return default free subscription
            return res.json({
                plan: 'FREE',
                status: 'ACTIVE',
                features: await subscription_service_1.subscriptionService.getPlanFeatures(userId),
            });
        }
        const features = await subscription_service_1.subscriptionService.getPlanFeatures(userId);
        res.json({
            ...subscription,
            features,
        });
    }
    catch (error) {
        console.error('Error getting subscription:', error);
        res.status(500).json({ error: 'Erro ao buscar assinatura' });
    }
}
/**
 * GET /subscription/plans
 * Get available subscription plans
 */
async function getPlans(req, res) {
    try {
        const plans = subscription_service_1.subscriptionService.getPlans();
        res.json(plans);
    }
    catch (error) {
        console.error('Error getting plans:', error);
        res.status(500).json({ error: 'Erro ao buscar planos' });
    }
}
/**
 * POST /subscription/checkout
 * Create a checkout session for subscription
 */
async function createCheckoutSession(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const { plan, billingPeriod, successUrl, cancelUrl } = req.body;
        if (!plan || !['PREMIUM', 'PRO'].includes(plan)) {
            return res.status(400).json({ error: 'Plano inválido' });
        }
        if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
            return res.status(400).json({ error: 'Período de cobrança inválido' });
        }
        if (!successUrl || !cancelUrl) {
            return res.status(400).json({ error: 'URLs de retorno são obrigatórias' });
        }
        if (!stripe_service_1.stripeService.isConfigured()) {
            return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
        }
        const idempotencyKey = crypto_1.default.randomUUID();
        const session = await subscription_service_1.subscriptionService.createCheckoutSession(userId, {
            plan,
            billingPeriod,
            successUrl,
            cancelUrl,
            idempotencyKey,
        });
        res.json(session);
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
    }
}
/**
 * POST /subscription/portal
 * Create a customer portal session
 */
async function createPortalSession(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const { returnUrl } = req.body;
        if (!returnUrl) {
            return res.status(400).json({ error: 'URL de retorno é obrigatória' });
        }
        if (!stripe_service_1.stripeService.isConfigured()) {
            return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
        }
        const idempotencyKey = crypto_1.default.randomUUID();
        const session = await subscription_service_1.subscriptionService.createPortalSession(userId, returnUrl, idempotencyKey);
        res.json(session);
    }
    catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: 'Erro ao criar sessão do portal' });
    }
}
/**
 * POST /subscription/cancel
 * Cancel subscription at period end
 */
async function cancelSubscription(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        if (!stripe_service_1.stripeService.isConfigured()) {
            return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
        }
        const idempotencyKey = crypto_1.default.randomUUID();
        await subscription_service_1.subscriptionService.cancelSubscription(userId, idempotencyKey);
        res.json({ message: 'Assinatura será cancelada ao final do período' });
    }
    catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ error: error.message || 'Erro ao cancelar assinatura' });
    }
}
/**
 * POST /subscription/resume
 * Resume a cancelled subscription
 */
async function resumeSubscription(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        if (!stripe_service_1.stripeService.isConfigured()) {
            return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
        }
        const idempotencyKey = crypto_1.default.randomUUID();
        await subscription_service_1.subscriptionService.resumeSubscription(userId, idempotencyKey);
        res.json({ message: 'Assinatura reativada com sucesso' });
    }
    catch (error) {
        console.error('Error resuming subscription:', error);
        res.status(500).json({ error: error.message || 'Erro ao reativar assinatura' });
    }
}
/**
 * GET /subscription/features
 * Get plan features for current user
 */
async function getPlanFeatures(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const features = await subscription_service_1.subscriptionService.getPlanFeatures(userId);
        const plan = await subscription_service_1.subscriptionService.getUserPlan(userId);
        res.json({ plan, features });
    }
    catch (error) {
        console.error('Error getting plan features:', error);
        res.status(500).json({ error: 'Erro ao buscar recursos do plano' });
    }
}
