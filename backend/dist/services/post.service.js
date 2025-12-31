"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const redis_1 = require("../lib/redis");
const feed_service_1 = require("./feed.service");
// Include completo para posts
const postInclude = {
    user: {
        select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            role: true,
        },
    },
    book: {
        select: {
            id: true,
            title: true,
            coverUrl: true,
            author: true,
        },
    },
    chapter: {
        select: {
            id: true,
            title: true,
            orderIndex: true,
        },
    },
    sharedPost: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                },
            },
        },
    },
    _count: {
        select: {
            comments: true,
            likes: true,
        },
    },
};
class PostService {
    /**
     * Cria um novo post
     */
    async create(userId, data) {
        // Validações
        if (!data.content || data.content.trim().length === 0) {
            throw new Error('O conteúdo do post é obrigatório');
        }
        if (data.content.length > 2000) {
            throw new Error('O conteúdo do post não pode exceder 2000 caracteres');
        }
        // Validações de tipo
        if (data.type === 'BOOK_UPDATE' && !data.bookId) {
            throw new Error('Para atualização de livro, o bookId é obrigatório');
        }
        if (data.type === 'CHAPTER_PREVIEW' && !data.chapterId) {
            throw new Error('Para preview de capítulo, o chapterId é obrigatório');
        }
        if (data.type === 'SHARED' && !data.sharedPostId) {
            throw new Error('Para compartilhar, o sharedPostId é obrigatório');
        }
        // Verifica se o post compartilhado existe
        if (data.sharedPostId) {
            const sharedPost = await prisma_1.default.post.findUnique({
                where: { id: data.sharedPostId },
            });
            if (!sharedPost) {
                throw new Error('Post a ser compartilhado não encontrado');
            }
        }
        // Verifica se o livro existe
        if (data.bookId) {
            const book = await prisma_1.default.book.findUnique({
                where: { id: data.bookId },
            });
            if (!book) {
                throw new Error('Livro não encontrado');
            }
        }
        // Verifica se o capítulo existe
        if (data.chapterId) {
            const chapter = await prisma_1.default.chapter.findUnique({
                where: { id: data.chapterId },
            });
            if (!chapter) {
                throw new Error('Capítulo não encontrado');
            }
        }
        const post = await prisma_1.default.post.create({
            data: {
                userId,
                type: data.type,
                content: data.content.trim(),
                mediaUrl: data.mediaUrl,
                bookId: data.bookId,
                chapterId: data.chapterId,
                sharedPostId: data.sharedPostId,
            },
            include: postInclude,
        });
        // Se é um compartilhamento, incrementa o contador do post original
        if (data.sharedPostId) {
            await prisma_1.default.post.update({
                where: { id: data.sharedPostId },
                data: { shareCount: { increment: 1 } },
            });
        }
        // Adiciona ao feed dos seguidores (fanout-on-write via FeedService)
        feed_service_1.feedService.addPostToFollowerFeeds(post.id, userId, post.createdAt).catch(err => {
            console.error('[PostService] Erro no fanout:', err);
        });
        return post;
    }
    /**
     * Busca um post por ID
     */
    async getById(id, userId) {
        const post = await prisma_1.default.post.findUnique({
            where: { id },
            include: {
                ...postInclude,
                comments: {
                    take: 3,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        if (!post) {
            throw new Error('Post não encontrado');
        }
        // Verifica se o usuário curtiu o post
        let isLiked = false;
        if (userId) {
            const like = await prisma_1.default.like.findUnique({
                where: {
                    postId_userId: {
                        postId: id,
                        userId,
                    },
                },
            });
            isLiked = !!like;
        }
        return { ...post, isLiked };
    }
    /**
     * Feed personalizado do usuário
     */
    async getFeed(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        // Tenta buscar do cache Redis primeiro
        try {
            const cachedPostIds = await redis_1.redisService.getFeed(userId, page, limit);
            if (cachedPostIds && cachedPostIds.length > 0) {
                const posts = await this.getPostsByIds(cachedPostIds, userId);
                const feedSize = await redis_1.redisService.getFeedSize(userId);
                const totalPages = Math.ceil(feedSize / limit);
                const hasMore = page < totalPages;
                return {
                    data: posts,
                    total: feedSize,
                    page,
                    limit,
                    totalPages,
                    hasMore,
                };
            }
        }
        catch (err) {
            console.error('[PostService] Redis cache miss ou erro:', err);
        }
        // Fallback: busca do banco
        // Busca IDs de quem o usuário segue
        const following = await prisma_1.default.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map(f => f.followingId);
        // Inclui os próprios posts do usuário
        followingIds.push(userId);
        const [posts, total] = await Promise.all([
            prisma_1.default.post.findMany({
                where: {
                    userId: { in: followingIds },
                },
                include: postInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.post.count({
                where: {
                    userId: { in: followingIds },
                },
            }),
        ]);
        // Verifica quais posts o usuário curtiu
        const likedPosts = await prisma_1.default.like.findMany({
            where: {
                userId,
                postId: { in: posts.map(p => p.id) },
            },
            select: { postId: true },
        });
        const likedPostIds = new Set(likedPosts.map(l => l.postId));
        const postsWithLikes = posts.map(post => ({
            ...post,
            isLiked: likedPostIds.has(post.id),
        }));
        return {
            data: postsWithLikes,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + posts.length < total,
        };
    }
    /**
     * Posts em destaque (explore)
     */
    async getExplore(page = 1, limit = 20, userId) {
        const skip = (page - 1) * limit;
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const [posts, total] = await Promise.all([
            prisma_1.default.post.findMany({
                where: {
                    createdAt: { gte: fortyEightHoursAgo },
                },
                include: postInclude,
                orderBy: [
                    { likeCount: 'desc' },
                    { commentCount: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma_1.default.post.count({
                where: {
                    createdAt: { gte: fortyEightHoursAgo },
                },
            }),
        ]);
        // Verifica quais posts o usuário curtiu
        let likedPostIds = new Set();
        if (userId) {
            const likedPosts = await prisma_1.default.like.findMany({
                where: {
                    userId,
                    postId: { in: posts.map(p => p.id) },
                },
                select: { postId: true },
            });
            likedPostIds = new Set(likedPosts.map(l => l.postId));
        }
        const postsWithLikes = posts.map(post => ({
            ...post,
            isLiked: userId ? likedPostIds.has(post.id) : undefined,
        }));
        return {
            data: postsWithLikes,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + posts.length < total,
        };
    }
    /**
     * Posts de um usuário específico
     */
    async getByUser(targetUserId, page = 1, limit = 20, currentUserId) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            prisma_1.default.post.findMany({
                where: { userId: targetUserId },
                include: postInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.post.count({
                where: { userId: targetUserId },
            }),
        ]);
        // Verifica quais posts o usuário curtiu
        let likedPostIds = new Set();
        if (currentUserId) {
            const likedPosts = await prisma_1.default.like.findMany({
                where: {
                    userId: currentUserId,
                    postId: { in: posts.map(p => p.id) },
                },
                select: { postId: true },
            });
            likedPostIds = new Set(likedPosts.map(l => l.postId));
        }
        const postsWithLikes = posts.map(post => ({
            ...post,
            isLiked: currentUserId ? likedPostIds.has(post.id) : undefined,
        }));
        return {
            data: postsWithLikes,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + posts.length < total,
        };
    }
    /**
     * Deleta um post
     */
    async delete(id, userId, isAdmin = false) {
        const post = await prisma_1.default.post.findUnique({
            where: { id },
            select: { userId: true },
        });
        if (!post) {
            throw new Error('Post não encontrado');
        }
        if (post.userId !== userId && !isAdmin) {
            throw new Error('Você não tem permissão para deletar este post');
        }
        await prisma_1.default.post.delete({
            where: { id },
        });
        // Remove do feed dos seguidores via FeedService
        feed_service_1.feedService.removePostFromFeeds(id, post.userId).catch(err => {
            console.error('[PostService] Erro ao remover do feed:', err);
        });
    }
    /**
     * Busca posts por IDs (mantendo ordem)
     */
    async getPostsByIds(ids, userId) {
        const posts = await prisma_1.default.post.findMany({
            where: { id: { in: ids } },
            include: postInclude,
        });
        // Ordena pelos IDs originais
        const postMap = new Map(posts.map(p => [p.id, p]));
        const orderedPosts = ids.map(id => postMap.get(id)).filter(Boolean);
        // Verifica quais posts o usuário curtiu
        let likedPostIds = new Set();
        if (userId) {
            const likedPosts = await prisma_1.default.like.findMany({
                where: {
                    userId,
                    postId: { in: ids },
                },
                select: { postId: true },
            });
            likedPostIds = new Set(likedPosts.map(l => l.postId));
        }
        return orderedPosts.map(post => ({
            ...post,
            isLiked: likedPostIds.has(post.id),
        }));
    }
    /**
     * Reconstrói o feed de um usuário
     */
    async rebuildFeed(userId) {
        // Invalida o cache atual
        await redis_1.redisService.invalidateFeed(userId);
        // Busca quem o usuário segue
        const following = await prisma_1.default.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map(f => f.followingId);
        followingIds.push(userId);
        // Busca os últimos 500 posts
        const posts = await prisma_1.default.post.findMany({
            where: {
                userId: { in: followingIds },
            },
            select: {
                id: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        // Popula o cache
        for (const post of posts) {
            await redis_1.redisService.addToFeed(userId, post.id, post.createdAt.getTime());
        }
    }
}
exports.postService = new PostService();
