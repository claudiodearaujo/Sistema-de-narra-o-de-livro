import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Serviço de Cache de Áudio
 *
 * Evita regenerar áudios idênticos usando hash do texto + voiceId + provider.
 * Quando o mesmo texto é solicitado com a mesma voz, retorna o áudio em cache.
 *
 * Benefícios:
 * - Economia de custos (não paga API por áudios repetidos)
 * - Resposta mais rápida (não precisa esperar geração)
 * - Consistência (mesmo texto = mesmo áudio)
 */

export interface CacheEntry {
    audioUrl: string;
    audioDurationMs: number;
    audioSizeBytes: number;
    format: string;
    fromCache: boolean;
    cacheHits: number;
}

export interface CacheStats {
    totalEntries: number;
    totalSizeBytes: number;
    totalHits: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    byProvider: Record<string, number>;
}

class AudioCacheService {
    private uploadsDir: string;
    private cacheDir: string;

    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads');
        this.cacheDir = path.join(this.uploadsDir, 'audio-cache');

        // Garantir que o diretório de cache existe
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Gera hash único para texto + voiceId + provider
     */
    generateCacheKey(text: string, voiceId: string, provider: string): string {
        const normalizedText = text.trim().toLowerCase();
        const content = `${normalizedText}|${voiceId}|${provider}`;
        return createHash('sha256').update(content).digest('hex');
    }

    /**
     * Verifica se existe cache para o texto/voz/provider
     */
    async get(text: string, voiceId: string, provider: string): Promise<CacheEntry | null> {
        const textHash = this.generateCacheKey(text, voiceId, provider);

        const cached = await prisma.audioCache.findUnique({
            where: { textHash },
        });

        if (!cached) {
            return null;
        }

        // Verificar se o arquivo ainda existe
        const filePath = path.join(this.uploadsDir, cached.audioUrl.replace('/uploads/', ''));
        if (!fs.existsSync(filePath)) {
            // Arquivo não existe mais, remover do cache
            await prisma.audioCache.delete({ where: { id: cached.id } });
            return null;
        }

        // Verificar expiração
        if (cached.expiresAt && cached.expiresAt < new Date()) {
            await this.delete(textHash);
            return null;
        }

        // Atualizar contagem de hits e último acesso
        await prisma.audioCache.update({
            where: { id: cached.id },
            data: {
                hitCount: { increment: 1 },
                lastAccessedAt: new Date(),
            },
        });

        return {
            audioUrl: cached.audioUrl,
            audioDurationMs: cached.audioDurationMs,
            audioSizeBytes: cached.audioSizeBytes,
            format: cached.format,
            fromCache: true,
            cacheHits: cached.hitCount + 1,
        };
    }

    /**
     * Armazena áudio no cache
     */
    async set(
        text: string,
        voiceId: string,
        provider: string,
        audioBuffer: Buffer,
        durationMs: number,
        format: string = 'mp3',
        expiresInDays?: number
    ): Promise<CacheEntry> {
        const textHash = this.generateCacheKey(text, voiceId, provider);

        // Salvar arquivo no diretório de cache
        const filename = `cache_${textHash.substring(0, 16)}_${Date.now()}.${format}`;
        const filePath = path.join(this.cacheDir, filename);
        fs.writeFileSync(filePath, audioBuffer);

        const audioUrl = `/uploads/audio-cache/${filename}`;
        const audioSizeBytes = audioBuffer.length;

        // Calcular expiração
        let expiresAt: Date | undefined;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        // Upsert no banco (atualiza se já existir)
        const cached = await prisma.audioCache.upsert({
            where: { textHash },
            create: {
                textHash,
                text: text.substring(0, 500), // Limitar tamanho do texto salvo
                voiceId,
                provider,
                audioUrl,
                audioDurationMs: durationMs,
                audioSizeBytes,
                format,
                expiresAt,
            },
            update: {
                audioUrl,
                audioDurationMs: durationMs,
                audioSizeBytes,
                format,
                expiresAt,
                hitCount: 0, // Reset hits no update
                lastAccessedAt: new Date(),
            },
        });

        return {
            audioUrl: cached.audioUrl,
            audioDurationMs: cached.audioDurationMs,
            audioSizeBytes: cached.audioSizeBytes,
            format: cached.format,
            fromCache: false,
            cacheHits: 0,
        };
    }

