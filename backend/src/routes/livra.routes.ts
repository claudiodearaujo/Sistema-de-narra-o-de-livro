import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getBalance,
  getTransactions,
  getConfig,
  updateConfig,
  getCost,
  canAfford,
  adminAddLivras,
  getUserBalance,
  getUserTransactions,
} from '../controllers/livra.controller';

const router = Router();

// ========== User routes ==========

// Get current user's balance
router.get('/balance', authenticate, getBalance);

// Get current user's transaction history
router.get('/transactions', authenticate, getTransactions);

// Get cost for a specific action
router.get('/cost/:action', authenticate, getCost);

// Check if user can afford an amount
router.get('/can-afford', authenticate, canAfford);

// ========== Admin routes ==========

// Get all configuration values
router.get('/config', authenticate, getConfig);

// Update configuration value
router.put('/config', authenticate, updateConfig);

// Add Livras to a user (manual adjustment)
router.post('/admin/add', authenticate, adminAddLivras);

// Get balance for a specific user
router.get('/admin/users/:userId/balance', authenticate, getUserBalance);

// Get transactions for a specific user
router.get('/admin/users/:userId/transactions', authenticate, getUserTransactions);

export default router;
