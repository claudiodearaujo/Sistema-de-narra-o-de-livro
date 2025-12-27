"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrationWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const tts_service_1 = require("../tts/tts.service");
const websocket_server_1 = require("../websocket/websocket.server");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';
let narrationWorker = null;
exports.narrationWorker = narrationWorker;
if (REDIS_ENABLED) {
    const redisConnection = new ioredis_1.default({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null
    });
    redisConnection.on('error', (err) => {
        console.error('Redis connection error (worker):', err.message);
    });
    exports.narrationWorker = narrationWorker = new bullmq_1.Worker('narration', async (job) => {
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
            websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:started', {
                chapterId,
                totalSpeeches: speeches.length
            });
            // 2. Process each speech
            for (let i = 0; i < speeches.length; i++) {
                const speech = speeches[i];
                // Notify progress
                websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:progress', {
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
                    const audioResult = await tts_service_1.ttsService.generateAudio({
                        text: textToSpeak,
                        voice: { voiceId },
                        useSSML
                    });
                    // Save audio file to uploads directory
                    const uploadsDir = path_1.default.join(process.cwd(), 'uploads', 'speeches');
                    await promises_1.default.mkdir(uploadsDir, { recursive: true });
                    const fileName = `speech_${speech.id}_${Date.now()}.mp3`;
                    const filePath = path_1.default.join(uploadsDir, fileName);
                    await promises_1.default.writeFile(filePath, audioResult.buffer);
                    // Generate URL for frontend access
                    const audioUrl = `/uploads/speeches/${fileName}`;
                    // Update speech
                    await prisma.speech.update({
                        where: { id: speech.id },
                        data: { audioUrl }
                    });
                    // Notify speech completion
                    websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:speech-completed', {
                        chapterId,
                        speechId: speech.id,
                        audioUrl
                    });
                }
                catch (err) {
                    console.error(`Error processing speech ${speech.id}:`, err);
                    websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:failed', {
                        chapterId,
                        error: `Failed to process speech ${speech.id}`,
                        failedSpeechId: speech.id
                    });
                    // Continue to next speech or throw to fail job? 
                    // Let's continue for partial success
                }
            }
            // Notify completion
            websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:completed', {
                chapterId
            });
            console.log(`Narration completed for chapter ${chapterId}`);
        }
        catch (error) {
            console.error(`Job failed for chapter ${chapterId}:`, error);
            websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:failed', {
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
}
else {
    console.log('ℹ️  Redis desabilitado - narration worker inativo');
}
