import { Request, Response } from 'express';
import { achievementService } from '../services/achievement.service';
import { AchievementCategory } from '@prisma/client';

/**
 * Get all achievements (with user progress if authenticated)
 */
export const getAllAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (userId) {
      // Authenticated: return with progress
      const achievements = await achievementService.getUserAchievements(userId);
      res.json({ achievements });
    } else {
      // Not authenticated: return all achievements without progress
      const achievements = await achievementService.getAllAchievements();
      res.json({ achievements });
    }
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
};

/**
 * Get achievements for a specific user (public profile)
 */
export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const achievements = await achievementService.getAchievementsByUserId(userId);
    const stats = await achievementService.getAchievementStats(userId);

    res.json({ 
      achievements,
      stats
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: 'Failed to get user achievements' });
  }
};

/**
 * Get my achievements (authenticated user)
 */
export const getMyAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [achievements, stats] = await Promise.all([
      achievementService.getUserAchievements(userId),
      achievementService.getAchievementStats(userId)
    ]);

    res.json({ 
      achievements,
      stats
    });
  } catch (error) {
    console.error('Get my achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
};

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const userId = (req as any).user?.userId;

    // Validate category
    if (!Object.values(AchievementCategory).includes(category as AchievementCategory)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const achievements = await achievementService.getAchievementsByCategory(
      category as AchievementCategory
    );

    // If authenticated, get unlock status
    if (userId) {
      const userAchievements = await achievementService.getAchievementsByUserId(userId);
      const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

      const withStatus = achievements.map(a => ({
        ...a,
        isUnlocked: unlockedIds.has(a.id)
      }));

      return res.json({ achievements: withStatus });
    }

    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements by category error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
};

/**
 * Get achievement stats for the authenticated user
 */
export const getMyAchievementStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const stats = await achievementService.getAchievementStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ error: 'Failed to get achievement stats' });
  }
};

/**
 * Check and unlock achievements (manual trigger - for admin/testing)
 */
export const recheckAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const unlocked = await achievementService.recheckAllAchievements(userId);

    res.json({
      message: `Checked all achievements. ${unlocked.length} new achievements unlocked.`,
      unlocked: unlocked.map(a => ({
        key: a.key,
        name: a.name,
        livraReward: a.livraReward
      }))
    });
  } catch (error) {
    console.error('Recheck achievements error:', error);
    res.status(500).json({ error: 'Failed to recheck achievements' });
  }
};
