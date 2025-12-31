"use strict";
/**
 * Subscription Routes
 * Sprint 9: Planos e Pagamentos
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const subscription_controller_1 = require("../controllers/subscription.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/plans', subscription_controller_1.getPlans);
// Protected routes
router.get('/', auth_middleware_1.authenticate, subscription_controller_1.getSubscription);
router.get('/features', auth_middleware_1.authenticate, subscription_controller_1.getPlanFeatures);
router.post('/checkout', auth_middleware_1.authenticate, subscription_controller_1.createCheckoutSession);
router.post('/portal', auth_middleware_1.authenticate, subscription_controller_1.createPortalSession);
router.post('/cancel', auth_middleware_1.authenticate, subscription_controller_1.cancelSubscription);
router.post('/resume', auth_middleware_1.authenticate, subscription_controller_1.resumeSubscription);
exports.default = router;