    /**
     * Remove entrada do cache
     */
    async delete(textHash: string): Promise<boolean> {
        const cached = await prisma.audioCache.findUnique({
            where: { textHash },
        });

        if (!cached) {
            return false;
        }

        // Remover arquivo
        const filePath = path.join(this.uploadsDir, cached.audioUrl.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remover do banco
        await prisma.audioCache.delete({ where: { id: cached.id } });

        return true;
    }

    /**
     * Limpa entradas expiradas do cache
     */
    async cleanExpired(): Promise<number> {
        const now = new Date();

        // Buscar entradas expiradas
        const expired = await prisma.audioCache.findMany({
            where: {
                expiresAt: { lte: now },
            },
        });

        // Remover arquivos
        for (const entry of expired) {
            const filePath = path.join(this.uploadsDir, entry.audioUrl.replace('/uploads/', ''));
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error(`[CACHE] Erro ao remover arquivo: ${filePath}`);
                }
            }
        }

        // Remover do banco
        const result = await prisma.audioCache.deleteMany({
            where: {
                expiresAt: { lte: now },
            },
        });

        console.log(`[CACHE] ${result.count} entradas expiradas removidas`);
        return result.count;
    }

    /**
     * Limpa entradas antigas não acessadas (LRU)
     * Remove entradas não acessadas há mais de X dias
     */
    async cleanUnused(daysUnused: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysUnused);

        // Buscar entradas não usadas
        const unused = await prisma.audioCache.findMany({
            where: {
                lastAccessedAt: { lte: cutoffDate },
            },
        });

        // Remover arquivos
        for (const entry of unused) {
            const filePath = path.join(this.uploadsDir, entry.audioUrl.replace('/uploads/', ''));
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error(`[CACHE] Erro ao remover arquivo: ${filePath}`);
                }
            }
        }

        // Remover do banco
        const result = await prisma.audioCache.deleteMany({
            where: {
                lastAccessedAt: { lte: cutoffDate },
            },
        });

        console.log(`[CACHE] ${result.count} entradas não utilizadas removidas`);
        return result.count;
    }

    /**
     * Obtém estatísticas do cache
     */
    async getStats(): Promise<CacheStats> {
        const entries = await prisma.audioCache.findMany({
            select: {
                audioSizeBytes: true,
                hitCount: true,
                provider: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        const stats: CacheStats = {
            totalEntries: entries.length,
            totalSizeBytes: 0,
            totalHits: 0,
            oldestEntry: entries.length > 0 ? entries[0].createdAt : null,
            newestEntry: entries.length > 0 ? entries[entries.length - 1].createdAt : null,
            byProvider: {},
        };

        for (const entry of entries) {
            stats.totalSizeBytes += entry.audioSizeBytes;
            stats.totalHits += entry.hitCount;
            stats.byProvider[entry.provider] = (stats.byProvider[entry.provider] || 0) + 1;
        }

        return stats;
    }

    /**
     * Limpa todo o cache
     */
    async clearAll(): Promise<number> {
        // Buscar todas as entradas
        const entries = await prisma.audioCache.findMany();

        // Remover arquivos
        for (const entry of entries) {
            const filePath = path.join(this.uploadsDir, entry.audioUrl.replace('/uploads/', ''));
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    // Ignorar erros
                }
            }
        }

        // Limpar banco
        const result = await prisma.audioCache.deleteMany();

        console.log(`[CACHE] Cache limpo: ${result.count} entradas removidas`);
        return result.count;
    }
}

export const audioCacheService = new AudioCacheService();
