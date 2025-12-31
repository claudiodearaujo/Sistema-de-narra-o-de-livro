"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const redis_1 = require("../lib/redis");
/**
 * Service para gerenciamento de feed com cache Redis
 * Implementa o padrão fanout-on-write para performance
 */
class FeedService {
    constructor() {
        // Configurações
        this.FEED_TTL = 24 * 60 * 60; // 24 horas em segundos
        this.MAX_FEED_SIZE = 500;
        this.FANOUT_LIMIT = 10000; // Limite de seguidores para fanout
    }
    /**
     * Busca o feed de um usuário do cache ou banco
     */
    async getFeed(userId, page = 1, limit = 20) {
        try {
            // Tenta buscar do Redis
            const cachedPostIds = await redis_1.redisService.getFeed(userId, page, limit);
            if (cachedPostIds && cachedPostIds.length > 0) {
                return {
                    postIds: cachedPostIds,
                    fromCache: true,
                };
            }
        }
        catch (error) {
            console.error('[FeedService] Erro ao buscar do Redis:', error);
        }
        // Fallback: busca do banco e popula cache
        const postIds = await this.getPostIdsFromDatabase(userId, page, limit);
        // Popula o cache em background
        this.warmCache(userId).catch(err => {
            console.error('[FeedService] Erro ao aquecer cache:', err);
        });
        return {
            postIds,
            fromCache: false,
        };
    }
    /**
     * Adiciona um post ao feed de todos os seguidores (fanout-on-write)
     */
    async addPostToFollowerFeeds(postId, authorId, timestamp) {
        // Busca todos os seguidores
        const followers = await prisma_1.default.follow.findMany({
            where: { followingId: authorId },
            select: { followerId: true },
        });
        // Verifica limite de fanout
        if (followers.length > this.FANOUT_LIMIT) {
            console.log(`[FeedService] Fanout limitado para autor ${authorId} (${followers.length} seguidores)`);
            // Para autores com muitos seguidores, não fazemos fanout
            // O feed será construído on-read
            return;
        }
        const score = timestamp.getTime();
        const followerIds = followers.map(f => f.followerId);
        // Inclui o próprio autor
        followerIds.push(authorId);
        // Usa batch para melhor performance
        const batchSize = 100;
        for (let i = 0; i < followerIds.length; i += batchSize) {
            const batch = followerIds.slice(i, i + batchSize);
            await Promise.all(batch.map(async (followerId) => {
                try {
                    await redis_1.redisService.addToFeed(followerId, postId, score);
                    // Limita o tamanho do feed
                    await this.trimFeed(followerId);
                }
                catch (error) {
                    console.error(`[FeedService] Erro ao adicionar ao feed de ${followerId}:`, error);
                }
            }));
        }
    }
    /**
     * Remove um post dos feeds de todos os seguidores
     */
    async removePostFromFeeds(postId, authorId) {
        const followers = await prisma_1.default.follow.findMany({
            where: { followingId: authorId },
            select: { followerId: true },
        });
        const followerIds = followers.map(f => f.followerId);
        followerIds.push(authorId);
        const batchSize = 100;
        for (let i = 0; i < followerIds.length; i += batchSize) {
            const batch = followerIds.slice(i, i + batchSize);
            await Promise.all(batch.map(followerId => redis_1.redisService.removeFromFeed(followerId, postId).catch(err => {
                console.error(`[FeedService] Erro ao remover do feed de ${followerId}:`, err);
            })));
        }
    }
    /**
     * Reconstrói o feed de um usuário do zero
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
        // Busca os últimos N posts
        const posts = await prisma_1.default.post.findMany({
            where: {
                userId: { in: followingIds },
            },
            select: {
                id: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: this.MAX_FEED_SIZE,
        });
        // Popula o cache
        for (const post of posts) {
            await redis_1.redisService.addToFeed(userId, post.id, post.createdAt.getTime());
        }
        console.log(`[FeedService] Feed reconstruído para ${userId}: ${posts.length} posts`);
        return posts.length;
    }
    /**
     * Aquece o cache do feed de um usuário
     */
    async warmCache(userId) {
        // Verifica se o cache já existe
        const cached = await redis_1.redisService.getFeed(userId, 1, 1);
        if (cached && cached.length > 0) {
            return; // Cache já aquecido
        }
        await this.rebuildFeed(userId);
    }
    /**
     * Limita o tamanho do feed para MAX_FEED_SIZE
     */
    async trimFeed(userId) {
        try {
            // Remove posts além do limite (mantém os mais recentes)
            const client = await redis_1.redisService.getClient();
            if (client) {
                const key = `feed:${userId}`;
                // ZREMRANGEBYRANK remove os elementos com menor score (mais antigos)
                // -MAX_FEED_SIZE-1 mantém os últimos MAX_FEED_SIZE elementos
                await client.zremrangebyrank(key, 0, -(this.MAX_FEED_SIZE + 1));
            }
        }
        catch (error) {
            console.error(`[FeedService] Erro ao limitar feed de ${userId}:`, error);
        }
    }
    /**
     * Busca IDs de posts do banco de dados
     */
    async getPostIdsFromDatabase(userId, page, limit) {
        const skip = (page - 1) * limit;
        // Busca quem o usuário segue
        const following = await prisma_1.default.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map(f => f.followingId);
        followingIds.push(userId);
        const posts = await prisma_1.default.post.findMany({
            where: {
                userId: { in: followingIds },
            },
            select: { id: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });
        return posts.map(p => p.id);
    }
    /**
     * Evento: usuário começou a seguir alguém
     * Atualiza o feed para incluir posts do novo seguido
     */
    async onFollow(followerId, followingId) {
        // Busca os posts recentes do novo seguido
        const posts = await prisma_1.default.post.findMany({
            where: { userId: followingId },
            select: {
                id: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Últimos 50 posts
        });
        // Adiciona ao feed do seguidor
        for (const post of posts) {
            await redis_1.redisService.addToFeed(followerId, post.id, post.createdAt.getTime());
        }
        // Limita o feed
        await this.trimFeed(followerId);
    }
    /**
     * Evento: usuário deixou de seguir alguém
     * Remove os posts do ex-seguido do feed
     */
    async onUnfollow(followerId, unfollowedId) {
        // Busca os posts do ex-seguido que estão no feed
        const posts = await prisma_1.default.post.findMany({
            where: { userId: unfollowedId },
            select: { id: true },
        });
        // Remove do feed
        for (const post of posts) {
            await redis_1.redisService.removeFromFeed(followerId, post.id);
        }
    }
}
exports.feedService = new FeedService();
