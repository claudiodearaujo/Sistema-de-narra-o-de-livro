"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const feed_service_1 = require("./feed.service");
const livra_service_1 = require("./livra.service");
const achievement_service_1 = require("./achievement.service");
const audit_service_1 = require("./audit.service");
/**
 * Service for managing user follows
 */
class FollowService {
    /**
     * Follow or unfollow a user (atomic operation using transaction)
     */
    async toggleFollow(followerId, followingId, userEmail) {
        // Cannot follow yourself
        if (followerId === followingId) {
            throw new Error('Você não pode seguir a si mesmo');
        }
        // Check if target user exists
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: followingId },
            select: { id: true, name: true }
        });
        if (!targetUser) {
            throw new Error('Usuário não encontrado');
        }
        // Use transaction to prevent race conditions
        return await prisma_1.default.$transaction(async (tx) => {
            // Check if already following (within transaction for consistency)
            const existingFollow = await tx.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId
                    }
                }
            });
            if (existingFollow) {
                // Unfollow - delete within transaction
                await tx.follow.delete({
                    where: { id: existingFollow.id }
                });
                // Audit log - unfollow
                if (userEmail) {
                    audit_service_1.auditService.log({
                        userId: followerId,
                        userEmail,
                        action: 'USER_UNFOLLOW',
                        category: 'SOCIAL',
                        severity: 'LOW',
                        resource: 'User',
                        resourceId: followingId,
                        description: `Usuário deixou de seguir ${targetUser.name}`,
                        metadata: { followingId, targetName: targetUser.name }
                    }).catch(err => console.error('[AUDIT]', err));
                }
                const followerCount = await tx.follow.count({
                    where: { followingId }
                });
                // Update feed cache outside transaction (non-critical)
                setImmediate(() => feed_service_1.feedService.onUnfollow(followerId, followingId));
                return {
                    following: false,
                    followerCount
                };
            }
            else {
                // Follow - create within transaction
                await tx.follow.create({
                    data: {
                        followerId,
                        followingId
                    }
                });
                // Audit log - follow
                if (userEmail) {
                    audit_service_1.auditService.log({
                        userId: followerId,
                        userEmail,
                        action: 'USER_FOLLOW',
                        category: 'SOCIAL',
                        severity: 'LOW',
                        resource: 'User',
                        resourceId: followingId,
                        description: `Usuário começou a seguir ${targetUser.name}`,
                        metadata: { followingId, targetName: targetUser.name }
                    }).catch(err => console.error('[AUDIT]', err));
                }
                const followerCount = await tx.follow.count({
                    where: { followingId }
                });
                // Side effects outside transaction (non-critical)
                setImmediate(async () => {
                    await feed_service_1.feedService.onFollow(followerId, followingId);
                    await this.createFollowNotification(followingId, followerId);
                    // Sprint 8: Award Livras to followed user
                    try {
                        await livra_service_1.livraService.awardForFollowReceived(followingId, followerId);
                    }
                    catch (err) {
                        console.error('Failed to award Livras for follow:', err);
                    }
                    // Sprint 10: Check achievements for both users
                    try {
                        // Check follower achievements for the followed user
                        await achievement_service_1.achievementService.checkAndUnlock(followingId, 'followers_count');
                        // Check following achievements for the follower
                        await achievement_service_1.achievementService.checkAndUnlock(followerId, 'following_count');
                    }
                    catch (err) {
                        console.error('Failed to check achievements:', err);
                    }
                });
                return {
                    following: true,
                    followerCount
                };
            }
        });
    }
    /**
     * Check if a user is following another
     */
    async isFollowing(followerId, followingId) {
        const follow = await prisma_1.default.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId
                }
            }
        });
        return !!follow;
    }
    /**
     * Get follow status between two users
     */
    async getFollowStatus(userId, targetId) {
        const [isFollowing, isFollowedBy] = await Promise.all([
            this.isFollowing(userId, targetId),
            this.isFollowing(targetId, userId)
        ]);
        return { isFollowing, isFollowedBy };
    }
    /**
     * Get followers of a user
     */
    async getFollowers(userId, page = 1, limit = 20, currentUserId) {
        const skip = (page - 1) * limit;
        const [follows, total] = await Promise.all([
            prisma_1.default.follow.findMany({
                where: { followingId: userId },
                include: {
                    follower: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
                            bio: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.follow.count({ where: { followingId: userId } })
        ]);
        let users = follows.map(f => f.follower);
        // If current user is logged in, check if they follow each user
        if (currentUserId) {
            const userIds = users.map(u => u.id);
            const currentUserFollows = await prisma_1.default.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: { in: userIds }
                },
                select: { followingId: true }
            });
            const followingSet = new Set(currentUserFollows.map(f => f.followingId));
            users = users.map(u => ({
                ...u,
                isFollowing: followingSet.has(u.id)
            }));
        }
        return {
            users,
            total,
            page,
            limit,
            hasMore: skip + follows.length < total
        };
    }
    /**
     * Get users that a user is following
     */
    async getFollowing(userId, page = 1, limit = 20, currentUserId) {
        const skip = (page - 1) * limit;
        const [follows, total] = await Promise.all([
            prisma_1.default.follow.findMany({
                where: { followerId: userId },
                include: {
                    following: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
                            bio: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.follow.count({ where: { followerId: userId } })
        ]);
        let users = follows.map(f => f.following);
        // If current user is logged in, check if they follow each user
        if (currentUserId) {
            const userIds = users.map(u => u.id);
            const currentUserFollows = await prisma_1.default.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: { in: userIds }
                },
                select: { followingId: true }
            });
            const followingSet = new Set(currentUserFollows.map(f => f.followingId));
            users = users.map(u => ({
                ...u,
                isFollowing: followingSet.has(u.id)
            }));
        }
        return {
            users,
            total,
            page,
            limit,
            hasMore: skip + follows.length < total
        };
    }
    /**
     * Get follow counts for a user
     */
    async getFollowCounts(userId) {
        const [followers, following] = await Promise.all([
            prisma_1.default.follow.count({ where: { followingId: userId } }),
            prisma_1.default.follow.count({ where: { followerId: userId } })
        ]);
        return { followers, following };
    }
    /**
     * Get suggested users to follow
     */
    async getSuggestions(userId, limit = 5) {
        // Get users that the current user is NOT following
        // Prioritize users with more followers (popular users)
        const following = await prisma_1.default.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const followingIds = following.map(f => f.followingId);
        followingIds.push(userId); // Exclude self
        const suggestions = await prisma_1.default.user.findMany({
            where: {
                id: { notIn: followingIds },
                role: { in: ['WRITER', 'PRO'] } // Prioritize writers
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                _count: {
                    select: { followers: true }
                }
            },
            orderBy: {
                followers: { _count: 'desc' }
            },
            take: limit
        });
        return suggestions.map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            avatar: u.avatar,
            bio: u.bio,
            isFollowing: false
        }));
    }
    /**
     * Create notification for new follower
     */
    async createFollowNotification(followingId, followerId) {
        try {
            const follower = await prisma_1.default.user.findUnique({
                where: { id: followerId },
                select: { name: true, username: true }
            });
            if (!follower)
                return;
            await prisma_1.default.notification.create({
                data: {
                    userId: followingId,
                    type: 'FOLLOW',
                    title: 'Novo seguidor',
                    message: `${follower.name} começou a seguir você`,
                    data: {
                        userId: followerId,
                        username: follower.username
                    }
                }
            });
        }
        catch (error) {
            console.error('[FollowService] Error creating notification:', error);
        }
    }
}
exports.followService = new FollowService();
