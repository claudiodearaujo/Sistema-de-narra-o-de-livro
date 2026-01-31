"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMITS = void 0;
exports.rateLimit = rateLimit;
exports.getRateLimitInfo = getRateLimitInfo;
const redis_1 = require("../lib/redis");
/**
 * Predefined rate limits for different actions
 */
exports.RATE_LIMITS = {
    // Messages: 30 per minute for free, 60 for premium, 120 for pro
    'message:send': {
        maxRequests: 30,
        windowSeconds: 60,
        planLimits: {
            FREE: 30,
            PREMIUM: 60,
            PRO: 120
        }
    },
    // Typing indicators: 10 per 10 seconds (prevent spam)
    'message:typing': {
        maxRequests: 10,
        windowSeconds: 10
    },
    // Posts: 10 per hour for free, 30 for premium, unlimited for pro
    'post:create': {
        maxRequests: 10,
        windowSeconds: 3600,
        planLimits: {
            FREE: 10,
            PREMIUM: 30,
            PRO: 1000 // Effectively unlimited
        }
    },
    // Comments: 30 per 10 minutes
    'comment:create': {
        maxRequests: 30,
        windowSeconds: 600,
        planLimits: {
            FREE: 30,
            PREMIUM: 60,
            PRO: 120
        }
    },
    // Follow actions: 50 per hour (prevent follow/unfollow spam)
    'follow:toggle': {
        maxRequests: 50,
        windowSeconds: 3600
    },
    // API general: 1000 requests per minute
    'api:general': {
        maxRequests: 1000,
        windowSeconds: 60
    }
};
/**
 * Get the rate limit for a user based on action and plan
 */
function getRateLimit(action, plan) {
    const config = exports.RATE_LIMITS[action] || exports.RATE_LIMITS['api:general'];
    if (config.planLimits && plan) {
        const planKey = plan.toUpperCase();
        if (config.planLimits[planKey]) {
            return {
                ...config,
                maxRequests: config.planLimits[planKey]
            };
        }
    }
    return config;
}
/**
 * Rate limiting middleware factory
 *
 * Uses Redis sliding window for accurate rate limiting
 *
 * @param action - The action identifier (e.g., 'message:send')
 * @returns Express middleware function
 */
function rateLimit(action) {
    return async (req, res, next) => {
        try {
            const redis = redis_1.RedisService.getInstance();
            const user = req.user;
            if (!user) {
                // No user context, skip rate limiting (auth middleware should handle this)
                next();
                return;
            }
            const userId = user.id;
            const userPlan = user.plan || 'FREE';
            const config = getRateLimit(action, userPlan);
            // Redis key for this user's rate limit
            const key = `ratelimit:${action}:${userId}`;
            // Get current count
            const currentCount = await redis.incr(key);
            // Set expiry on first request
            if (currentCount === 1) {
                await redis.expire(key, config.windowSeconds);
            }
            // Get remaining TTL
            const ttl = await redis.ttl(key);
            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, config.maxRequests - currentCount).toString(),
                'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + ttl).toString()
            });
            if (currentCount > config.maxRequests) {
                // Audit log - rate limit exceeded
                const { auditService } = await Promise.resolve().then(() => __importStar(require('../services/audit.service')));
                auditService.logRateLimitExceeded(userId, user.email, req.originalUrl, req.auditContext?.ipAddress || 'unknown').catch(err => console.error('[AUDIT]', err));
                res.status(429).json({
                    error: 'Limite de requisições excedido',
                    message: `Você atingiu o limite de ${config.maxRequests} requisições. Tente novamente em ${ttl} segundos.`,
                    retryAfter: ttl
                });
                return;
            }
            next();
        }
        catch (error) {
            // If Redis fails, allow the request (fail open)
            console.error('[RateLimit] Error checking rate limit:', error);
            next();
        }
    };
}
/**
 * Middleware to add rate limit info to response (for debugging/monitoring)
 */
async function getRateLimitInfo(userId, action, plan) {
    try {
        const redis = redis_1.RedisService.getInstance();
        const config = getRateLimit(action, plan);
        const key = `ratelimit:${action}:${userId}`;
        const count = await redis.get(key);
        const ttl = await redis.ttl(key);
        return {
            remaining: Math.max(0, config.maxRequests - (parseInt(count || '0', 10))),
            total: config.maxRequests,
            resetIn: ttl > 0 ? ttl : config.windowSeconds
        };
    }
    catch {
        return {
            remaining: 1000,
            total: 1000,
            resetIn: 60
        };
    }
}
