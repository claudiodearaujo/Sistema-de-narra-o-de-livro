/**
 * Subscription Routes
 * Sprint 9: Planos e Pagamentos
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getSubscription,
  getPlans,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  resumeSubscription,
  getPlanFeatures,
} from '../controllers/subscription.controller';

const router = Router();

// Public routes
router.get('/plans', getPlans);

// Protected routes
router.get('/', authenticate, getSubscription);
router.get('/features', authenticate, getPlanFeatures);
router.post('/checkout', authenticate, createCheckoutSession);
router.post('/portal', authenticate, createPortalSession);
router.post('/cancel', authenticate, cancelSubscription);
router.post('/resume', authenticate, resumeSubscription);

export default router;
