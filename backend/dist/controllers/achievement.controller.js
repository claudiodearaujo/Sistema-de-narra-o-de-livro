"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recheckAchievements = exports.getMyAchievementStats = exports.getAchievementsByCategory = exports.getMyAchievements = exports.getUserAchievements = exports.getAllAchievements = void 0;
const achievement_service_1 = require("../services/achievement.service");
const client_1 = require("@prisma/client");
/**
 * Get all achievements (with user progress if authenticated)
 */
const getAllAchievements = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (userId) {
            // Authenticated: return with progress
            const achievements = await achievement_service_1.achievementService.getUserAchievements(userId);
            res.json({ achievements });
        }
        else {
            // Not authenticated: return all achievements without progress
            const achievements = await achievement_service_1.achievementService.getAllAchievements();
            res.json({ achievements });
        }
    }
    catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ error: 'Failed to get achievements' });
    }
};
exports.getAllAchievements = getAllAchievements;
/**
 * Get achievements for a specific user (public profile)
 */
const getUserAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const achievements = await achievement_service_1.achievementService.getAchievementsByUserId(userId);
        const stats = await achievement_service_1.achievementService.getAchievementStats(userId);
        res.json({
            achievements,
            stats
        });
    }
    catch (error) {
        console.error('Get user achievements error:', error);
        res.status(500).json({ error: 'Failed to get user achievements' });
    }
};
exports.getUserAchievements = getUserAchievements;
/**
 * Get my achievements (authenticated user)
 */
const getMyAchievements = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const [achievements, stats] = await Promise.all([
            achievement_service_1.achievementService.getUserAchievements(userId),
            achievement_service_1.achievementService.getAchievementStats(userId)
        ]);
        res.json({
            achievements,
            stats
        });
    }
    catch (error) {
        console.error('Get my achievements error:', error);
        res.status(500).json({ error: 'Failed to get achievements' });
    }
};
exports.getMyAchievements = getMyAchievements;
/**
 * Get achievements by category
 */
const getAchievementsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const userId = req.user?.userId;
        // Validate category
        if (!Object.values(client_1.AchievementCategory).includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }
        const achievements = await achievement_service_1.achievementService.getAchievementsByCategory(category);
        // If authenticated, get unlock status
        if (userId) {
            const userAchievements = await achievement_service_1.achievementService.getAchievementsByUserId(userId);
            const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
            const withStatus = achievements.map(a => ({
                ...a,
                isUnlocked: unlockedIds.has(a.id)
            }));
            return res.json({ achievements: withStatus });
        }
        res.json({ achievements });
    }
    catch (error) {
        console.error('Get achievements by category error:', error);
        res.status(500).json({ error: 'Failed to get achievements' });
    }
};
exports.getAchievementsByCategory = getAchievementsByCategory;
/**
 * Get achievement stats for the authenticated user
 */
const getMyAchievementStats = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const stats = await achievement_service_1.achievementService.getAchievementStats(userId);
        res.json(stats);
    }
    catch (error) {
        console.error('Get achievement stats error:', error);
        res.status(500).json({ error: 'Failed to get achievement stats' });
    }
};
exports.getMyAchievementStats = getMyAchievementStats;
/**
 * Check and unlock achievements (manual trigger - for admin/testing)
 */
const recheckAchievements = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const unlocked = await achievement_service_1.achievementService.recheckAllAchievements(userId);
        res.json({
            message: `Checked all achievements. ${unlocked.length} new achievements unlocked.`,
            unlocked: unlocked.map(a => ({
                key: a.key,
                name: a.name,
                livraReward: a.livraReward
            }))
        });
    }
    catch (error) {
        console.error('Recheck achievements error:', error);
        res.status(500).json({ error: 'Failed to recheck achievements' });
    }
};
exports.recheckAchievements = recheckAchievements;
