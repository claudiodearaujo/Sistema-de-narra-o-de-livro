/**
 * Rate Limiter for AI API calls
 * Implements Token Bucket with exponential retry
 */

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    retryDelayMs: number;
    maxRetries: number;
    backoffMultiplier: number;
}

export interface RateLimitState {
    tokens: number;
    lastRefill: number;
    queue: Array<{
        resolve: (value: void) => void;
        reject: (error: Error) => void;
        timestamp: number;
    }>;
}

export class RateLimiter {
    private config: RateLimitConfig;
    private state: RateLimitState;
    private refillInterval: ReturnType<typeof setInterval> | null = null;
    private readonly name: string;

    constructor(name: string, config: Partial<RateLimitConfig> = {}) {
        this.name = name;
        this.config = {
            maxRequests: config.maxRequests ?? 60,
            windowMs: config.windowMs ?? 60000,
            retryDelayMs: config.retryDelayMs ?? 1000,
            maxRetries: config.maxRetries ?? 3,
            backoffMultiplier: config.backoffMultiplier ?? 2
        };

        this.state = {
            tokens: this.config.maxRequests,
            lastRefill: Date.now(),
            queue: []
        };

        this.startRefillTimer();
    }

    private startRefillTimer(): void {
        const refillRate = this.config.windowMs / this.config.maxRequests;

        this.refillInterval = setInterval(() => {
            this.refillTokens();
            this.processQueue();
        }, refillRate);
    }

    private refillTokens(): void {
        const now = Date.now();
        const elapsed = now - this.state.lastRefill;
        const tokensToAdd = Math.floor(
            (elapsed / this.config.windowMs) * this.config.maxRequests
        );

        if (tokensToAdd > 0) {
            this.state.tokens = Math.min(
                this.config.maxRequests,
                this.state.tokens + tokensToAdd
            );
            this.state.lastRefill = now;
        }
    }

    private processQueue(): void {
        while (this.state.queue.length > 0 && this.state.tokens > 0) {
            const request = this.state.queue.shift();
            if (request) {
                this.state.tokens--;
                request.resolve();
            }
        }

        const now = Date.now();
        const timeout = this.config.windowMs * 2;
        this.state.queue = this.state.queue.filter(req => {
            if (now - req.timestamp > timeout) {
                req.reject(new Error(`Rate limit timeout after ${timeout}ms`));
                return false;
            }
            return true;
        });
    }

    async acquire(): Promise<void> {
        this.refillTokens();

        if (this.state.tokens > 0) {
            this.state.tokens--;
            return;
        }

        return new Promise((resolve, reject) => {
            this.state.queue.push({
                resolve,
                reject,
                timestamp: Date.now()
            });
        });
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;
        let delay = this.config.retryDelayMs;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                await this.acquire();
                return await fn();
            } catch (error: any) {
                lastError = error;
                const isRateLimitError = this.isRateLimitError(error);

                if (!isRateLimitError || attempt >= this.config.maxRetries) {
                    console.error(
                        `[${this.name}] Error after ${attempt + 1} attempts: ${error.message}`
                    );
                    throw error;
                }

                const jitter = Math.random() * 1000;
                const waitTime = delay + jitter;

                console.warn(
                    `[${this.name}] Rate limit detected. ` +
                    `Attempt ${attempt + 1}/${this.config.maxRetries + 1}. ` +
                    `Waiting ${Math.round(waitTime / 1000)}s...`
                );

                this.state.tokens = Math.max(0, this.state.tokens - 5);
                await this.sleep(waitTime);
                delay *= this.config.backoffMultiplier;
            }
        }

        throw lastError || new Error('Failed after multiple attempts');
    }

    private isRateLimitError(error: any): boolean {
        if (!error) return false;

        if (error.status === 429 || error.code === 429) return true;
        if (error.response?.status === 429) return true;

        const message = (error.message || error.toString()).toLowerCase();
        const rateLimitKeywords = [
            'rate limit',
            'rate_limit',
            'too many requests',
            'quota exceeded',
            'resource exhausted',
            'throttl'
        ];

        return rateLimitKeywords.some(keyword => message.includes(keyword));
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStats(): {
        availableTokens: number;
        queueLength: number;
        config: RateLimitConfig
    } {
        return {
            availableTokens: this.state.tokens,
            queueLength: this.state.queue.length,
            config: { ...this.config }
        };
    }

    destroy(): void {
        if (this.refillInterval) {
            clearInterval(this.refillInterval);
            this.refillInterval = null;
        }

        this.state.queue.forEach(req => {
            req.reject(new Error('Rate limiter destroyed'));
        });
        this.state.queue = [];
    }
}

class RateLimiterManager {
    private limiters: Map<string, RateLimiter> = new Map();

    get(name: string, config?: Partial<RateLimitConfig>): RateLimiter {
        if (!this.limiters.has(name)) {
            this.limiters.set(name, new RateLimiter(name, config));
            console.log(`Rate limiter created for: ${name}`);
        }
        return this.limiters.get(name)!;
    }

    getAllStats(): Record<string, ReturnType<RateLimiter['getStats']>> {
        const stats: Record<string, ReturnType<RateLimiter['getStats']>> = {};
        this.limiters.forEach((limiter, name) => {
            stats[name] = limiter.getStats();
        });
        return stats;
    }

    destroyAll(): void {
        this.limiters.forEach(limiter => limiter.destroy());
        this.limiters.clear();
    }
}

export const rateLimiterManager = new RateLimiterManager();
