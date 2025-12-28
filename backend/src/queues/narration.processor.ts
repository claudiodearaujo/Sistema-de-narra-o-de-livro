import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ttsService } from '../tts/tts.service';
import { io } from '../websocket/websocket.server';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Diretório para salvar os arquivos de áudio
const AUDIO_DIR = path.join(__dirname, '../../uploads/audio');

// Garantir que o diretório existe
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Salva o buffer de áudio em um arquivo WAV
 */
function saveAudioFile(buffer: Buffer, speechId: string): string {
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
function createWavBuffer(pcmData: Buffer, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): Buffer {
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
    buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
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
    console.log(`🎙️ Processando narração para capítulo ${chapterId}`);

    try {
        // 1. Buscar todas as falas do capítulo
        const speeches = await prisma.speech.findMany({
            where: { chapterId },
            orderBy: { orderIndex: 'asc' },
            include: { character: true }
        });

        if (speeches.length === 0) {
            console.log(`⚠️ Nenhuma fala encontrada para o capítulo ${chapterId}`);
            return;
        }

        // Notificar início
        io.to(`chapter:${chapterId}`).emit('narration:started', {
            chapterId,
            totalSpeeches: speeches.length
        });

        console.log(`📝 ${speeches.length} falas para processar`);

        // 2. Processar cada fala
        for (let i = 0; i < speeches.length; i++) {
            const speech = speeches[i];

            // Notificar progresso
            io.to(`chapter:${chapterId}`).emit('narration:progress', {
                chapterId,
                current: i + 1,
                total: speeches.length,
                speechId: speech.id
            });

            try {
                // Determinar a voz (usa Schedar como padrão)
                const voiceId = speech.character?.voiceId || 'Schedar';
                
                console.log(`🎤 Gerando áudio para fala ${i + 1}/${speeches.length} com voz ${voiceId}`);

                // Gerar áudio com Gemini TTS
                const textToSpeak = speech.ssmlText || speech.text;

                const audioResult = await ttsService.generateAudio({
                    text: textToSpeak,
                    voice: { voiceId }
                });

                // Salvar arquivo de áudio
                const audioUrl = saveAudioFile(audioResult.buffer, speech.id);

                // Atualizar fala no banco
                await prisma.speech.update({
                    where: { id: speech.id },
                    data: { audioUrl }
                });

                console.log(`✅ Áudio gerado: ${audioUrl}`);

                // Notificar conclusão da fala
                io.to(`chapter:${chapterId}`).emit('narration:speech-completed', {
                    chapterId,
                    speechId: speech.id,
                    audioUrl
                });

            } catch (err: any) {
                console.error(`❌ Erro ao processar fala ${speech.id}:`, err.message);
                io.to(`chapter:${chapterId}`).emit('narration:speech-failed', {
                    chapterId,
                    speechId: speech.id,
                    error: err.message
                });
                // Continua para próxima fala
            }
        }

        // Notificar conclusão
        io.to(`chapter:${chapterId}`).emit('narration:completed', {
            chapterId
        });

        console.log(`🎉 Narração concluída para capítulo ${chapterId}`);

    } catch (error: any) {
        console.error(`❌ Job falhou para capítulo ${chapterId}:`, error);
        io.to(`chapter:${chapterId}`).emit('narration:failed', {
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
} else {
    console.log('ℹ️  Redis desabilitado - narration worker inativo');
}

export { narrationWorker };
