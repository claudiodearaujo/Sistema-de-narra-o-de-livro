/**
 * Livra Package Controller
 * Handles HTTP requests for Livra package purchases
 * Sprint 9: Planos e Pagamentos
 */

import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { stripeService } from '../services/stripe.service';
import crypto from 'crypto';

/**
 * GET /livras/packages
 * Get available Livra packages for purchase
 */
export async function getLivraPackages(req: Request, res: Response) {
  try {
    const packages = subscriptionService.getLivraPackages();
    res.json(packages);
  } catch (error) {
    console.error('Error getting Livra packages:', error);
    res.status(500).json({ error: 'Erro ao buscar pacotes de Livras' });
  }
}

/**
 * POST /livras/purchase/:packageId
 * Create a checkout session for Livra package purchase
 */
export async function purchaseLivraPackage(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const packageId = req.params.packageId as string;
    const { successUrl, cancelUrl } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'ID do pacote é obrigatório' });
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'URLs de retorno são obrigatórias' });
    }

    // Validate package exists
    const packages = subscriptionService.getLivraPackages();
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Pacote não encontrado' });
    }

    if (!stripeService.isConfigured()) {
      return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
    }

    const idempotencyKey = crypto.randomUUID();
    const session = await subscriptionService.createLivraCheckoutSession(
      userId,
      packageId,
      successUrl,
      cancelUrl,
      idempotencyKey
    );

    res.json(session);
  } catch (error) {
    console.error('Error creating Livra purchase session:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de compra' });
  }
}
