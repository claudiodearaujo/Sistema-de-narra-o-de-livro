import Redis from 'ioredis';
import { getRedisConfig } from '../config/redis.config';

/**
 * Configuração do Redis
 */
const REDIS_CONFIG = {
  ...getRedisConfig(),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
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
} as const;

/**
 * TTL padrão em segundos
 */
const DEFAULT_TTL = {
  FEED: 24 * 60 * 60, // 24 horas
  USER: 60 * 60, // 1 hora
  POST: 30 * 60, // 30 minutos
  SHORT: 5 * 60, // 5 minutos
} as const;

/**
 * Tamanho máximo do feed por usuário
 */
const MAX_FEED_SIZE = 500;

/**
 * Classe Singleton para gerenciamento do Redis
 */
class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Retorna a instância singleton do RedisService
   */
  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Conecta ao Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        this.client = new Redis(REDIS_CONFIG);

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
      } catch (error) {
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
  async disconnect(): Promise<void> {
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
  private async getClientInternal(): Promise<Redis> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client!;
  }

  /**
   * Retorna o cliente Redis para uso externo (pode ser null)
   */
  async getClient(): Promise<Redis | null> {
    try {
      return await this.getClientInternal();
    } catch {
      return null;
    }
  }

  // ========== OPERAÇÕES BÁSICAS ==========

  /**
   * Define um valor com TTL opcional
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = await this.getClientInternal();
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  /**
   * Obtém um valor
   */
  async get(key: string): Promise<string | null> {
    const client = await this.getClientInternal();
    return client.get(key);
  }

  /**
   * Deleta uma chave
   */
  async del(key: string): Promise<void> {
    const client = await this.getClientInternal();
    await client.del(key);
  }

  /**
   * Incrementa um valor
   */
  async incr(key: string): Promise<number> {
    const client = await this.getClientInternal();
    return client.incr(key);
  }

  /**
   * Define um TTL em uma chave existente
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = await this.getClientInternal();
    await client.expire(key, seconds);
  }

  /**
   * Retorna o TTL restante de uma chave em segundos
   * Retorna -1 se a chave não tem TTL, -2 se não existe
   */
  async ttl(key: string): Promise<number> {
    const client = await this.getClientInternal();
    return client.ttl(key);
  }

  /**
   * Verifica se uma chave existe
   */
  async exists(key: string): Promise<boolean> {
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
  async addToFeed(userId: string, postId: string, timestamp: number): Promise<void> {
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
  async addToMultipleFeeds(userIds: string[], postId: string, timestamp: number): Promise<void> {
    if (userIds.length === 0) return;

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
  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<string[]> {
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
  async getFeedSize(userId: string): Promise<number> {
    const client = await this.getClientInternal();
    const key = `${KEYS.FEED}${userId}`;
    return client.zcard(key);
  }

  /**
   * Remove um post do feed de um usuário
   */
  async removeFromFeed(userId: string, postId: string): Promise<void> {
    const client = await this.getClientInternal();
    const key = `${KEYS.FEED}${userId}`;
    await client.zrem(key, postId);
  }

  /**
   * Remove um post dos feeds de múltiplos usuários
   */
  async removeFromMultipleFeeds(userIds: string[], postId: string): Promise<void> {
    if (userIds.length === 0) return;

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
  async invalidateFeed(userId: string): Promise<void> {
    const client = await this.getClientInternal();
    const key = `${KEYS.FEED}${userId}`;
    await client.del(key);
  }

  /**
   * Verifica se o feed de um usuário está em cache
   */
  async isFeedCached(userId: string): Promise<boolean> {
    const client = await this.getClientInternal();
    const key = `${KEYS.FEED}${userId}`;
    return (await client.exists(key)) === 1;
  }

  /**
   * Popula o feed de um usuário com posts (batch)
   * @param userId - ID do usuário
   * @param posts - Array de { postId, timestamp }
   */
  async populateFeed(userId: string, posts: Array<{ postId: string; timestamp: number }>): Promise<void> {
    if (posts.length === 0) return;

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
  async setJSON<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL.SHORT): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Obtém cache JSON
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Cache de usuário
   */
  async cacheUser(userId: string, userData: object): Promise<void> {
    const key = `${KEYS.USER_CACHE}${userId}`;
    await this.setJSON(key, userData, DEFAULT_TTL.USER);
  }

  /**
   * Obtém usuário do cache
   */
  async getCachedUser<T>(userId: string): Promise<T | null> {
    const key = `${KEYS.USER_CACHE}${userId}`;
    return this.getJSON<T>(key);
  }

  /**
   * Invalida cache de usuário
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const key = `${KEYS.USER_CACHE}${userId}`;
    await this.del(key);
  }

  // ========== RATE LIMITING ==========

  /**
   * Incrementa contador de rate limit
   * @returns Número atual de requests
   */
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const client = await this.getClientInternal();
    const fullKey = `${KEYS.RATE_LIMIT}${key}`;

    const pipeline = client.pipeline();
    pipeline.incr(fullKey);
    pipeline.expire(fullKey, windowSeconds);

    const results = await pipeline.exec();
    return results?.[0]?.[1] as number || 1;
  }

  /**
   * Obtém contagem atual de rate limit
   */
  async getRateLimitCount(key: string): Promise<number> {
    const client = await this.getClientInternal();
    const fullKey = `${KEYS.RATE_LIMIT}${key}`;
    const value = await client.get(fullKey);
    return parseInt(value || '0', 10);
  }

  // ========== HEALTH CHECK ==========

  /**
   * Verifica se o Redis está saudável
   */
  async healthCheck(): Promise<{ connected: boolean; latency?: number }> {
    try {
      const client = await this.getClientInternal();
      const start = Date.now();
      await client.ping();
      const latency = Date.now() - start;
      return { connected: true, latency };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Retorna estatísticas do Redis
   */
  async getStats(): Promise<{ memory: string; clients: string; uptime: string } | null> {
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
    } catch {
      return null;
    }
  }
}

// Exporta a instância singleton
export const redis = RedisService.getInstance();

// Alias para compatibilidade
export const redisService = redis;

// Exporta a classe para testes
export { RedisService };

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redis.disconnect();
  process.exit(0);
});
