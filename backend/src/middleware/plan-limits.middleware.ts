import { Request, Response, NextFunction } from 'express';
import { SubscriptionPlan } from '@prisma/client';
import prisma from '../lib/prisma';

// Import to extend Express Request type with user property
import './auth.middleware';

/**
 * Interface para limites de cada plano
 */
export interface PlanLimits {
  maxBooks: number;                // -1 = ilimitado
  maxCharactersPerBook: number;    // -1 = ilimitado
  maxStoriesPerDay: number;
  maxDMsPerDay: number;
  maxGroupsOwned: number;
  canUseTTS: boolean;
  canUseImageGen: boolean;
  monthlyLivras: number;
  canBoostPosts: boolean;
  canCreateCampaigns: boolean;
}

/**
 * Configuração de limites por plano
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
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

// Estender Request para incluir informações de plano
declare global {
  namespace Express {
    interface Request {
      subscription?: {
        plan: SubscriptionPlan;
        limits: PlanLimits;
      };
      featureCost?: number;
    }
  }
}

/**
 * Busca a assinatura do usuário e retorna os limites do plano
 */
async function getUserPlanLimits(userId: string): Promise<{ plan: SubscriptionPlan; limits: PlanLimits }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const limits = PLAN_LIMITS[plan];

  return { plan, limits };
}

/**
 * Middleware que carrega informações do plano do usuário
 * Deve ser usado após authenticate middleware
 */
export async function loadPlanInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  try {
    const { plan, limits } = await getUserPlanLimits(req.user.userId);
    req.subscription = { plan, limits };
    next();
  } catch (error) {
    console.error('Erro ao carregar informações do plano:', error);
    // Assume plano FREE em caso de erro
    req.subscription = { plan: SubscriptionPlan.FREE, limits: PLAN_LIMITS.FREE };
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
export function requireFeature(feature: keyof PlanLimits) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    } catch (error) {
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
export function checkLimit(
  limitKey: keyof PlanLimits,
  getCurrentCount: (req: Request) => Promise<number>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    } catch (error) {
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
function getMinimumPlanForFeature(feature: keyof PlanLimits): SubscriptionPlan {
  const plans: SubscriptionPlan[] = ['FREE', 'PREMIUM', 'PRO'];

  for (const plan of plans) {
    const value = PLAN_LIMITS[plan][feature];
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
export function isPremiumOrAbove(plan: SubscriptionPlan): boolean {
  return plan === 'PREMIUM' || plan === 'PRO';
}

/**
 * Helper para verificar se usuário tem plano PRO
 */
export function isPro(plan: SubscriptionPlan): boolean {
  return plan === 'PRO';
}

/**
 * Retorna os limites de um plano específico
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}
