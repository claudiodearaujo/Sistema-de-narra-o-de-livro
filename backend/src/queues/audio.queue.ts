import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { audioProcessorService } from '../services/audio-processor.service';
import { googleDriveService } from '../services/google-drive.service';
import path from 'path';
import prisma from '../lib/prisma';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';

dotenv.config();

let audioQueue: Queue | null = null;
let audioWorker: Worker | null = null;

export const AUDIO_JOB_NAME = 'process-audio';

if (isRedisEnabled()) {
    try {
        const redisConnection = new IORedis(getRedisConfig());

        redisConnection.on('error', (err) => {
            console.warn('⚠️  Redis connection error (audio queue):', err.message);
        });

        audioQueue = new Queue('audio', { connection: redisConnection });
        console.log('✅ Audio queue initialized with Redis');

        audioWorker = new Worker('audio', async (job: Job) => {
            console.log(`📦 Processing audio job ${job.id}:`, job.data);

            try {
                const { chapterId, speechIds, outputPath } = job.data;

                if (!speechIds || speechIds.length === 0) {
                    throw new Error('No speeches provided for audio processing');
                }

                // Get speeches from database
                const speeches = await prisma.speech.findMany({
                    where: { id: { in: speechIds } },
                    orderBy: { orderIndex: 'asc' }
                });

                if (speeches.length === 0) {
                    throw new Error('No speeches found in database');
                }

                // Get audio files for each speech
                const audioFiles = speeches
                    .filter(speech => speech.audioUrl)
                    .map(speech => speech.audioUrl as string);

                if (audioFiles.length === 0) {
                    throw new Error('No audio files available for concatenation');
                }

                // Update job progress
                await job.updateProgress(25);

                // Concatenate audio files
                const concatenatedPath = outputPath || path.join('/tmp', `chapter_${chapterId}_concatenated.mp3`);
                await audioProcessorService.concatenateAudios(audioFiles, concatenatedPath);
                await job.updateProgress(50);

                // Normalize audio
                const normalizedPath = path.join(path.dirname(concatenatedPath), `chapter_${chapterId}_normalized.mp3`);
                await audioProcessorService.normalizeAudio(concatenatedPath, normalizedPath);
                await job.updateProgress(75);

                // Upload to Google Drive (if configured)
                let finalUrl = normalizedPath;
                if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                    try {
                        const uploadedFile = await googleDriveService.uploadFile(
                            normalizedPath,
                            `chapter_${chapterId}_audio.mp3`,
                            'audio/mpeg'
                        );
                        finalUrl = uploadedFile.webContentLink || uploadedFile.webViewLink;
                        console.log('✅ Audio uploaded to Google Drive:', finalUrl);
                    } catch (driveError) {
                        console.warn('⚠️  Could not upload to Google Drive:', driveError);
                    }
                }

                await job.updateProgress(100);

                return { chapterId, finalUrl, status: 'completed' };
            } catch (error: any) {
                console.error(`❌ Error processing audio job ${job.id}:`, error.message);
                throw error;
            }
        }, { connection: redisConnection });

        audioWorker.on('ready', () => {
            console.log('✅ Audio worker connected to Redis');
        });

        audioWorker.on('failed', (job, err) => {
            console.error(`❌ Audio job ${job?.id} failed:`, err);
        });

        audioWorker.on('completed', (job, result) => {
            console.log(`✅ Audio job ${job.id} completed:`, result);
        });

    } catch (error) {
        console.warn('⚠️  Failed to initialize audio queue:', error);
    }
} else {
    console.log('ℹ️  Redis desabilitado - Audio queue não inicializada');
}

export { audioQueue, audioWorker };
