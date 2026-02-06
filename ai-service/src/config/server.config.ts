import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
    port: number;
    nodeEnv: string;
    jwtSecret: string;
    apiKey: string;
    corsOrigins: string[];
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    redis: {
        url: string;
    };
}

export const serverConfig: ServerConfig = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-here',
    apiKey: process.env.AI_SERVICE_API_KEY || '',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
};
