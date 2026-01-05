"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioWorker = exports.audioQueue = exports.AUDIO_JOB_NAME = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const audio_processor_service_1 = require("../services/audio-processor.service");
const google_drive_service_1 = require("../services/google-drive.service");
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const redis_config_1 = require("../config/redis.config");
dotenv_1.default.config();
let audioQueue = null;
exports.audioQueue = audioQueue;
let audioWorker = null;
exports.audioWorker = audioWorker;
exports.AUDIO_JOB_NAME = 'process-audio';
if ((0, redis_config_1.isRedisEnabled)()) {
    try {
        const redisConnection = new ioredis_1.default((0, redis_config_1.getRedisConfig)());
        redisConnection.on('error', (err) => {
            console.warn('⚠️  Redis connection error (audio queue):', err.message);
        });
        exports.audioQueue = audioQueue = new bullmq_1.Queue('audio', { connection: redisConnection });
        console.log('✅ Audio queue initialized with Redis');
        exports.audioWorker = audioWorker = new bullmq_1.Worker('audio', async (job) => {
            console.log(`📦 Processing audio job ${job.id}:`, job.data);
            try {
                const { chapterId, speechIds, outputPath } = job.data;
                if (!speechIds || speechIds.length === 0) {
                    throw new Error('No speeches provided for audio processing');
                }
                // Get speeches from database
                const speeches = await prisma_1.default.speech.findMany({
                    where: { id: { in: speechIds } },
                    orderBy: { orderIndex: 'asc' }
                });
                if (speeches.length === 0) {
                    throw new Error('No speeches found in database');
                }
                // Get audio files for each speech
                const audioFiles = speeches
                    .filter(speech => speech.audioUrl)
                    .map(speech => speech.audioUrl);
                if (audioFiles.length === 0) {
                    throw new Error('No audio files available for concatenation');
                }
                // Update job progress
                await job.updateProgress(25);
                // Concatenate audio files
                const concatenatedPath = outputPath || path_1.default.join('/tmp', `chapter_${chapterId}_concatenated.mp3`);
                await audio_processor_service_1.audioProcessorService.concatenateAudios(audioFiles, concatenatedPath);
                await job.updateProgress(50);
                // Normalize audio
                const normalizedPath = path_1.default.join(path_1.default.dirname(concatenatedPath), `chapter_${chapterId}_normalized.mp3`);
                await audio_processor_service_1.audioProcessorService.normalizeAudio(concatenatedPath, normalizedPath);
                await job.updateProgress(75);
                // Upload to Google Drive (if configured)
                let finalUrl = normalizedPath;
                if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                    try {
                        const uploadedFile = await google_drive_service_1.googleDriveService.uploadFile(normalizedPath, `chapter_${chapterId}_audio.mp3`, 'audio/mpeg');
                        finalUrl = uploadedFile.webContentLink || uploadedFile.webViewLink;
                        console.log('✅ Audio uploaded to Google Drive:', finalUrl);
                    }
                    catch (driveError) {
                        console.warn('⚠️  Could not upload to Google Drive:', driveError);
                    }
                }
                await job.updateProgress(100);
                return { chapterId, finalUrl, status: 'completed' };
            }
            catch (error) {
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
    }
    catch (error) {
        console.warn('⚠️  Failed to initialize audio queue:', error);
    }
}
else {
    console.log('ℹ️  Redis desabilitado - Audio queue não inicializada');
}
