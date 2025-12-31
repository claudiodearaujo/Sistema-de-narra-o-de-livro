"use strict";
/**
 * Webhook Routes
 * Sprint 9: Planos e Pagamentos
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
// Stripe webhook - needs raw body for signature verification
router.post('/stripe', (0, express_1.raw)({ type: 'application/json' }), webhook_controller_1.handleStripeWebhook);
exports.default = router;
