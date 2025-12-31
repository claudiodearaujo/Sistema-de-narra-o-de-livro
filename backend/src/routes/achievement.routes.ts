import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import {
  getAllAchievements,
  getUserAchievements,
  getMyAchievements,
  getAchievementsByCategory,
  getMyAchievementStats,
  recheckAchievements
} from '../controllers/achievement.controller';

const router = Router();

// Public routes
router.get('/', optionalAuth, getAllAchievements);
router.get('/category/:category', optionalAuth, getAchievementsByCategory);
router.get('/user/:userId', getUserAchievements);

// Authenticated routes
router.get('/me', authenticate, getMyAchievements);
router.get('/me/stats', authenticate, getMyAchievementStats);
router.post('/me/recheck', authenticate, recheckAchievements);

export default router;
