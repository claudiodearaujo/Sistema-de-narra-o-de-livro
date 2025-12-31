"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementService = void 0;
exports.setAchievementWebSocketEmitter = setAchievementWebSocketEmitter;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const livra_service_1 = require("./livra.service");
const notification_service_1 = require("./notification.service");
let wsEmitter = null;
/**
 * Set WebSocket emitter for real-time updates
 */
function setAchievementWebSocketEmitter(emitter) {
    wsEmitter = emitter;
}
class AchievementService {
    /**
     * Get all achievements
     */
    async getAllAchievements() {
        return prisma_1.default.achievement.findMany({
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
    }
    /**
     * Get achievements for a user (with unlock status and progress)
     */
    async getUserAchievements(userId) {
        const [achievements, userAchievements, userStats] = await Promise.all([
            prisma_1.default.achievement.findMany({
                where: { isHidden: false },
                orderBy: [{ category: 'asc' }, { name: 'asc' }]
            }),
            prisma_1.default.userAchievement.findMany({
                where: { userId },
                include: { achievement: true }
            }),
            this.getUserStats(userId)
        ]);
        const unlockedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua.unlockedAt]));
        return achievements.map(achievement => {
            const unlockedAt = unlockedMap.get(achievement.id);
            const requirement = achievement.requirement;
            const progress = requirement
                ? this.calculateProgress(requirement, userStats)
                : null;
            return {
                id: achievement.id,
                key: achievement.key,
                category: achievement.category,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                livraReward: achievement.livraReward,
                requirement,
                isHidden: achievement.isHidden,
                unlockedAt: unlockedAt || null,
                progress: progress?.current,
                progressTarget: progress?.target
            };
        });
    }
    /**
     * Get achievements by user ID (public profile view)
     */
    async getAchievementsByUserId(userId) {
        const userAchievements = await prisma_1.default.userAchievement.findMany({
            where: { userId },
            include: { achievement: true },
            orderBy: { unlockedAt: 'desc' }
        });
        return userAchievements.map(ua => ({
            id: ua.id,
            achievementId: ua.achievementId,
            userId: ua.userId,
            unlockedAt: ua.unlockedAt,
            achievement: {
                id: ua.achievement.id,
                key: ua.achievement.key,
                category: ua.achievement.category,
                name: ua.achievement.name,
                description: ua.achievement.description,
                icon: ua.achievement.icon,
                livraReward: ua.achievement.livraReward,
                requirement: ua.achievement.requirement,
                isHidden: ua.achievement.isHidden
            }
        }));
    }
    /**
     * Get achievement stats for a user
     */
    async getAchievementStats(userId) {
        const [total, unlocked, recentUnlocks] = await Promise.all([
            prisma_1.default.achievement.count({ where: { isHidden: false } }),
            prisma_1.default.userAchievement.count({ where: { userId } }),
            prisma_1.default.userAchievement.findMany({
                where: { userId },
                include: { achievement: true },
                orderBy: { unlockedAt: 'desc' },
                take: 5
            })
        ]);
        return {
            total,
            unlocked,
            locked: total - unlocked,
            percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
            recentUnlocks: recentUnlocks.map(ua => ({
                id: ua.id,
                achievementId: ua.achievementId,
                userId: ua.userId,
                unlockedAt: ua.unlockedAt,
                achievement: {
                    id: ua.achievement.id,
                    key: ua.achievement.key,
                    category: ua.achievement.category,
                    name: ua.achievement.name,
                    description: ua.achievement.description,
                    icon: ua.achievement.icon,
                    livraReward: ua.achievement.livraReward,
                    requirement: ua.achievement.requirement,
                    isHidden: ua.achievement.isHidden
                }
            }))
        };
    }
    /**
     * Check and unlock achievements based on action type
     */
    async checkAndUnlock(userId, actionType) {
        const userStats = await this.getUserStats(userId);
        // Get all achievements that might be unlockable based on action type
        const achievements = await prisma_1.default.achievement.findMany({
            where: { isHidden: false }
        });
        const unlockedAchievements = [];
        for (const achievement of achievements) {
            const requirement = achievement.requirement;
            // Skip if no requirement or wrong type
            if (!requirement || requirement.type !== actionType)
                continue;
            // Check if already unlocked
            const existingUnlock = await prisma_1.default.userAchievement.findUnique({
                where: {
                    userId_achievementId: {
                        userId,
                        achievementId: achievement.id
                    }
                }
            });
            if (existingUnlock)
                continue;
            // Check if requirement is met
            const currentValue = this.getStatValue(requirement.type, userStats);
            if (currentValue >= requirement.target) {
                // Unlock the achievement
                await this.unlockAchievement(userId, achievement);
                unlockedAchievements.push(achievement);
            }
        }
        return unlockedAchievements;
    }
    /**
     * Unlock a specific achievement for a user
     */
    async unlockAchievement(userId, achievement) {
        // Create user achievement record
        await prisma_1.default.userAchievement.create({
            data: {
                userId,
                achievementId: achievement.id
            }
        });
        // Award Livras if there's a reward
        if (achievement.livraReward > 0) {
            await livra_service_1.livraService.addLivras(userId, {
                type: 'EARNED_ACHIEVEMENT',
                amount: achievement.livraReward,
                metadata: {
                    achievementId: achievement.id,
                    achievementKey: achievement.key,
                    achievementName: achievement.name
                }
            });
        }
        // Create notification
        await notification_service_1.notificationService.create({
            userId,
            type: client_1.NotificationType.ACHIEVEMENT,
            title: '🏆 Conquista Desbloqueada!',
            message: `Você desbloqueou "${achievement.name}" e ganhou ${achievement.livraReward} Livras!`,
            data: {
                achievementId: achievement.id,
                achievementKey: achievement.key,
                achievementName: achievement.name,
                achievementIcon: achievement.icon,
                livraReward: achievement.livraReward
            }
        });
        // Emit WebSocket event for real-time notification
        if (wsEmitter) {
            wsEmitter(userId, 'achievement:unlocked', {
                id: achievement.id,
                key: achievement.key,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                livraReward: achievement.livraReward,
                category: achievement.category
            });
        }
    }
    /**
     * Get user stats for achievement checking
     */
    async getUserStats(userId) {
        const [postsCount, booksCount, chaptersCount, followersCount, followingCount, likesReceived, commentsReceived, messagesSent, campaignsCompleted, groupsJoined] = await Promise.all([
            prisma_1.default.post.count({ where: { userId } }),
            prisma_1.default.book.count({ where: { userId } }),
            prisma_1.default.chapter.count({ where: { book: { userId } } }),
            prisma_1.default.follow.count({ where: { followingId: userId } }),
            prisma_1.default.follow.count({ where: { followerId: userId } }),
            prisma_1.default.like.count({ where: { post: { userId } } }),
            prisma_1.default.comment.count({ where: { post: { userId } } }),
            prisma_1.default.message.count({ where: { senderId: userId } }),
            prisma_1.default.campaignProgress.count({ where: { userId, isCompleted: true } }),
            prisma_1.default.groupMember.count({ where: { userId } })
        ]);
        return {
            posts_count: postsCount,
            books_count: booksCount,
            chapters_count: chaptersCount,
            followers_count: followersCount,
            following_count: followingCount,
            likes_received: likesReceived,
            comments_received: commentsReceived,
            messages_sent: messagesSent,
            campaigns_completed: campaignsCompleted,
            groups_joined: groupsJoined
        };
    }
    /**
     * Get stat value by type
     */
    getStatValue(type, stats) {
        return stats[type] || 0;
    }
    /**
     * Calculate progress for an achievement requirement
     */
    calculateProgress(requirement, stats) {
        const current = this.getStatValue(requirement.type, stats);
        const target = requirement.target;
        const percentage = Math.min(Math.round((current / target) * 100), 100);
        return { current, target, percentage };
    }
    /**
     * Get achievements by category
     */
    async getAchievementsByCategory(category) {
        return prisma_1.default.achievement.findMany({
            where: { category, isHidden: false },
            orderBy: { name: 'asc' }
        });
    }
    /**
     * Check if user has a specific achievement
     */
    async hasAchievement(userId, achievementKey) {
        const userAchievement = await prisma_1.default.userAchievement.findFirst({
            where: {
                userId,
                achievement: { key: achievementKey }
            }
        });
        return !!userAchievement;
    }
    /**
     * Force check all achievements for a user (used after migrations or fixes)
     */
    async recheckAllAchievements(userId) {
        const allTypes = [
            'posts_count',
            'books_count',
            'chapters_count',
            'followers_count',
            'following_count',
            'likes_received',
            'comments_received',
            'messages_sent',
            'campaigns_completed',
            'groups_joined'
        ];
        const allUnlocked = [];
        for (const type of allTypes) {
            const unlocked = await this.checkAndUnlock(userId, type);
            allUnlocked.push(...unlocked);
        }
        return allUnlocked;
    }
}
exports.achievementService = new AchievementService();
