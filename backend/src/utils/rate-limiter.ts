/**
 * Rate Limiter para chamadas de IA
 * Implementa Token Bucket com retry exponencial
 */

export interface RateLimitConfig {
    /** Número máximo de requisições por janela de tempo */
    maxRequests: number;
    /** Janela de tempo em milissegundos */
    windowMs: number;
    /** Delay base para retry em milissegundos */
    retryDelayMs: number;
    /** Número máximo de tentativas */
    maxRetries: number;
    /** Multiplicador para backoff exponencial */
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
            windowMs: config.windowMs ?? 60000, // 1 minuto
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

    /**
     * Inicia o timer de refill de tokens
     */
    private startRefillTimer(): void {
        const refillRate = this.config.windowMs / this.config.maxRequests;
        
        this.refillInterval = setInterval(() => {
            this.refillTokens();
            this.processQueue();
        }, refillRate);
    }

    /**
     * Reabastece tokens baseado no tempo decorrido
     */
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

    /**
     * Processa requisições na fila
     */
    private processQueue(): void {
        while (this.state.queue.length > 0 && this.state.tokens > 0) {
            const request = this.state.queue.shift();
            if (request) {
                this.state.tokens--;
                request.resolve();
            }
        }

        // Remove requisições muito antigas (timeout)
        const now = Date.now();
        const timeout = this.config.windowMs * 2;
        this.state.queue = this.state.queue.filter(req => {
            if (now - req.timestamp > timeout) {
                req.reject(new Error(`Rate limit timeout após ${timeout}ms`));
                return false;
            }
            return true;
        });
    }

    /**
     * Aguarda até que um token esteja disponível
     */
    async acquire(): Promise<void> {
        this.refillTokens();

        if (this.state.tokens > 0) {
            this.state.tokens--;
            return;
        }

        // Aguarda na fila
        return new Promise((resolve, reject) => {
            this.state.queue.push({
                resolve,
                reject,
                timestamp: Date.now()
            });
        });
    }

    /**
     * Executa uma função com rate limiting e retry automático
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;
        let delay = this.config.retryDelayMs;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                await this.acquire();
                return await fn();
            } catch (error: any) {
                lastError = error;
                
                // Verifica se é erro de rate limit (429 ou mensagens específicas)
                const isRateLimitError = this.isRateLimitError(error);
                
                if (!isRateLimitError || attempt >= this.config.maxRetries) {
                    console.error(
                        `❌ [${this.name}] Erro após ${attempt + 1} tentativa(s): ${error.message}`
                    );
                    throw error;
                }

                // Adiciona jitter (variação aleatória) para evitar thundering herd
                const jitter = Math.random() * 1000;
                const waitTime = delay + jitter;

                console.warn(
                    `⚠️ [${this.name}] Rate limit detectado (429). ` +
                    `Tentativa ${attempt + 1}/${this.config.maxRetries + 1}. ` +
                    `Aguardando ${Math.round(waitTime / 1000)}s antes de retry...`
                );

                // Reduz tokens disponíveis para evitar mais chamadas durante recovery
                this.state.tokens = Math.max(0, this.state.tokens - 5);

                await this.sleep(waitTime);
                delay *= this.config.backoffMultiplier;
            }
        }

        throw lastError || new Error('Falha após múltiplas tentativas');
    }

    /**
     * Verifica se o erro é relacionado a rate limiting
     */
    private isRateLimitError(error: any): boolean {
        if (!error) return false;

        // HTTP 429 Too Many Requests
        if (error.status === 429 || error.code === 429) return true;
        if (error.response?.status === 429) return true;

        // Mensagens comuns de rate limit
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

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retorna estatísticas do rate limiter
     */
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

    /**
     * Para o rate limiter e limpa recursos
     */
    destroy(): void {
        if (this.refillInterval) {
            clearInterval(this.refillInterval);
            this.refillInterval = null;
        }
        
        // Rejeita todas as requisições na fila
        this.state.queue.forEach(req => {
            req.reject(new Error('Rate limiter destruído'));
        });
        this.state.queue = [];
    }
}

/**
 * Gerenciador global de rate limiters por provider
 */
class RateLimiterManager {
    private limiters: Map<string, RateLimiter> = new Map();

    /**
     * Obtém ou cria um rate limiter para um provider
     */
    get(name: string, config?: Partial<RateLimitConfig>): RateLimiter {
        if (!this.limiters.has(name)) {
            this.limiters.set(name, new RateLimiter(name, config));
            console.log(`🚦 Rate limiter criado para: ${name}`);
        }
        return this.limiters.get(name)!;
    }

    /**
     * Retorna estatísticas de todos os rate limiters
     */
    getAllStats(): Record<string, ReturnType<RateLimiter['getStats']>> {
        const stats: Record<string, ReturnType<RateLimiter['getStats']>> = {};
        this.limiters.forEach((limiter, name) => {
            stats[name] = limiter.getStats();
        });
        return stats;
    }

    /**
     * Destrói todos os rate limiters
     */
    destroyAll(): void {
        this.limiters.forEach(limiter => limiter.destroy());
        this.limiters.clear();
    }
}

// Instância global do gerenciador
export const rateLimiterManager = new RateLimiterManager();

/**
 * Decorator para métodos que precisam de rate limiting
 * Uso: @withRateLimit('gemini-tts')
 */
export function withRateLimit(providerName: string, config?: Partial<RateLimitConfig>) {
    return function (
        _target: any,
        _propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const limiter = rateLimiterManager.get(providerName, config);
            return limiter.execute(() => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}
