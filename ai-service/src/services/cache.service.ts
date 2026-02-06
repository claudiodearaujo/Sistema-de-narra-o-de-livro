import { createHash } from 'crypto';
import { prisma } from './prisma';

export interface CacheEntry {
    id: string;
    audioUrl: string;
    audioDurationMs: number;
    audioSizeBytes: number;
    format: string;
    hitCount: number;
}

class AudioCacheService {
    /**
     * Generate cache key from text, voiceId, and provider
     */
    generateCacheKey(text: string, voiceId: string, provider: string): string {
        const normalizedText = text.trim().toLowerCase();
        const content = `${normalizedText}|${voiceId}|${provider}`;
        return createHash('sha256').update(content).digest('hex');
    }

    /**
     * Get cached audio if exists
     */
    async get(text: string, voiceId: string, provider: string): Promise<CacheEntry | null> {
        const textHash = this.generateCacheKey(text, voiceId, provider);

        const cached = await prisma.audioCache.findUnique({
            where: { textHash },
        });

        if (!cached) {
            return null;
        }

        // Check expiration
        if (cached.expiresAt && cached.expiresAt < new Date()) {
            await prisma.audioCache.delete({ where: { id: cached.id } });
            return null;
        }

        // Update hit count and last accessed
        await prisma.audioCache.update({
            where: { id: cached.id },
            data: {
                hitCount: { increment: 1 },
                lastAccessedAt: new Date(),
            },
        });

        return {
            id: cached.id,
            audioUrl: cached.audioUrl,
            audioDurationMs: cached.audioDurationMs,
            audioSizeBytes: cached.audioSizeBytes,
            format: cached.format,
            hitCount: cached.hitCount + 1,
        };
    }

    /**
     * Save audio to cache
     */
    async set(
        text: string,
        voiceId: string,
        provider: string,
        audioUrl: string,
        audioDurationMs: number,
        audioSizeBytes: number,
        format: string = 'mp3',
        expiresInDays?: number
    ): Promise<CacheEntry> {
        const textHash = this.generateCacheKey(text, voiceId, provider);

        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : undefined;

        const cached = await prisma.audioCache.upsert({
            where: { textHash },
            update: {
                audioUrl,
                audioDurationMs,
                audioSizeBytes,
                format,
                lastAccessedAt: new Date(),
                expiresAt,
            },
            create: {
                textHash,
                text: text.substring(0, 500), // Store first 500 chars for debugging
                voiceId,
                provider,
                audioUrl,
                audioDurationMs,
                audioSizeBytes,
                format,
                expiresAt,
            },
        });

        return {
            id: cached.id,
            audioUrl: cached.audioUrl,
            audioDurationMs: cached.audioDurationMs,
            audioSizeBytes: cached.audioSizeBytes,
            format: cached.format,
            hitCount: cached.hitCount,
        };
    }

    /**
     * Delete cache entry
     */
    async delete(text: string, voiceId: string, provider: string): Promise<boolean> {
        const textHash = this.generateCacheKey(text, voiceId, provider);

        try {
            await prisma.audioCache.delete({ where: { textHash } });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{
        totalEntries: number;
        totalSizeBytes: number;
        totalHits: number;
        oldestEntry: Date | null;
        newestEntry: Date | null;
        byProvider: Record<string, number>;
    }> {
        const [stats, byProvider] = await Promise.all([
            prisma.audioCache.aggregate({
                _count: true,
                _sum: {
                    audioSizeBytes: true,
                    hitCount: true,
                },
                _min: { createdAt: true },
                _max: { createdAt: true },
            }),
            prisma.audioCache.groupBy({
                by: ['provider'],
                _count: true,
            }),
        ]);

        const providerCounts: Record<string, number> = {};
        for (const p of byProvider) {
            providerCounts[p.provider] = p._count;
        }

        return {
            totalEntries: stats._count,
            totalSizeBytes: stats._sum.audioSizeBytes || 0,
            totalHits: stats._sum.hitCount || 0,
            oldestEntry: stats._min.createdAt,
            newestEntry: stats._max.createdAt,
            byProvider: providerCounts,
        };
    }

    /**
     * Clean expired cache entries
     */
    async cleanExpired(): Promise<number> {
        const result = await prisma.audioCache.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }

    /**
     * Clean unused cache entries (not accessed in X days)
     */
    async cleanUnused(daysUnused: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysUnused);

        const result = await prisma.audioCache.deleteMany({
            where: {
                lastAccessedAt: { lt: cutoffDate },
            },
        });
        return result.count;
    }

    /**
     * Clear all cache entries
     */
    async clearAll(): Promise<number> {
        const result = await prisma.audioCache.deleteMany({});
        return result.count;
    }
}

export const audioCacheService = new AudioCacheService();
