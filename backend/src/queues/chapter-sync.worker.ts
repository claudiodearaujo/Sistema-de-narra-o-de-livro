import { Worker, Job, Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { chapterSyncService } from '../services/chapter-sync.service';
import { io } from '../websocket/websocket.server';
import prisma from '../lib/prisma';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';
import { TTSProviderType } from '../ai/ai.config';

dotenv.config();

/**
 * Worker BullMQ para Sincronização de Capítulos em Background
 *
 * Processa jobs de sincronização de capítulos que:
 * - Geram áudio para todas as falas
 * - Concatenam em um único arquivo
 * - Calculam timestamps para timeline
 *
 * Ideal para capítulos com muitas falas que demorariam muito
 * para processar em uma requisição HTTP síncrona.
 */

export const CHAPTER_SYNC_QUEUE_NAME = 'chapter-sync';

export interface ChapterSyncJobData {
    chapterId: string;
    userId: string;
    provider?: TTSProviderType;
    priority?: 'low' | 'normal' | 'high';
}

export interface ChapterSyncJobResult {
    success: boolean;
    narrationId: string;
    outputUrl: string | null;
    totalDurationMs: number;
    completedSpeeches: number;
    failedSpeeches: number;
    errors: string[];
}

let chapterSyncQueue: Queue | null = null;
let chapterSyncWorker: Worker | null = null;

if (isRedisEnabled()) {
    const redisConnection = new IORedis(getRedisConfig());

    redisConnection.on('error', (err) => {
        console.error('[SYNC-WORKER] Redis connection error:', err.message);
    });

    // Criar fila
    chapterSyncQueue = new Queue(CHAPTER_SYNC_QUEUE_NAME, {
        connection: redisConnection,
        defaultJobOptions: {
            removeOnComplete: 100, // Manter últimos 100 jobs completos
            removeOnFail: 50,      // Manter últimos 50 jobs falhos
            attempts: 2,           // Tentar 2 vezes em caso de falha
            backoff: {
                type: 'exponential',
                delay: 5000,       // Esperar 5s antes de retry
            },
        },
    });

    // Criar worker
    chapterSyncWorker = new Worker(
        CHAPTER_SYNC_QUEUE_NAME,
        async (job: Job<ChapterSyncJobData>) => {
            const { chapterId, userId, provider } = job.data;
            console.log(`🎙️ [SYNC-WORKER] Iniciando sincronização do capítulo ${chapterId}`);

            try {
                // Verificar se o capítulo ainda existe
                const chapter = await prisma.chapter.findUnique({
                    where: { id: chapterId },
                    select: { id: true, title: true },
                });

                if (!chapter) {
                    throw new Error(`Capítulo ${chapterId} não encontrado`);
                }

                // Notificar início via WebSocket
                io?.to(`chapter:${chapterId}`).emit('sync:started', {
                    chapterId,
                    jobId: job.id,
                });

                // Executar sincronização
                const result = await chapterSyncService.syncChapter(userId, chapterId, provider);

                // Notificar conclusão
                io?.to(`chapter:${chapterId}`).emit('sync:completed', {
                    chapterId,
                    jobId: job.id,
                    success: result.success,
                    outputUrl: result.outputUrl,
                    totalDurationMs: result.totalDurationMs,
                });

                console.log(
                    `✅ [SYNC-WORKER] Sincronização concluída: ${chapterId} - ` +
                    `${result.completedSpeeches}/${result.completedSpeeches + result.failedSpeeches} falas`
                );

                return {
                    success: result.success,
                    narrationId: result.narrationId,
                    outputUrl: result.outputUrl,
                    totalDurationMs: result.totalDurationMs,
                    completedSpeeches: result.completedSpeeches,
                    failedSpeeches: result.failedSpeeches,
                    errors: result.errors,
                } as ChapterSyncJobResult;

            } catch (error: any) {
                console.error(`❌ [SYNC-WORKER] Erro na sincronização ${chapterId}:`, error.message);

                // Notificar falha via WebSocket
                io?.to(`chapter:${chapterId}`).emit('sync:failed', {
                    chapterId,
                    jobId: job.id,
                    error: error.message,
                });

                // Atualizar narração como falha
                await prisma.narration.updateMany({
                    where: { chapterId },
                    data: {
                        status: 'failed',
                        errorMessage: error.message,
                    },
                });

                throw error;
            }
        },
        {
            connection: redisConnection,
            concurrency: 2, // Processar 2 capítulos em paralelo
            limiter: {
                max: 5,          // Máximo 5 jobs
                duration: 60000, // Por minuto
            },
        }
    );

    chapterSyncWorker.on('ready', () => {
        console.log('✅ [SYNC-WORKER] Chapter sync worker conectado ao Redis');
    });

    chapterSyncWorker.on('completed', (job, result) => {
        console.log(
            `✅ [SYNC-WORKER] Job ${job.id} completo: ` +
            `${result?.completedSpeeches || 0} falas processadas`
        );
    });

    chapterSyncWorker.on('failed', (job, err) => {
        console.error(`❌ [SYNC-WORKER] Job ${job?.id} falhou:`, err.message);
    });

    chapterSyncWorker.on('progress', (job, progress) => {
        console.log(`📊 [SYNC-WORKER] Job ${job.id} progresso: ${progress}%`);
    });

} else {
    console.log('ℹ️  [SYNC-WORKER] Redis desabilitado - chapter sync worker inativo');
}

/**
 * Adiciona um job de sincronização à fila
 */
export async function addChapterSyncJob(
    data: ChapterSyncJobData
): Promise<{ jobId: string | undefined; queued: boolean }> {
    if (!chapterSyncQueue) {
        // Redis desabilitado - executar síncronamente
        console.log('[SYNC-WORKER] Executando sincronização síncrona (Redis desabilitado)');
        try {
            await chapterSyncService.syncChapter(data.userId, data.chapterId, data.provider);
            return { jobId: undefined, queued: false };
        } catch (error) {
            throw error;
        }
    }

    // Definir prioridade
    let priority = 2; // normal
    if (data.priority === 'high') priority = 1;
    if (data.priority === 'low') priority = 3;

    const job = await chapterSyncQueue.add(
        'sync-chapter',
        data,
        {
            priority,
            jobId: `sync-${data.chapterId}-${Date.now()}`,
        }
    );

    console.log(`📥 [SYNC-WORKER] Job adicionado: ${job.id}`);
    return { jobId: job.id, queued: true };
}

/**
 * Obtém o status de um job de sincronização
 */
export async function getChapterSyncJobStatus(jobId: string): Promise<{
    state: string;
    progress: number;
    result?: ChapterSyncJobResult;
    error?: string;
} | null> {
    if (!chapterSyncQueue) {
        return null;
    }

    const job = await chapterSyncQueue.getJob(jobId);
    if (!job) {
        return null;
    }

    const state = await job.getState();
    const progress = job.progress as number || 0;

    return {
        state,
        progress,
        result: job.returnvalue as ChapterSyncJobResult | undefined,
        error: job.failedReason,
    };
}

/**
 * Cancela um job de sincronização pendente
 */
export async function cancelChapterSyncJob(jobId: string): Promise<boolean> {
    if (!chapterSyncQueue) {
        return false;
    }

    const job = await chapterSyncQueue.getJob(jobId);
    if (!job) {
        return false;
    }

    const state = await job.getState();
    if (state === 'waiting' || state === 'delayed') {
        await job.remove();
        return true;
    }

    return false;
}

export { chapterSyncQueue, chapterSyncWorker };
