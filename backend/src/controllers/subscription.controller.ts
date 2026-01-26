/**
 * Subscription Controller
 * Handles HTTP requests for subscriptions and payments
 * Sprint 9: Planos e Pagamentos
 */

import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { stripeService } from '../services/stripe.service';
import crypto from 'crypto';

/**
 * GET /subscription
 * Get current user's subscription
 */
export async function getSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const subscription = await subscriptionService.getSubscription(userId);
    
    if (!subscription) {
      // Return default free subscription
      return res.json({
        plan: 'FREE',
        status: 'ACTIVE',
        features: await subscriptionService.getPlanFeatures(userId),
      });
    }

    const features = await subscriptionService.getPlanFeatures(userId);
    
    res.json({
      ...subscription,
      features,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
}

/**
 * GET /subscription/plans
 * Get available subscription plans
 */
export async function getPlans(req: Request, res: Response) {
  try {
    const plans = subscriptionService.getPlans();
    res.json(plans);
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({ error: 'Erro ao buscar planos' });
  }
}

/**
 * POST /subscription/checkout
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(req: Request, res: Response) {
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

    if (!stripeService.isConfigured()) {
      return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
    }

    const idempotencyKey = crypto.randomUUID();
    const session = await subscriptionService.createCheckoutSession(userId, {
      plan,
      billingPeriod,
      successUrl,
      cancelUrl,
      idempotencyKey,
    });

    res.json(session);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
  }
}

/**
 * POST /subscription/portal
 * Create a customer portal session
 */
export async function createPortalSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { returnUrl } = req.body;

    if (!returnUrl) {
      return res.status(400).json({ error: 'URL de retorno é obrigatória' });
    }

    if (!stripeService.isConfigured()) {
      return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
    }

    const idempotencyKey = crypto.randomUUID();
    const session = await subscriptionService.createPortalSession(userId, returnUrl, idempotencyKey);

    res.json(session);
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Erro ao criar sessão do portal' });
  }
}

/**
 * POST /subscription/cancel
 * Cancel subscription at period end
 */
export async function cancelSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!stripeService.isConfigured()) {
      return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
    }

    const idempotencyKey = crypto.randomUUID();
    await subscriptionService.cancelSubscription(userId, idempotencyKey);

    res.json({ message: 'Assinatura será cancelada ao final do período' });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Erro ao cancelar assinatura' });
  }
}

/**
 * POST /subscription/resume
 * Resume a cancelled subscription
 */
export async function resumeSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!stripeService.isConfigured()) {
      return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
    }

    const idempotencyKey = crypto.randomUUID();
    await subscriptionService.resumeSubscription(userId, idempotencyKey);

    res.json({ message: 'Assinatura reativada com sucesso' });
  } catch (error: any) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: error.message || 'Erro ao reativar assinatura' });
  }
}

/**
 * GET /subscription/features
 * Get plan features for current user
 */
export async function getPlanFeatures(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const features = await subscriptionService.getPlanFeatures(userId);
    const plan = await subscriptionService.getUserPlan(userId);

    res.json({ plan, features });
  } catch (error) {
    console.error('Error getting plan features:', error);
    res.status(500).json({ error: 'Erro ao buscar recursos do plano' });
  }
}
