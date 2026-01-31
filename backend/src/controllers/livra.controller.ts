import { Request, Response, NextFunction } from 'express';
import { livraService, TransactionFilters } from '../services/livra.service';
import { LivraTransactionType } from '@prisma/client';

/**
 * Get current user's Livra balance
 */
export async function getBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const balance = await livraService.getBalance(userId);
    res.json(balance);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user's transaction history
 */
export async function getTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const filters: TransactionFilters = {};
    
    if (req.query.type) {
      filters.type = req.query.type as LivraTransactionType;
    }
    
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const transactions = await livraService.getTransactionHistory(userId, page, limit, filters);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all configuration values (admin only)
 */
export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const config = await livraService.getAllConfigValues();
    res.json(config);
  } catch (error) {
    next(error);
  }
}

/**
 * Update configuration value (admin only)
 */
export async function updateConfig(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key, value, description } = req.body;

    if (!key || typeof value !== 'number') {
      return res.status(400).json({ error: 'Key and numeric value are required' });
    }

    await livraService.setConfigValue(key, value, description);
    res.json({ message: 'Configuration updated', key, value });
  } catch (error) {
    next(error);
  }
}

/**
 * Get cost for a specific action
 */
export async function getCost(req: Request, res: Response, next: NextFunction) {
  try {
    const action = (req.params.action as string)?.toUpperCase() as 'TTS' | 'IMAGE' | 'CHARACTER' | 'BOOST';
    
    if (!['TTS', 'IMAGE', 'CHARACTER', 'BOOST'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be one of: TTS, IMAGE, CHARACTER, BOOST' });
    }

    const cost = await livraService.getCost(action);
    res.json({ action, cost });
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user can afford an action
 */
export async function canAfford(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const amount = parseInt(req.query.amount as string);
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }

    const canAffordResult = await livraService.hasSufficientBalance(userId, amount);
    const balance = await livraService.getBalance(userId);
    
    res.json({
      canAfford: canAffordResult,
      currentBalance: balance.balance,
      requiredAmount: amount,
      shortfall: canAffordResult ? 0 : amount - balance.balance,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Add Livras to a user (manual adjustment)
 */
export async function adminAddLivras(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'userId and positive amount are required' });
    }

    const transaction = await livraService.addLivras(userId, {
      type: 'ADMIN_ADJUSTMENT',
      amount,
      metadata: { reason, adjustedBy: req.user.userId },
    });

    res.json(transaction);
  } catch (error) {
    next(error);
  }
}

/**
 * Get balance for a specific user (admin only)
 */
export async function getUserBalance(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.userId as string;
    const balance = await livraService.getBalance(userId);
    res.json(balance);
  } catch (error) {
    next(error);
  }
}

/**
 * Get transactions for a specific user (admin only)
 */
export async function getUserTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const transactions = await livraService.getTransactionHistory(userId, page, limit);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
}
