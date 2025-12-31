"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Service for managing post likes
 */
class LikeService {
    /**
     * Toggle like on a post (like if not liked, unlike if already liked)
     */
    async toggleLike(postId, userId) {
        // Check if post exists
        const post = await prisma_1.default.post.findUnique({
            where: { id: postId },
            select: { id: true, userId: true, likeCount: true }
        });
        if (!post) {
            throw new Error('Post não encontrado');
        }
        // Check if already liked
        const existingLike = await prisma_1.default.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });
        if (existingLike) {
            // Unlike: remove like and decrement count
            await prisma_1.default.$transaction([
                prisma_1.default.like.delete({
                    where: { id: existingLike.id }
                }),
                prisma_1.default.post.update({
                    where: { id: postId },
                    data: { likeCount: { decrement: 1 } }
                })
            ]);
            return {
                liked: false,
                likeCount: Math.max(0, post.likeCount - 1)
            };
        }
        else {
            // Like: create like and increment count
            await prisma_1.default.$transaction([
                prisma_1.default.like.create({
                    data: {
                        postId,
                        userId
                    }
                }),
                prisma_1.default.post.update({
                    where: { id: postId },
                    data: { likeCount: { increment: 1 } }
                })
            ]);
            // TODO: Sprint 8 - Add Livras to post author
            // await livraService.addLivras(post.userId, 1, 'EARNED_LIKE', { postId, fromUserId: userId });
            // TODO: Create notification for post author (if not self-like)
            if (post.userId !== userId) {
                await this.createLikeNotification(postId, post.userId, userId);
            }
            return {
                liked: true,
                likeCount: post.likeCount + 1
            };
        }
    }
    /**
     * Check if user has liked a post
     */
    async isLiked(postId, userId) {
        const like = await prisma_1.default.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });
        return !!like;
    }
    /**
     * Check if user has liked multiple posts (batch)
     */
    async isLikedBatch(postIds, userId) {
        const likes = await prisma_1.default.like.findMany({
            where: {
                postId: { in: postIds },
                userId
            },
            select: { postId: true }
        });
        const likedMap = {};
        postIds.forEach(id => {
            likedMap[id] = likes.some(like => like.postId === id);
        });
        return likedMap;
    }
    /**
     * Get users who liked a post
     */
    async getLikesByPost(postId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [likes, total] = await Promise.all([
            prisma_1.default.like.findMany({
                where: { postId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.like.count({ where: { postId } })
        ]);
        return {
            users: likes.map(like => like.user),
            total,
            page,
            limit,
            hasMore: skip + likes.length < total
        };
    }
    /**
     * Create notification for like
     */
    async createLikeNotification(postId, authorId, likerId) {
        try {
            const liker = await prisma_1.default.user.findUnique({
                where: { id: likerId },
                select: { name: true, username: true }
            });
            if (!liker)
                return;
            await prisma_1.default.notification.create({
                data: {
                    userId: authorId,
                    type: 'LIKE',
                    title: 'Nova curtida',
                    message: `${liker.name} curtiu seu post`,
                    data: {
                        postId,
                        userId: likerId,
                        username: liker.username
                    }
                }
            });
            // TODO: Emit WebSocket event for real-time notification
            // websocketService.emitToUser(authorId, 'notification:new', notification);
        }
        catch (error) {
            console.error('[LikeService] Error creating notification:', error);
        }
    }
}
exports.likeService = new LikeService();
