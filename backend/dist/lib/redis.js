"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = exports.redisService = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Configuração do Redis
 */
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true,
};
/**
 * Prefixos de chaves
 */
const KEYS = {
    FEED: 'feed:',
    USER_CACHE: 'user:',
    POST_CACHE: 'post:',
    RATE_LIMIT: 'ratelimit:',
    SESSION: 'session:',
};
/**
 * TTL padrão em segundos
 */
const DEFAULT_TTL = {
    FEED: 24 * 60 * 60, // 24 horas
    USER: 60 * 60, // 1 hora
    POST: 30 * 60, // 30 minutos
    SHORT: 5 * 60, // 5 minutos
};
/**
 * Tamanho máximo do feed por usuário
 */
const MAX_FEED_SIZE = 500;
/**
 * Classe Singleton para gerenciamento do Redis
 */
class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionPromise = null;
    }
    /**
     * Retorna a instância singleton do RedisService
     */
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    /**
     * Conecta ao Redis
     */
    async connect() {
        if (this.isConnected && this.client) {
            return;
        }
        if (this.connectionPromise) {
            return this.connectionPromise;
        }
        this.connectionPromise = new Promise(async (resolve, reject) => {
            try {
                this.client = new ioredis_1.default(REDIS_CONFIG);
                this.client.on('connect', () => {
                    console.log('✅ Redis: Conectado');
                    this.isConnected = true;
                });
                this.client.on('error', (error) => {
                    console.error('❌ Redis Error:', error.message);
                    this.isConnected = false;
                });
                this.client.on('close', () => {
                    console.log('🔌 Redis: Conexão fechada');
                    this.isConnected = false;
                });
                this.client.on('reconnecting', () => {
                    console.log('🔄 Redis: Reconectando...');
                });
                await this.client.connect();
                resolve();
            }
            catch (error) {
                console.error('❌ Falha ao conectar ao Redis:', error);
                this.connectionPromise = null;
                reject(error);
            }
        });
        return this.connectionPromise;
    }
    /**
     * Desconecta do Redis
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            this.connectionPromise = null;
            console.log('👋 Redis: Desconectado graciosamente');
        }
    }
    /**
     * Retorna o cliente Redis (com conexão garantida) - interno
     */
    async getClientInternal() {
        if (!this.client || !this.isConnected) {
            await this.connect();
        }
        return this.client;
    }
    /**
     * Retorna o cliente Redis para uso externo (pode ser null)
     */
    async getClient() {
        try {
            return await this.getClientInternal();
        }
        catch {
            return null;
        }
    }
    // ========== OPERAÇÕES BÁSICAS ==========
    /**
     * Define um valor com TTL opcional
     */
    async set(key, value, ttlSeconds) {
        const client = await this.getClientInternal();
        if (ttlSeconds) {
            await client.setex(key, ttlSeconds, value);
        }
        else {
            await client.set(key, value);
        }
    }
    /**
     * Obtém um valor
     */
    async get(key) {
        const client = await this.getClientInternal();
        return client.get(key);
    }
    /**
     * Deleta uma chave
     */
    async del(key) {
        const client = await this.getClientInternal();
        await client.del(key);
    }
    /**
     * Incrementa um valor
     */
    async incr(key) {
        const client = await this.getClientInternal();
        return client.incr(key);
    }
    /**
     * Define um TTL em uma chave existente
     */
    async expire(key, seconds) {
        const client = await this.getClientInternal();
        await client.expire(key, seconds);
    }
    /**
     * Retorna o TTL restante de uma chave em segundos
     * Retorna -1 se a chave não tem TTL, -2 se não existe
     */
    async ttl(key) {
        const client = await this.getClientInternal();
        return client.ttl(key);
    }
    /**
     * Verifica se uma chave existe
     */
    async exists(key) {
        const client = await this.getClientInternal();
        return (await client.exists(key)) === 1;
    }
    // ========== OPERAÇÕES DE FEED (Sorted Sets) ==========
    /**
     * Adiciona um post ao feed de um usuário
     * @param userId - ID do usuário dono do feed
     * @param postId - ID do post
     * @param timestamp - Timestamp para ordenação (geralmente createdAt.getTime())
     */
    async addToFeed(userId, postId, timestamp) {
        const client = await this.getClientInternal();
        const key = `${KEYS.FEED}${userId}`;
        // Pipeline para operações atômicas
        const pipeline = client.pipeline();
        // Adiciona o post ao sorted set
        pipeline.zadd(key, timestamp, postId);
        // Remove posts antigos se exceder o limite
        pipeline.zremrangebyrank(key, 0, -(MAX_FEED_SIZE + 1));
        // Define TTL no feed
        pipeline.expire(key, DEFAULT_TTL.FEED);
        await pipeline.exec();
    }
    /**
     * Adiciona um post aos feeds de múltiplos usuários (fanout)
     * @param userIds - Array de IDs de usuários
     * @param postId - ID do post
     * @param timestamp - Timestamp para ordenação
     */
    async addToMultipleFeeds(userIds, postId, timestamp) {
        if (userIds.length === 0)
            return;
        const client = await this.getClientInternal();
        const pipeline = client.pipeline();
        for (const userId of userIds) {
            const key = `${KEYS.FEED}${userId}`;
            pipeline.zadd(key, timestamp, postId);
            pipeline.zremrangebyrank(key, 0, -(MAX_FEED_SIZE + 1));
            pipeline.expire(key, DEFAULT_TTL.FEED);
        }
        await pipeline.exec();
    }
    /**
     * Obtém posts do feed de um usuário com paginação
     * @param userId - ID do usuário
     * @param page - Número da página (1-indexed)
     * @param limit - Quantidade de posts por página
     * @returns Array de IDs de posts ordenados do mais recente ao mais antigo
     */
    async getFeed(userId, page = 1, limit = 20) {
        const client = await this.getClientInternal();
        const key = `${KEYS.FEED}${userId}`;
        const offset = (page - 1) * limit;
        const end = offset + limit - 1;
        // ZREVRANGE retorna do maior score (mais recente) ao menor
        return client.zrevrange(key, offset, end);
    }
    /**
     * Obtém o tamanho do feed de um usuário
     */
    async getFeedSize(userId) {
        const client = await this.getClientInternal();
        const key = `${KEYS.FEED}${userId}`;
        return client.zcard(key);
    }
    /**
     * Remove um post do feed de um usuário
     */
    async removeFromFeed(userId, postId) {
        const client = await this.getClientInternal();
        const key = `${KEYS.FEED}${userId}`;
        await client.zrem(key, postId);
    }
    /**
     * Remove um post dos feeds de múltiplos usuários
     */
    async removeFromMultipleFeeds(userIds, postId) {
        if (userIds.length === 0)
            return;
        const client = await this.getClientInternal();
        const pipeline = client.pipeline();
        for (const userId of userIds) {
            const key = `${KEYS.FEED}${userId}`;
            pipeline.zrem(key, postId);
        }
        await pipeline.exec();
    }
    /**
     * Invalida (remove) o feed completo de um usuário
     */
    async invalidateFeed(userId) {
        const client = await this.getClientInternal();
        const key = `${KEYS.FEED}${userId}`;
        await client.del(key);
    }
    /**
     * Verifica se o feed de um usuário está em cache
     */
    async isFeedCached(userId) {
        const client = await this.getClientInternal();
        const key = `${KEYS.FEED}${userId}`;
        return (await client.exists(key)) === 1;
    }
    /**
     * Popula o feed de um usuário com posts (batch)
     * @param userId - ID do usuário
     * @param posts - Array de { postId, timestamp }
     */
    async populateFeed(userId, posts) {
        if (posts.length === 0)
            return;
        const client = await this.getClientInternal();
        const key = `${KEYS.FEED}${userId}`;
        const pipeline = client.pipeline();
        // Adiciona todos os posts
        for (const { postId, timestamp } of posts) {
            pipeline.zadd(key, timestamp, postId);
        }
        // Mantém apenas os mais recentes
        pipeline.zremrangebyrank(key, 0, -(MAX_FEED_SIZE + 1));
        // Define TTL
        pipeline.expire(key, DEFAULT_TTL.FEED);
        await pipeline.exec();
    }
    // ========== OPERAÇÕES DE CACHE ==========
    /**
     * Define cache JSON com TTL
     */
    async setJSON(key, value, ttlSeconds = DEFAULT_TTL.SHORT) {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }
    /**
     * Obtém cache JSON
     */
    async getJSON(key) {
        const value = await this.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    /**
     * Cache de usuário
     */
    async cacheUser(userId, userData) {
        const key = `${KEYS.USER_CACHE}${userId}`;
        await this.setJSON(key, userData, DEFAULT_TTL.USER);
    }
    /**
     * Obtém usuário do cache
     */
    async getCachedUser(userId) {
        const key = `${KEYS.USER_CACHE}${userId}`;
        return this.getJSON(key);
    }
    /**
     * Invalida cache de usuário
     */
    async invalidateUserCache(userId) {
        const key = `${KEYS.USER_CACHE}${userId}`;
        await this.del(key);
    }
    // ========== RATE LIMITING ==========
    /**
     * Incrementa contador de rate limit
     * @returns Número atual de requests
     */
    async incrementRateLimit(key, windowSeconds) {
        const client = await this.getClientInternal();
        const fullKey = `${KEYS.RATE_LIMIT}${key}`;
        const pipeline = client.pipeline();
        pipeline.incr(fullKey);
        pipeline.expire(fullKey, windowSeconds);
        const results = await pipeline.exec();
        return results?.[0]?.[1] || 1;
    }
    /**
     * Obtém contagem atual de rate limit
     */
    async getRateLimitCount(key) {
        const client = await this.getClientInternal();
        const fullKey = `${KEYS.RATE_LIMIT}${key}`;
        const value = await client.get(fullKey);
        return parseInt(value || '0', 10);
    }
    // ========== HEALTH CHECK ==========
    /**
     * Verifica se o Redis está saudável
     */
    async healthCheck() {
        try {
            const client = await this.getClientInternal();
            const start = Date.now();
            await client.ping();
            const latency = Date.now() - start;
            return { connected: true, latency };
        }
        catch {
            return { connected: false };
        }
    }
    /**
     * Retorna estatísticas do Redis
     */
    async getStats() {
        try {
            const client = await this.getClientInternal();
            const info = await client.info();
            const memoryMatch = info.match(/used_memory_human:(\S+)/);
            const clientsMatch = info.match(/connected_clients:(\d+)/);
            const uptimeMatch = info.match(/uptime_in_days:(\d+)/);
            return {
                memory: memoryMatch?.[1] || 'N/A',
                clients: clientsMatch?.[1] || 'N/A',
                uptime: uptimeMatch?.[1] ? `${uptimeMatch[1]} dias` : 'N/A',
            };
        }
        catch {
            return null;
        }
    }
}
exports.RedisService = RedisService;
// Exporta a instância singleton
exports.redis = RedisService.getInstance();
// Alias para compatibilidade
exports.redisService = exports.redis;
// Graceful shutdown
process.on('SIGINT', async () => {
    await exports.redis.disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await exports.redis.disconnect();
    process.exit(0);
});
