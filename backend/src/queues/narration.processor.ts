import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ttsService } from '../tts/tts.service';
import { io } from '../websocket/websocket.server';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

let narrationWorker: Worker | null = null;

if (REDIS_ENABLED) {
    const redisConnection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null
    });

    redisConnection.on('error', (err) => {
        console.error('Redis connection error (worker):', err.message);
    });

    narrationWorker = new Worker('narration', async (job: Job) => {
    const { chapterId } = job.data;
    console.log(`Processing narration for chapter ${chapterId}`);

    try {
        // 1. Get all speeches for the chapter
        const speeches = await prisma.speech.findMany({
            where: { chapterId },
            orderBy: { orderIndex: 'asc' },
            include: { character: true }
        });

        if (speeches.length === 0) {
            console.log(`No speeches found for chapter ${chapterId}`);
            return;
        }

        // Notify start
        io.to(`chapter:${chapterId}`).emit('narration:started', {
            chapterId,
            totalSpeeches: speeches.length
        });

        // 2. Process each speech
        for (let i = 0; i < speeches.length; i++) {
            const speech = speeches[i];

            // Notify progress
            io.to(`chapter:${chapterId}`).emit('narration:progress', {
                chapterId,
                current: i + 1,
                total: speeches.length,
                speechId: speech.id
            });

            try {
                // Determine voice
                const voiceId = speech.character?.voiceId;
                if (!voiceId) {
                    console.warn(`No voice assigned for character ${speech.characterId} in speech ${speech.id}`);
                    continue;
                }

                // Generate audio
                // Note: We are using the text directly. If ssmlText exists and is preferred, use it.
                const textToSpeak = speech.ssmlText || speech.text;
                const useSSML = !!speech.ssmlText;

                const audioResult = await ttsService.generateAudio({
                    text: textToSpeak,
                    voice: { voiceId },
                    useSSML
                });

                // Save audio file to uploads directory
                const uploadsDir = path.join(process.cwd(), 'uploads', 'speeches');
                await fs.mkdir(uploadsDir, { recursive: true });
                
                const fileName = `speech_${speech.id}_${Date.now()}.mp3`;
                const filePath = path.join(uploadsDir, fileName);
                await fs.writeFile(filePath, audioResult.buffer);
                
                // Generate URL for frontend access
                const audioUrl = `/uploads/speeches/${fileName}`;

                // Update speech
                await prisma.speech.update({
                    where: { id: speech.id },
                    data: { audioUrl }
                });

                // Notify speech completion
                io.to(`chapter:${chapterId}`).emit('narration:speech-completed', {
                    chapterId,
                    speechId: speech.id,
                    audioUrl
                });

            } catch (err) {
                console.error(`Error processing speech ${speech.id}:`, err);
                io.to(`chapter:${chapterId}`).emit('narration:failed', {
                    chapterId,
                    error: `Failed to process speech ${speech.id}`,
                    failedSpeechId: speech.id
                });
                // Continue to next speech or throw to fail job? 
                // Let's continue for partial success
            }
        }

        // Notify completion
        io.to(`chapter:${chapterId}`).emit('narration:completed', {
            chapterId
        });

        console.log(`Narration completed for chapter ${chapterId}`);

    } catch (error: any) {
        console.error(`Job failed for chapter ${chapterId}:`, error);
        io.to(`chapter:${chapterId}`).emit('narration:failed', {
            chapterId,
            error: error.message
        });
        throw error;
    }

}, { connection: redisConnection });

    narrationWorker.on('ready', () => {
        console.log('✅ Narration worker connected to Redis');
    });

    narrationWorker.on('failed', (job, err) => {
        console.error(`Narration job ${job?.id} failed:`, err);
    });
} else {
    console.log('ℹ️  Redis desabilitado - narration worker inativo');
}

export { narrationWorker };
