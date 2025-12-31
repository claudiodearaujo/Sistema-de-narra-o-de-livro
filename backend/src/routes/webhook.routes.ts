/**
 * Webhook Routes
 * Sprint 9: Planos e Pagamentos
 */

import { Router, raw } from 'express';
import { handleStripeWebhook } from '../controllers/webhook.controller';

const router = Router();

// Stripe webhook - needs raw body for signature verification
router.post('/stripe', raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
