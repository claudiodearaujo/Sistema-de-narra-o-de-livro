"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLivras = checkLivras;
exports.deductLivras = deductLivras;
exports.withLivraCheck = withLivraCheck;
exports.getLivraInfo = getLivraInfo;
const livra_service_1 = require("../services/livra.service");
/**
 * Middleware factory to check if user has sufficient Livra balance
 * @param action The action type to check cost for
 * @param customAmount Optional custom amount (overrides action cost)
 */
function checkLivras(action, customAmount) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Get the cost for this action
            const cost = customAmount ?? await livra_service_1.livraService.getCost(action);
            // Check if user has sufficient balance
            const hasSufficient = await livra_service_1.livraService.hasSufficientBalance(userId, cost);
            if (!hasSufficient) {
                const balance = await livra_service_1.livraService.getBalance(userId);
                return res.status(402).json({
                    error: 'Insufficient Livra balance',
                    code: 'INSUFFICIENT_LIVRAS',
                    required: cost,
                    current: balance.balance,
                    shortfall: cost - balance.balance,
                    message: `This action requires ${cost} Livras. You have ${balance.balance} Livras.`,
                });
            }
            // Attach cost to request for later use (after action is successful)
            req.livraCost = cost;
            req.livraAction = action;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Middleware to deduct Livras after a successful action
 * Should be used as a response interceptor or called manually
 */
async function deductLivras(req) {
    const userId = req.user?.userId;
    const cost = req.livraCost;
    const action = req.livraAction;
    if (!userId || !cost || !action) {
        return;
    }
    // Map action to transaction type
    const typeMap = {
        TTS: 'SPENT_TTS',
        IMAGE: 'SPENT_IMAGE',
        CHARACTER: 'SPENT_CHARACTER',
        BOOST: 'SPENT_BOOST',
    };
    await livra_service_1.livraService.spendLivras(userId, {
        type: typeMap[action],
        amount: cost,
    });
}
/**
 * Higher-order middleware that checks Livras and deducts after success
 * Wraps the actual route handler
 */
function withLivraCheck(action, customAmount) {
    const checkMiddleware = checkLivras(action, customAmount);
    return (handler) => {
        return async (req, res, next) => {
            // First check if user has sufficient balance
            await checkMiddleware(req, res, async (err) => {
                if (err) {
                    return next(err);
                }
                // If response was already sent (insufficient balance), don't continue
                if (res.headersSent) {
                    return;
                }
                try {
                    // Execute the actual handler
                    await handler(req, res, next);
                    // If successful (2xx status), deduct Livras
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        await deductLivras(req);
                    }
                }
                catch (error) {
                    next(error);
                }
            });
        };
    };
}
/**
 * Utility to check balance without blocking
 * Returns balance info that can be used in response
 */
async function getLivraInfo(userId) {
    const balance = await livra_service_1.livraService.getBalance(userId);
    const costs = await livra_service_1.livraService.getAllConfigValues();
    return {
        balance: balance.balance,
        lifetime: balance.lifetime,
        spent: balance.spent,
        costs: {
            tts: costs.TTS_COST,
            image: costs.IMAGE_GENERATION_COST,
            character: costs.CHARACTER_CREATION_COST,
            boost: costs.POST_BOOST_COST,
        },
    };
}
