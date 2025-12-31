"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.getTransactions = getTransactions;
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
exports.getCost = getCost;
exports.canAfford = canAfford;
exports.adminAddLivras = adminAddLivras;
exports.getUserBalance = getUserBalance;
exports.getUserTransactions = getUserTransactions;
const livra_service_1 = require("../services/livra.service");
/**
 * Get current user's Livra balance
 */
async function getBalance(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const balance = await livra_service_1.livraService.getBalance(userId);
        res.json(balance);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get current user's transaction history
 */
async function getTransactions(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const filters = {};
        if (req.query.type) {
            filters.type = req.query.type;
        }
        if (req.query.startDate) {
            filters.startDate = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
            filters.endDate = new Date(req.query.endDate);
        }
        const transactions = await livra_service_1.livraService.getTransactionHistory(userId, page, limit, filters);
        res.json(transactions);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get all configuration values (admin only)
 */
async function getConfig(req, res, next) {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const config = await livra_service_1.livraService.getAllConfigValues();
        res.json(config);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Update configuration value (admin only)
 */
async function updateConfig(req, res, next) {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { key, value, description } = req.body;
        if (!key || typeof value !== 'number') {
            return res.status(400).json({ error: 'Key and numeric value are required' });
        }
        await livra_service_1.livraService.setConfigValue(key, value, description);
        res.json({ message: 'Configuration updated', key, value });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get cost for a specific action
 */
async function getCost(req, res, next) {
    try {
        const action = req.params.action?.toUpperCase();
        if (!['TTS', 'IMAGE', 'CHARACTER', 'BOOST'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be one of: TTS, IMAGE, CHARACTER, BOOST' });
        }
        const cost = await livra_service_1.livraService.getCost(action);
        res.json({ action, cost });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Check if user can afford an action
 */
async function canAfford(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const amount = parseInt(req.query.amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Valid positive amount is required' });
        }
        const canAffordResult = await livra_service_1.livraService.hasSufficientBalance(userId, amount);
        const balance = await livra_service_1.livraService.getBalance(userId);
        res.json({
            canAfford: canAffordResult,
            currentBalance: balance.balance,
            requiredAmount: amount,
            shortfall: canAffordResult ? 0 : amount - balance.balance,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Admin: Add Livras to a user (manual adjustment)
 */
async function adminAddLivras(req, res, next) {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { userId, amount, reason } = req.body;
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'userId and positive amount are required' });
        }
        const transaction = await livra_service_1.livraService.addLivras(userId, {
            type: 'ADMIN_ADJUSTMENT',
            amount,
            metadata: { reason, adjustedBy: req.user.userId },
        });
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get balance for a specific user (admin only)
 */
async function getUserBalance(req, res, next) {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { userId } = req.params;
        const balance = await livra_service_1.livraService.getBalance(userId);
        res.json(balance);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get transactions for a specific user (admin only)
 */
async function getUserTransactions(req, res, next) {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const transactions = await livra_service_1.livraService.getTransactionHistory(userId, page, limit);
        res.json(transactions);
    }
    catch (error) {
        next(error);
    }
}
