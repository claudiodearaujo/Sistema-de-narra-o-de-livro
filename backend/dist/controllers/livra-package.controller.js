"use strict";
/**
 * Livra Package Controller
 * Handles HTTP requests for Livra package purchases
 * Sprint 9: Planos e Pagamentos
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLivraPackages = getLivraPackages;
exports.purchaseLivraPackage = purchaseLivraPackage;
const subscription_service_1 = require("../services/subscription.service");
const stripe_service_1 = require("../services/stripe.service");
const crypto_1 = __importDefault(require("crypto"));
/**
 * GET /livras/packages
 * Get available Livra packages for purchase
 */
async function getLivraPackages(req, res) {
    try {
        const packages = subscription_service_1.subscriptionService.getLivraPackages();
        res.json(packages);
    }
    catch (error) {
        console.error('Error getting Livra packages:', error);
        res.status(500).json({ error: 'Erro ao buscar pacotes de Livras' });
    }
}
/**
 * POST /livras/purchase/:packageId
 * Create a checkout session for Livra package purchase
 */
async function purchaseLivraPackage(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const { packageId } = req.params;
        const { successUrl, cancelUrl } = req.body;
        if (!packageId) {
            return res.status(400).json({ error: 'ID do pacote é obrigatório' });
        }
        if (!successUrl || !cancelUrl) {
            return res.status(400).json({ error: 'URLs de retorno são obrigatórias' });
        }
        // Validate package exists
        const packages = subscription_service_1.subscriptionService.getLivraPackages();
        const pkg = packages.find(p => p.id === packageId);
        if (!pkg) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }
        if (!stripe_service_1.stripeService.isConfigured()) {
            return res.status(503).json({ error: 'Sistema de pagamento não configurado' });
        }
        const idempotencyKey = crypto_1.default.randomUUID();
        const session = await subscription_service_1.subscriptionService.createLivraCheckoutSession(userId, packageId, successUrl, cancelUrl, idempotencyKey);
        res.json(session);
    }
    catch (error) {
        console.error('Error creating Livra purchase session:', error);
        res.status(500).json({ error: 'Erro ao criar sessão de compra' });
    }
}
