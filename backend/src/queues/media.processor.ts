import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { aiService } from '../ai/ai.service'; // Fix import path if needed
import { io } from '../websocket/websocket.server';
import prisma from '../lib/prisma';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';
import { MEDIA_JOB_NAME } from './media.queue';

dotenv.config();

let mediaWorker: Worker | null = null;

if (isRedisEnabled()) {
    const redisConnection = new IORedis(getRedisConfig());

    redisConnection.on('error', (err) => {
        console.error('Redis connection error (media worker):', err.message);
    });

    mediaWorker = new Worker('media', async (job: Job) => {
        if (job.name !== MEDIA_JOB_NAME) return;

        const { chapterId, forceRegenerate } = job.data;
        console.log(`🖼️ Processando imagens em lote para capítulo ${chapterId}`);

        try {
            // 1. Buscar todas as falas do capítulo
            const speeches = await prisma.speech.findMany({
                where: { chapterId },
                orderBy: { orderIndex: 'asc' },
                include: { character: true, chapter: { include: { book: true } } }
            });

            if (speeches.length === 0) {
                console.log(`⚠️ Nenhuma fala encontrada para o capítulo ${chapterId}`);
                return;
            }

            // Filtrar falas que precisam de imagem (se force=false, pular as que já têm)
            const speechesToProcess = forceRegenerate 
                ? speeches 
                : speeches.filter(s => !s.sceneImageUrl); // Use field from schema

            // Notificar início
            io.to(`chapter:${chapterId}`).emit('media:batch-started', {
                chapterId,
                totalSpeeches: speeches.length,
                processingCount: speechesToProcess.length
            });

            console.log(`📝 ${speechesToProcess.length} falas para gerar imagens`);

            // 2. Processar cada fala
            for (let i = 0; i < speechesToProcess.length; i++) {
                const speech = speechesToProcess[i];
                const progress = Math.round(((i + 1) / speechesToProcess.length) * 100);

                // Notificar progresso
                io.to(`chapter:${chapterId}`).emit('media:batch-progress', {
                    chapterId,
                    current: i + 1,
                    total: speechesToProcess.length,
                    speechId: speech.id,
                    progress
                });

                try {
                    console.log(`🎨 Gerando imagem para fala ${i + 1}/${speechesToProcess.length}`);

                    // Gerar imagem
                    const imageResult = await aiService.generateEmotionImage({
                        text: speech.text,
                        characterId: speech.characterId,
                        styleHint: 'cinematic, detailed'
                    });

                    // Atualizar fala no banco
                    await prisma.speech.update({
                        where: { id: speech.id },
                        data: { sceneImageUrl: imageResult.imageUrl }
                    });

                    // Notificar conclusão da fala
                    io.to(`chapter:${chapterId}`).emit('media:speech-image-completed', {
                        chapterId,
                        speechId: speech.id,
                        imageUrl: imageResult.imageUrl
                    });

                } catch (err: any) {
                    console.error(`❌ Erro ao gerar imagem para fala ${speech.id}:`, err.message);
                    io.to(`chapter:${chapterId}`).emit('media:speech-image-failed', {
                        chapterId,
                        speechId: speech.id,
                        error: err.message
                    });
                    // Continua para próxima fala
                }
            }

            // Notificar conclusão
            io.to(`chapter:${chapterId}`).emit('media:batch-completed', {
                chapterId
            });

            console.log(`🎉 Geração de imagens concluída para capítulo ${chapterId}`);

        } catch (error: any) {
            console.error(`❌ Job de imagens falhou para capítulo ${chapterId}:`, error);
            io.to(`chapter:${chapterId}`).emit('media:batch-failed', {
                chapterId,
                error: error.message
            });
            throw error;
        }

    }, { connection: redisConnection });

    mediaWorker.on('ready', () => {
        console.log('✅ Media worker conectado ao Redis');
    });

    mediaWorker.on('failed', (job, err) => {
        console.error(`❌ Media job ${job?.id} falhou:`, err);
    });
} else {
    console.log('ℹ️  Redis desabilitado - media worker inativo');
}

export { mediaWorker };
