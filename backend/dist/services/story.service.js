"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_service_1 = require("./audit.service");
// Plan limits for stories
const STORY_LIMITS = {
    FREE: 3, // 3 stories per day
    PREMIUM: 10, // 10 stories per day
    PRO: 50, // 50 stories per day
};
// Default expiration in hours
const DEFAULT_EXPIRATION_HOURS = 24;
// Prisma includes
const storyInclude = {
    user: {
        select: {
            id: true,
            name: true,
            avatar: true,
        },
    },
    views: {
        select: {
            userId: true,
        },
    },
};
class StoryService {
    /**
     * Get stories from followed users (feed)
     */
    async getStoriesFeed(userId) {
        // Get list of users the current user follows
        const following = await prisma_1.default.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);
        // Include own stories
        followingIds.push(userId);
        // Get non-expired stories from followed users
        const stories = await prisma_1.default.story.findMany({
            where: {
                userId: { in: followingIds },
                expiresAt: { gt: new Date() },
            },
            include: storyInclude,
            orderBy: { createdAt: 'desc' },
        });
        // Group stories by user
        const userStoriesMap = new Map();
        for (const story of stories) {
            const isViewed = story.views.some((v) => v.userId === userId);
            const storyWithViewed = {
                ...story,
                isViewed,
            };
            if (!userStoriesMap.has(story.userId)) {
                userStoriesMap.set(story.userId, {
                    userId: story.userId,
                    userName: story.user.name,
                    userAvatar: story.user.avatar,
                    stories: [],
                    hasUnviewed: false,
                    latestStoryAt: story.createdAt,
                });
            }
            const userStories = userStoriesMap.get(story.userId);
            userStories.stories.push(storyWithViewed);
            if (!isViewed) {
                userStories.hasUnviewed = true;
            }
        }
        // Sort: own stories first, then by hasUnviewed, then by latestStoryAt
        const result = Array.from(userStoriesMap.values()).sort((a, b) => {
            // Own stories always first
            if (a.userId === userId)
                return -1;
            if (b.userId === userId)
                return 1;
            // Then unviewed first
            if (a.hasUnviewed && !b.hasUnviewed)
                return -1;
            if (!a.hasUnviewed && b.hasUnviewed)
                return 1;
            // Then by latest story
            return b.latestStoryAt.getTime() - a.latestStoryAt.getTime();
        });
        return result;
    }
    /**
     * Get stories by a specific user
     */
    async getStoriesByUser(userId, viewerId) {
        const stories = await prisma_1.default.story.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() },
            },
            include: storyInclude,
            orderBy: { createdAt: 'asc' },
        });
        return stories.map((story) => ({
            ...story,
            isViewed: viewerId ? story.views.some((v) => v.userId === viewerId) : false,
        }));
    }
    /**
     * Get a single story by ID
     */
    async getById(storyId, viewerId) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
            include: storyInclude,
        });
        if (!story)
            return null;
        // Check if expired
        if (story.expiresAt < new Date()) {
            return null;
        }
        return {
            ...story,
            isViewed: viewerId ? story.views.some((v) => v.userId === viewerId) : false,
        };
    }
    /**
     * Create a new story
     */
    async create(userId, data, userEmail) {
        // Check daily limit based on plan (get from subscription)
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { userId },
            select: { plan: true },
        });
        const plan = subscription?.plan || 'FREE';
        const dailyLimit = STORY_LIMITS[plan] || STORY_LIMITS.FREE;
        // Count stories created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStoriesCount = await prisma_1.default.story.count({
            where: {
                userId,
                createdAt: { gte: today },
            },
        });
        if (todayStoriesCount >= dailyLimit) {
            throw new Error(`Você atingiu o limite de ${dailyLimit} stories por dia. Faça upgrade do seu plano para mais stories.`);
        }
        // Validate content
        if (data.type === 'TEXT' && !data.content?.trim()) {
            throw new Error('Conteúdo é obrigatório para stories de texto');
        }
        if (data.type === 'IMAGE' && !data.mediaUrl) {
            throw new Error('URL da mídia é obrigatória para stories de imagem');
        }
        // Calculate expiration
        const expiresInHours = data.expiresInHours || DEFAULT_EXPIRATION_HOURS;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);
        const story = await prisma_1.default.story.create({
            data: {
                userId,
                type: data.type,
                content: data.content?.trim(),
                mediaUrl: data.mediaUrl,
                expiresAt,
            },
            include: storyInclude,
        });
        // Audit log - story created
        if (userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'STORY_CREATE',
                category: 'SOCIAL',
                severity: 'MEDIUM',
                resource: 'Story',
                resourceId: story.id,
                description: `Story criado pelo usuário`,
                metadata: { type: story.type, expiresAt: story.expiresAt }
            }).catch(err => console.error('[AUDIT]', err));
        }
        return { ...story, isViewed: false };
    }
    /**
     * Mark story as viewed
     */
    async markAsViewed(storyId, userId, userEmail) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
            select: { userId: true, expiresAt: true },
        });
        if (!story) {
            throw new Error('Story não encontrado');
        }
        if (story.expiresAt < new Date()) {
            throw new Error('Story expirado');
        }
        // Don't count own views
        if (story.userId === userId) {
            return;
        }
        // Create view (upsert to avoid duplicates)
        await prisma_1.default.$transaction([
            prisma_1.default.storyView.upsert({
                where: {
                    storyId_userId: { storyId, userId },
                },
                create: { storyId, userId },
                update: {},
            }),
            prisma_1.default.story.update({
                where: { id: storyId },
                data: { viewCount: { increment: 1 } },
            }),
        ]);
        // Audit log - story viewed (optional, but good for tracking engagement)
        if (userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'STORY_VIEW',
                category: 'SOCIAL',
                severity: 'LOW',
                resource: 'Story',
                resourceId: storyId,
                description: `Story visualizado pelo usuário`,
                metadata: { ownerId: story.userId }
            }).catch(err => console.error('[AUDIT]', err));
        }
    }
    /**
     * Delete a story
     */
    async delete(storyId, userId, userEmail) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
            select: { userId: true },
        });
        if (!story) {
            throw new Error('Story não encontrado');
        }
        if (story.userId !== userId) {
            throw new Error('Você não tem permissão para excluir este story');
        }
        await prisma_1.default.story.delete({
            where: { id: storyId },
        });
        // Audit log - story deleted
        if (userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'STORY_DELETE',
                category: 'SOCIAL',
                severity: 'MEDIUM',
                resource: 'Story',
                resourceId: storyId,
                description: `Story deletado pelo usuário`,
                metadata: {}
            }).catch(err => console.error('[AUDIT]', err));
        }
    }
    /**
     * Get story viewers list
     */
    async getViewers(storyId, userId, page = 1, limit = 50) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
            select: { userId: true },
        });
        if (!story) {
            throw new Error('Story não encontrado');
        }
        // Only owner can see viewers
        if (story.userId !== userId) {
            throw new Error('Você não tem permissão para ver os visualizadores');
        }
        const skip = (page - 1) * limit;
        const [views, total] = await Promise.all([
            prisma_1.default.storyView.findMany({
                where: { storyId },
                skip,
                take: limit,
                orderBy: { viewedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma_1.default.storyView.count({ where: { storyId } }),
        ]);
        return {
            viewers: views.map((v) => ({
                id: v.user.id,
                name: v.user.name,
                avatarUrl: v.user.avatar,
                viewedAt: v.viewedAt,
            })),
            total,
        };
    }
    /**
     * Clean up expired stories (to be called by worker)
     */
    async cleanupExpiredStories() {
        const result = await prisma_1.default.story.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }
    /**
     * Get user's active stories count
     */
    async getActiveStoriesCount(userId) {
        return prisma_1.default.story.count({
            where: {
                userId,
                expiresAt: { gt: new Date() },
            },
        });
    }
    /**
     * Get user's active stories count with limit info
     */
    async getActiveStoriesCountWithLimit(userId) {
        const [count, subscription] = await Promise.all([
            this.getActiveStoriesCount(userId),
            prisma_1.default.subscription.findUnique({
                where: { userId },
                select: { plan: true },
            }),
        ]);
        const plan = subscription?.plan || 'FREE';
        const limit = this.getStoryLimit(plan);
        return { count, limit };
    }
    /**
     * Get plan story limit
     */
    getStoryLimit(plan) {
        return STORY_LIMITS[plan] || STORY_LIMITS.FREE;
    }
}
exports.storyService = new StoryService();
