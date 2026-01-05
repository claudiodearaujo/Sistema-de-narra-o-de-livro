"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrationWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const ai_1 = require("../ai");
const websocket_server_1 = require("../websocket/websocket.server");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const redis_config_1 = require("../config/redis.config");
dotenv_1.default.config();
// Diretório para salvar os arquivos de áudio
const AUDIO_DIR = path.join(__dirname, '../../uploads/audio');
// Garantir que o diretório existe
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}
/**
 * Salva o buffer de áudio em um arquivo WAV
 */
function saveAudioFile(buffer, speechId) {
    const filename = `speech_${speechId}_${Date.now()}.wav`;
    const filepath = path.join(AUDIO_DIR, filename);
    // O Gemini TTS retorna PCM raw, precisamos adicionar header WAV
    const wavBuffer = createWavBuffer(buffer);
    fs.writeFileSync(filepath, wavBuffer);
    return `/uploads/audio/${filename}`;
}
/**
 * Cria um buffer WAV a partir de dados PCM
 */
function createWavBuffer(pcmData, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
    const dataSize = pcmData.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;
    const buffer = Buffer.alloc(fileSize);
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28); // ByteRate
    buffer.writeUInt16LE(channels * bitsPerSample / 8, 32); // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    pcmData.copy(buffer, 44);
    return buffer;
}
let narrationWorker = null;
exports.narrationWorker = narrationWorker;
if ((0, redis_config_1.isRedisEnabled)()) {
    const redisConnection = new ioredis_1.default((0, redis_config_1.getRedisConfig)());
    redisConnection.on('error', (err) => {
        console.error('Redis connection error (worker):', err.message);
    });
    exports.narrationWorker = narrationWorker = new bullmq_1.Worker('narration', async (job) => {
        const { chapterId } = job.data;
        console.log(`🎙️ Processando narração para capítulo ${chapterId}`);
        try {
            // 1. Buscar todas as falas do capítulo
            const speeches = await prisma_1.default.speech.findMany({
                where: { chapterId },
                orderBy: { orderIndex: 'asc' },
                include: { character: true }
            });
            if (speeches.length === 0) {
                console.log(`⚠️ Nenhuma fala encontrada para o capítulo ${chapterId}`);
                return;
            }
            // Notificar início
            websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:started', {
                chapterId,
                totalSpeeches: speeches.length
            });
            console.log(`📝 ${speeches.length} falas para processar`);
            // 2. Processar cada fala
            for (let i = 0; i < speeches.length; i++) {
                const speech = speeches[i];
                // Notificar progresso
                websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:progress', {
                    chapterId,
                    current: i + 1,
                    total: speeches.length,
                    speechId: speech.id
                });
                try {
                    // Determinar a voz (usa Schedar como padrão)
                    const voiceId = speech.character?.voiceId || 'Schedar';
                    console.log(`🎤 Gerando áudio para fala ${i + 1}/${speeches.length} com voz ${voiceId}`);
                    // Gerar áudio com o AI Service
                    const textToSpeak = speech.ssmlText || speech.text;
                    const audioResult = await ai_1.aiService.generateAudio({
                        text: textToSpeak,
                        voiceName: voiceId
                    });
                    // Salvar arquivo de áudio
                    const audioUrl = saveAudioFile(audioResult.buffer, speech.id);
                    // Atualizar fala no banco
                    await prisma_1.default.speech.update({
                        where: { id: speech.id },
                        data: { audioUrl }
                    });
                    console.log(`✅ Áudio gerado: ${audioUrl}`);
                    // Notificar conclusão da fala
                    websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:speech-completed', {
                        chapterId,
                        speechId: speech.id,
                        audioUrl
                    });
                }
                catch (err) {
                    console.error(`❌ Erro ao processar fala ${speech.id}:`, err.message);
                    websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:speech-failed', {
                        chapterId,
                        speechId: speech.id,
                        error: err.message
                    });
                    // Continua para próxima fala
                }
            }
            // Notificar conclusão
            websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:completed', {
                chapterId
            });
            console.log(`🎉 Narração concluída para capítulo ${chapterId}`);
        }
        catch (error) {
            console.error(`❌ Job falhou para capítulo ${chapterId}:`, error);
            websocket_server_1.io.to(`chapter:${chapterId}`).emit('narration:failed', {
                chapterId,
                error: error.message
            });
            throw error;
        }
    }, { connection: redisConnection });
    narrationWorker.on('ready', () => {
        console.log('✅ Narration worker conectado ao Redis');
    });
    narrationWorker.on('failed', (job, err) => {
        console.error(`❌ Narration job ${job?.id} falhou:`, err);
    });
}
else {
    console.log('ℹ️  Redis desabilitado - narration worker inativo');
}
