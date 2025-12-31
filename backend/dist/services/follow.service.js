"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const feed_service_1 = require("./feed.service");
/**
 * Service for managing user follows
 */
class FollowService {
    /**
     * Follow or unfollow a user
     */
    async toggleFollow(followerId, followingId) {
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
        // Check if already following
        const existingFollow = await prisma_1.default.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId
                }
            }
        });
        if (existingFollow) {
            // Unfollow
            await prisma_1.default.follow.delete({
                where: { id: existingFollow.id }
            });
            // Update feed cache for the follower (remove unfollowed user's posts)
            await feed_service_1.feedService.onUnfollow(followerId, followingId);
            const followerCount = await prisma_1.default.follow.count({
                where: { followingId }
            });
            return {
                following: false,
                followerCount
            };
        }
        else {
            // Follow
            await prisma_1.default.follow.create({
                data: {
                    followerId,
                    followingId
                }
            });
            // Update feed cache for the follower (new posts will appear)
            await feed_service_1.feedService.onFollow(followerId, followingId);
            // Create notification for followed user
            await this.createFollowNotification(followingId, followerId);
            // TODO: Sprint 8 - Add Livras to followed user
            // await livraService.addLivras(followingId, 5, 'EARNED_FOLLOW', { fromUserId: followerId });
            // TODO: Check achievements (first_follower, 10_followers, 100_followers)
            // await achievementService.checkFollowerAchievements(followingId);
            const followerCount = await prisma_1.default.follow.count({
                where: { followingId }
            });
            return {
                following: true,
                followerCount
            };
        }
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
            // TODO: Emit WebSocket event
        }
        catch (error) {
            console.error('[FollowService] Error creating notification:', error);
        }
    }
}
exports.followService = new FollowService();
