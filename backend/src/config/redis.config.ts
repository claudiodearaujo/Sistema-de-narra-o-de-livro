import { RedisOptions } from 'ioredis';

/**
 * Configuração centralizada do Redis para BullMQ e IORedis
 * Suporta tanto REDIS_URL (recomendado para Redis.io, Upstash, etc.)
 * quanto configurações individuais (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
 */

export function getRedisConfig(): RedisOptions {
  // Prioriza REDIS_URL se disponível (formato: redis://user:password@host:port)
  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);

    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      username: url.username !== 'default' ? url.username : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️  Redis não disponível após 3 tentativas');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      // Configurações TLS para Redis.io/Upstash
      tls: url.protocol === 'rediss:' ? {} : undefined,
    };
  }

  // Fallback para configurações individuais
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('⚠️  Redis não disponível após 3 tentativas');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  };
}

/**
 * Verifica se o Redis está habilitado
 */
export function isRedisEnabled(): boolean {
  return process.env.REDIS_ENABLED !== 'false';
}
