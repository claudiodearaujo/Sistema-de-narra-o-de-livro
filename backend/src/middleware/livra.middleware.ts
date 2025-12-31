import { Request, Response, NextFunction } from 'express';
import { livraService } from '../services/livra.service';

type LivraAction = 'TTS' | 'IMAGE' | 'CHARACTER' | 'BOOST';

/**
 * Middleware factory to check if user has sufficient Livra balance
 * @param action The action type to check cost for
 * @param customAmount Optional custom amount (overrides action cost)
 */
export function checkLivras(action: LivraAction, customAmount?: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the cost for this action
      const cost = customAmount ?? await livraService.getCost(action);

      // Check if user has sufficient balance
      const hasSufficient = await livraService.hasSufficientBalance(userId, cost);

      if (!hasSufficient) {
        const balance = await livraService.getBalance(userId);
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
      (req as any).livraCost = cost;
      (req as any).livraAction = action;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to deduct Livras after a successful action
 * Should be used as a response interceptor or called manually
 */
export async function deductLivras(req: Request): Promise<void> {
  const userId = req.user?.userId;
  const cost = (req as any).livraCost;
  const action = (req as any).livraAction as LivraAction;

  if (!userId || !cost || !action) {
    return;
  }

  // Map action to transaction type
  const typeMap: Record<LivraAction, 'SPENT_TTS' | 'SPENT_IMAGE' | 'SPENT_CHARACTER' | 'SPENT_BOOST'> = {
    TTS: 'SPENT_TTS',
    IMAGE: 'SPENT_IMAGE',
    CHARACTER: 'SPENT_CHARACTER',
    BOOST: 'SPENT_BOOST',
  };

  await livraService.spendLivras(userId, {
    type: typeMap[action],
    amount: cost,
  });
}

/**
 * Higher-order middleware that checks Livras and deducts after success
 * Wraps the actual route handler
 */
export function withLivraCheck(action: LivraAction, customAmount?: number) {
  const checkMiddleware = checkLivras(action, customAmount);

  return (handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      // First check if user has sufficient balance
      await checkMiddleware(req, res, async (err?: any) => {
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
        } catch (error) {
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
export async function getLivraInfo(userId: string) {
  const balance = await livraService.getBalance(userId);
  const costs = await livraService.getAllConfigValues();

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
