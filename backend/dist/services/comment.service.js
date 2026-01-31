"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const livra_service_1 = require("./livra.service");
const achievement_service_1 = require("./achievement.service");
const audit_service_1 = require("./audit.service");
/**
 * Comment validation constants
 */
const COMMENT_MIN_LENGTH = 1;
const COMMENT_MAX_LENGTH = 1000;
/**
 * Sanitize comment content - remove potentially harmful content
 */
function sanitizeContent(content) {
    return content
        .trim()
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Remove null bytes
        .replace(/\0/g, '');
}
/**
 * Validate comment content
 */
function validateContent(content) {
    if (!content || content.trim().length < COMMENT_MIN_LENGTH) {
        return { valid: false, error: 'Comentário não pode ser vazio' };
    }
    if (content.length > COMMENT_MAX_LENGTH) {
        return { valid: false, error: `Comentário muito longo (máximo ${COMMENT_MAX_LENGTH} caracteres)` };
    }
    return { valid: true };
}
/**
 * Service for managing comments
 */
class CommentService {
    /**
     * Create a new comment on a post
     */
    async create(postId, userId, data, userEmail) {
        // Validate and sanitize content
        const sanitizedContent = sanitizeContent(data.content);
        const validation = validateContent(sanitizedContent);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        // Check if post exists
        const post = await prisma_1.default.post.findUnique({
            where: { id: postId },
            select: { id: true, userId: true }
        });
        if (!post) {
            throw new Error('Post não encontrado');
        }
        // If it's a reply, check if parent comment exists
        if (data.parentId) {
            const parentComment = await prisma_1.default.comment.findUnique({
                where: { id: data.parentId },
                select: { id: true, postId: true, userId: true }
            });
            if (!parentComment) {
                throw new Error('Comentário pai não encontrado');
            }
            if (parentComment.postId !== postId) {
                throw new Error('Comentário pai não pertence a este post');
            }
        }
        // Create comment and increment post comment count
        const [comment] = await prisma_1.default.$transaction([
            prisma_1.default.comment.create({
                data: {
                    postId,
                    userId,
                    content: sanitizedContent,
                    parentId: data.parentId || null
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            }),
            prisma_1.default.post.update({
                where: { id: postId },
                data: { commentCount: { increment: 1 } }
            })
        ]);
        // Audit log - comment created
        if (userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'COMMENT_CREATE',
                category: 'SOCIAL',
                severity: 'LOW',
                resource: 'Comment',
                resourceId: comment.id,
                description: `Comentário criado no post`,
                metadata: { postId, content: sanitizedContent.substring(0, 100), parentId: data.parentId }
            }).catch(err => console.error('[AUDIT]', err));
        }
        // Create notification for post author (if not self-comment)
        if (post.userId !== userId) {
            await this.createCommentNotification(postId, post.userId, userId, data.content);
            // Sprint 8: Award Livras to post author
            try {
                await livra_service_1.livraService.awardForCommentReceived(post.userId, postId, userId, comment.id);
            }
            catch (err) {
                console.error('Failed to award Livras for comment:', err);
            }
            // Sprint 10: Check achievements for comments received
            setImmediate(async () => {
                try {
                    await achievement_service_1.achievementService.checkAndUnlock(post.userId, 'comments_received');
                }
                catch (err) {
                    console.error('Failed to check achievements:', err);
                }
            });
        }
        // If reply, notify parent comment author
        if (data.parentId) {
            const parentComment = await prisma_1.default.comment.findUnique({
                where: { id: data.parentId },
                select: { userId: true }
            });
            if (parentComment && parentComment.userId !== userId && parentComment.userId !== post.userId) {
                await this.createReplyNotification(postId, parentComment.userId, userId, data.content);
            }
        }
        return comment;
    }
    /**
     * Get comments for a post (root comments or replies)
     */
    async getByPost(postId, page = 1, limit = 20, parentId = null) {
        const skip = (page - 1) * limit;
        const whereClause = {
            postId,
            parentId: parentId || null
        };
        const [comments, total] = await Promise.all([
            prisma_1.default.comment.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        }
                    },
                    _count: {
                        select: { replies: true }
                    }
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit
            }),
            prisma_1.default.comment.count({ where: whereClause })
        ]);
        const commentsWithReplyCount = comments.map(comment => ({
            ...comment,
            replyCount: comment._count.replies,
            _count: undefined
        }));
        return {
            comments: commentsWithReplyCount,
            total,
            page,
            limit,
            hasMore: skip + comments.length < total
        };
    }
    /**
     * Get replies for a comment
     */
    async getReplies(commentId, page = 1, limit = 10) {
        const comment = await prisma_1.default.comment.findUnique({
            where: { id: commentId },
            select: { postId: true }
        });
        if (!comment) {
            throw new Error('Comentário não encontrado');
        }
        return this.getByPost(comment.postId, page, limit, commentId);
    }
    /**
     * Update a comment
     */
    async update(commentId, userId, content, userEmail) {
        const comment = await prisma_1.default.comment.findUnique({
            where: { id: commentId },
            select: { id: true, userId: true, content: true }
        });
        if (!comment) {
            throw new Error('Comentário não encontrado');
        }
        if (comment.userId !== userId) {
            throw new Error('Você não tem permissão para editar este comentário');
        }
        const updated = await prisma_1.default.comment.update({
            where: { id: commentId },
            data: { content },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });
        // Audit log - comment updated
        if (userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'COMMENT_UPDATE',
                category: 'SOCIAL',
                severity: 'LOW',
                resource: 'Comment',
                resourceId: commentId,
                description: `Comentário atualizado`,
                metadata: {
                    before: comment.content.substring(0, 100),
                    after: content.substring(0, 100)
                }
            }).catch(err => console.error('[AUDIT]', err));
        }
        return updated;
    }
    /**
     * Delete a comment
     */
    async delete(commentId, userId, isAdmin = false, userEmail) {
        const comment = await prisma_1.default.comment.findUnique({
            where: { id: commentId },
            select: { id: true, userId: true, postId: true, content: true },
        });
        if (!comment) {
            throw new Error('Comentário não encontrado');
        }
        if (comment.userId !== userId && !isAdmin) {
            throw new Error('Você não tem permissão para excluir este comentário');
        }
        // Count this comment and its replies to decrement post comment count
        const replyCount = await prisma_1.default.comment.count({
            where: { parentId: commentId }
        });
        const totalToDecrement = 1 + replyCount;
        await prisma_1.default.$transaction([
            // Delete replies first (cascade should handle this, but being explicit)
            prisma_1.default.comment.deleteMany({
                where: { parentId: commentId }
            }),
            // Delete the comment
            prisma_1.default.comment.delete({
                where: { id: commentId }
            }),
            // Decrement post comment count
            prisma_1.default.post.update({
                where: { id: comment.postId },
                data: { commentCount: { decrement: totalToDecrement } }
            })
        ]);
        // Audit log - comment deleted
        if (userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'COMMENT_DELETE',
                category: 'SOCIAL',
                severity: 'LOW',
                resource: 'Comment',
                resourceId: commentId,
                description: `Comentário deletado`,
                metadata: { postId: comment.postId, contentPreview: comment.content.substring(0, 100) }
            }).catch(err => console.error('[AUDIT]', err));
        }
    }
    /**
     * Toggle like on a comment
     */
    async toggleCommentLike(commentId, userId) {
        const comment = await prisma_1.default.comment.findUnique({
            where: { id: commentId },
            select: { id: true, likeCount: true }
        });
        if (!comment) {
            throw new Error('Comentário não encontrado');
        }
        const updated = await prisma_1.default.comment.update({
            where: { id: commentId },
            data: { likeCount: { increment: 1 } }
        });
        return {
            liked: true,
            likeCount: updated.likeCount
        };
    }
    /**
     * Create notification for new comment
     */
    async createCommentNotification(postId, authorId, commenterId, content) {
        try {
            const commenter = await prisma_1.default.user.findUnique({
                where: { id: commenterId },
                select: { name: true, username: true }
            });
            if (!commenter)
                return;
            const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
            await prisma_1.default.notification.create({
                data: {
                    userId: authorId,
                    type: 'COMMENT',
                    title: 'Novo comentário',
                    message: `${commenter.name} comentou: "${preview}"`,
                    data: {
                        postId,
                        userId: commenterId,
                        username: commenter.username
                    }
                }
            });
        }
        catch (error) {
            console.error('[CommentService] Error creating notification:', error);
        }
    }
    /**
     * Create notification for reply
     */
    async createReplyNotification(postId, parentAuthorId, replierId, content) {
        try {
            const replier = await prisma_1.default.user.findUnique({
                where: { id: replierId },
                select: { name: true, username: true }
            });
            if (!replier)
                return;
            const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
            await prisma_1.default.notification.create({
                data: {
                    userId: parentAuthorId,
                    type: 'COMMENT',
                    title: 'Nova resposta',
                    message: `${replier.name} respondeu seu comentário: "${preview}"`,
                    data: {
                        postId,
                        userId: replierId,
                        username: replier.username
                    }
                }
            });
        }
        catch (error) {
            console.error('[CommentService] Error creating reply notification:', error);
        }
    }
}
exports.commentService = new CommentService();
