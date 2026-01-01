"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = void 0;
exports.loadPlanInfo = loadPlanInfo;
exports.requireFeature = requireFeature;
exports.checkLimit = checkLimit;
exports.isPremiumOrAbove = isPremiumOrAbove;
exports.isPro = isPro;
exports.getPlanLimits = getPlanLimits;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
// Import to extend Express Request type with user property
require("./auth.middleware");
/**
 * Configuração de limites por plano
 */
exports.PLAN_LIMITS = {
    FREE: {
        maxBooks: 3,
        maxCharactersPerBook: 5,
        maxStoriesPerDay: 1,
        maxDMsPerDay: 10,
        maxGroupsOwned: 0,
        canUseTTS: true,
        canUseImageGen: false,
        monthlyLivras: 0,
        canBoostPosts: false,
        canCreateCampaigns: false,
    },
    PREMIUM: {
        maxBooks: 10,
        maxCharactersPerBook: 10,
        maxStoriesPerDay: 5,
        maxDMsPerDay: 50,
        maxGroupsOwned: 3,
        canUseTTS: true,
        canUseImageGen: true,
        monthlyLivras: 100,
        canBoostPosts: true,
        canCreateCampaigns: true,
    },
    PRO: {
        maxBooks: -1, // Ilimitado
        maxCharactersPerBook: -1, // Ilimitado
        maxStoriesPerDay: -1, // Ilimitado
        maxDMsPerDay: -1, // Ilimitado
        maxGroupsOwned: -1, // Ilimitado
        canUseTTS: true,
        canUseImageGen: true,
        monthlyLivras: 500,
        canBoostPosts: true,
        canCreateCampaigns: true,
    },
};
/**
 * Busca a assinatura do usuário e retorna os limites do plano
 */
async function getUserPlanLimits(userId) {
    const subscription = await prisma_1.default.subscription.findUnique({
        where: { userId },
    });
    const plan = subscription?.plan ?? client_1.SubscriptionPlan.FREE;
    const limits = exports.PLAN_LIMITS[plan];
    return { plan, limits };
}
/**
 * Middleware que carrega informações do plano do usuário
 * Deve ser usado após authenticate middleware
 */
async function loadPlanInfo(req, res, next) {
    if (!req.user) {
        next();
        return;
    }
    try {
        const { plan, limits } = await getUserPlanLimits(req.user.userId);
        req.subscription = { plan, limits };
        next();
    }
    catch (error) {
        console.error('Erro ao carregar informações do plano:', error);
        // Assume plano FREE em caso de erro
        req.subscription = { plan: client_1.SubscriptionPlan.FREE, limits: exports.PLAN_LIMITS.FREE };
        next();
    }
}
/**
 * Middleware factory para verificar se o usuário pode usar uma feature
 *
 * @param feature - Chave da feature em PlanLimits
 * @returns Express middleware
 *
 * @example
 * router.post('/narrate', authenticate, requireFeature('canUseTTS'), handler);
 */
function requireFeature(feature) {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Usuário não autenticado',
                code: 'NOT_AUTHENTICATED',
            });
            return;
        }
        try {
            // Carrega limites se ainda não foram carregados
            if (!req.subscription) {
                const { plan, limits } = await getUserPlanLimits(req.user.userId);
                req.subscription = { plan, limits };
            }
            const featureValue = req.subscription.limits[feature];
            // Para features booleanas
            if (typeof featureValue === 'boolean') {
                if (!featureValue) {
                    res.status(403).json({
                        error: `Seu plano não permite usar esta funcionalidade`,
                        code: 'FEATURE_NOT_AVAILABLE',
                        feature,
                        currentPlan: req.subscription.plan,
                        requiredPlan: getMinimumPlanForFeature(feature),
                        upgradeUrl: '/subscription/plans',
                    });
                    return;
                }
            }
            next();
        }
        catch (error) {
            console.error('Erro ao verificar feature:', error);
            res.status(500).json({
                error: 'Erro ao verificar permissões do plano',
                code: 'PLAN_CHECK_ERROR',
            });
        }
    };
}
/**
 * Middleware factory para verificar limites numéricos
 *
 * @param limitKey - Chave do limite em PlanLimits
 * @param getCurrentCount - Função que retorna a contagem atual
 * @returns Express middleware
 *
 * @example
 * router.post('/books', authenticate, checkLimit('maxBooks', async (req) => {
 *   return prisma.book.count({ where: { userId: req.user.userId } });
 * }), handler);
 */
function checkLimit(limitKey, getCurrentCount) {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Usuário não autenticado',
                code: 'NOT_AUTHENTICATED',
            });
            return;
        }
        try {
            // Carrega limites se ainda não foram carregados
            if (!req.subscription) {
                const { plan, limits } = await getUserPlanLimits(req.user.userId);
                req.subscription = { plan, limits };
            }
            const limit = req.subscription.limits[limitKey];
            // -1 significa ilimitado
            if (typeof limit === 'number' && limit !== -1) {
                const currentCount = await getCurrentCount(req);
                if (currentCount >= limit) {
                    res.status(403).json({
                        error: `Você atingiu o limite do seu plano`,
                        code: 'LIMIT_REACHED',
                        limit: limitKey,
                        currentCount,
                        maxAllowed: limit,
                        currentPlan: req.subscription.plan,
                        upgradeUrl: '/subscription/plans',
                    });
                    return;
                }
            }
            next();
        }
        catch (error) {
            console.error('Erro ao verificar limite:', error);
            res.status(500).json({
                error: 'Erro ao verificar limites do plano',
                code: 'LIMIT_CHECK_ERROR',
            });
        }
    };
}
/**
 * Helper para obter o plano mínimo que tem uma feature
 */
function getMinimumPlanForFeature(feature) {
    const plans = ['FREE', 'PREMIUM', 'PRO'];
    for (const plan of plans) {
        const value = exports.PLAN_LIMITS[plan][feature];
        if (typeof value === 'boolean' && value) {
            return plan;
        }
        if (typeof value === 'number' && value !== 0) {
            return plan;
        }
    }
    return 'PRO';
}
/**
 * Helper para verificar se usuário tem plano premium ou superior
 */
function isPremiumOrAbove(plan) {
    return plan === 'PREMIUM' || plan === 'PRO';
}
/**
 * Helper para verificar se usuário tem plano PRO
 */
function isPro(plan) {
    return plan === 'PRO';
}
/**
 * Retorna os limites de um plano específico
 */
function getPlanLimits(plan) {
    return exports.PLAN_LIMITS[plan];
}
