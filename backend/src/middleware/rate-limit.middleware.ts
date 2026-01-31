import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../lib/redis';

/**
 * Rate limiting configuration by action type
 */
interface RateLimitConfig {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional: Different limits per plan */
  planLimits?: {
    FREE: number;
    PREMIUM: number;
    PRO: number;
  };
}

/**
 * Predefined rate limits for different actions
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
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
function getRateLimit(action: string, plan?: string): RateLimitConfig {
  const config = RATE_LIMITS[action] || RATE_LIMITS['api:general'];
  
  if (config.planLimits && plan) {
    const planKey = plan.toUpperCase() as keyof typeof config.planLimits;
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
export function rateLimit(action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = RedisService.getInstance();
      const user = (req as any).user;
      
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
        const { auditService } = await import('../services/audit.service');
        auditService.logRateLimitExceeded(
          userId,
          user.email,
          req.originalUrl,
          req.auditContext?.ipAddress || 'unknown'
        ).catch(err => console.error('[AUDIT]', err));
        
        res.status(429).json({
          error: 'Limite de requisições excedido',
          message: `Você atingiu o limite de ${config.maxRequests} requisições. Tente novamente em ${ttl} segundos.`,
          retryAfter: ttl
        });
        return;
      }
      
      next();
    } catch (error) {
      // If Redis fails, allow the request (fail open)
      console.error('[RateLimit] Error checking rate limit:', error);
      next();
    }
  };
}

/**
 * Middleware to add rate limit info to response (for debugging/monitoring)
 */
export async function getRateLimitInfo(
  userId: string, 
  action: string,
  plan?: string
): Promise<{ remaining: number; total: number; resetIn: number }> {
  try {
    const redis = RedisService.getInstance();
    const config = getRateLimit(action, plan);
    const key = `ratelimit:${action}:${userId}`;
    
    const count = await redis.get(key);
    const ttl = await redis.ttl(key);
    
    return {
      remaining: Math.max(0, config.maxRequests - (parseInt(count || '0', 10))),
      total: config.maxRequests,
      resetIn: ttl > 0 ? ttl : config.windowSeconds
    };
  } catch {
    return {
      remaining: 1000,
      total: 1000,
      resetIn: 60
    };
  }
}
