import prisma from '../lib/prisma';
import { AIFactory } from '../ai/ai.factory';
import { aiConfig, TTSProviderType } from '../ai/ai.config';
import { audioProcessorService } from './audio-processor.service';
import { aiTokenService } from './ai-token.service';
import { AIProviderName } from '@prisma/client';
import { io } from '../websocket/websocket.server';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ffprobe = require('fluent-ffmpeg').ffprobe;

/**
 * Serviço de Sincronização de Capítulos
 *
 * Responsável por:
 * - Gerar áudio para todas as falas de um capítulo
 * - Concatenar áudios em ordem
 * - Calcular timestamps de cada fala
 * - Gerar timeline completa para sincronização
 * - Atualizar status de narração em tempo real via WebSocket
 */

// ========== Types ==========

export interface SpeechTimeline {
    speechId: string;
    orderIndex: number;
    characterId: string;
    characterName: string;
    text: string;
    startTimeMs: number;
    endTimeMs: number;
    durationMs: number;
    audioUrl: string | null;
}

export interface ChapterTimeline {
    chapterId: string;
    chapterTitle: string;
    bookId: string;
    totalDurationMs: number;
    totalSpeeches: number;
    provider: string;
    generatedAt: string;
    speeches: SpeechTimeline[];
}

export interface SyncProgress {
    chapterId: string;
    status: 'pending' | 'generating' | 'concatenating' | 'completed' | 'failed';
    currentSpeech: number;
    totalSpeeches: number;
    completedSpeeches: number;
    failedSpeeches: number;
    percentage: number;
    currentSpeechId?: string;
    errorMessage?: string;
}

export interface SyncResult {
    success: boolean;
    narrationId: string;
    outputUrl: string | null;
    timeline: ChapterTimeline | null;
    totalDurationMs: number;
    completedSpeeches: number;
    failedSpeeches: number;
    errors: string[];
}

// ========== Service ==========

class ChapterSyncService {
    private uploadsDir: string;

    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads/audio');
        // Ensure uploads directory exists
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    /**
     * Sincroniza um capítulo: gera áudios, concatena e cria timeline
     */
    async syncChapter(
        userId: string,
        chapterId: string,
        provider?: TTSProviderType
    ): Promise<SyncResult> {
        const ttsProvider = provider || (aiConfig.defaultTTSProvider as TTSProviderType);
        const providerName = ttsProvider.toUpperCase() as AIProviderName;

        // Buscar capítulo com falas
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                book: true,
                speeches: {
                    orderBy: { orderIndex: 'asc' },
                    include: { character: true },
                },
                narration: true,
            },
        });

        if (!chapter) {
            throw new Error('Capítulo não encontrado');
        }

        if (chapter.speeches.length === 0) {
            throw new Error('Nenhuma fala encontrada neste capítulo');
        }

        // Criar ou atualizar narração
        let narration = chapter.narration;
        if (!narration) {
            narration = await prisma.narration.create({
                data: {
                    chapterId,
                    status: 'pending',
                    totalSpeeches: chapter.speeches.length,
                    completedSpeeches: 0,
                    failedSpeeches: 0,
                    provider: ttsProvider,
                },
            });
        } else {
            narration = await prisma.narration.update({
                where: { id: narration.id },
                data: {
                    status: 'processing',
                    totalSpeeches: chapter.speeches.length,
                    completedSpeeches: 0,
                    failedSpeeches: 0,
                    provider: ttsProvider,
                    errorMessage: null,
                    startedAt: new Date(),
                },
            });
        }

        // Emitir progresso inicial
        this.emitProgress({
            chapterId,
            status: 'generating',
            currentSpeech: 0,
            totalSpeeches: chapter.speeches.length,
            completedSpeeches: 0,
            failedSpeeches: 0,
            percentage: 0,
        });

        // Inicializar provider TTS
        const tts = AIFactory.createTTSProvider(ttsProvider);
        await tts.initialize();

        const errors: string[] = [];
        const speechTimelines: SpeechTimeline[] = [];
        const audioFiles: string[] = [];
        let completedSpeeches = 0;
        let failedSpeeches = 0;

        // Gerar áudio para cada fala
        for (let i = 0; i < chapter.speeches.length; i++) {
            const speech = chapter.speeches[i];

            this.emitProgress({
                chapterId,
                status: 'generating',
                currentSpeech: i + 1,
                totalSpeeches: chapter.speeches.length,
                completedSpeeches,
                failedSpeeches,
                percentage: Math.round((i / chapter.speeches.length) * 80), // 80% for generation
                currentSpeechId: speech.id,
            });

            try {
                const voiceId = speech.character?.voiceId || aiConfig.tts.defaultVoice;
                const textToSpeak = speech.ssmlText || speech.text;

                // Gerar áudio
                const startTime = Date.now();
                const audioResult = await tts.generateAudio({
                    text: textToSpeak,
                    voice: { voiceId },
                    outputFormat: 'mp3',
                });
                const durationMs = Date.now() - startTime;

                // Salvar arquivo de áudio
                const audioFilename = `speech_${speech.id}_${Date.now()}.mp3`;
                const audioPath = path.join(this.uploadsDir, audioFilename);
                fs.writeFileSync(audioPath, audioResult.buffer);

                // Obter duração do áudio
                const audioDurationMs = await this.getAudioDuration(audioPath);

                // Atualizar speech no banco
                await prisma.speech.update({
                    where: { id: speech.id },
                    data: {
                        audioUrl: `/uploads/audio/${audioFilename}`,
                        audioDurationMs,
                    },
                });

                // Rastrear uso de AI
                await aiTokenService.trackUsage({
                    userId,
                    operation: 'TTS_GENERATE',
                    provider: providerName,
                    resourceType: 'Speech',
                    resourceId: speech.id,
                    inputChars: textToSpeak.length,
                    outputBytes: audioResult.buffer.length,
                    durationMs,
                    success: true,
                    metadata: { voiceId, chapterId },
                });

                audioFiles.push(audioPath);
                speechTimelines.push({
                    speechId: speech.id,
                    orderIndex: speech.orderIndex,
                    characterId: speech.characterId,
                    characterName: speech.character?.name || 'Narrador',
                    text: speech.text,
                    startTimeMs: 0, // Will be calculated after concatenation
                    endTimeMs: 0,
                    durationMs: audioDurationMs,
                    audioUrl: `/uploads/audio/${audioFilename}`,
                });

                completedSpeeches++;

                // Emitir progresso de fala completa
                io?.to(`chapter:${chapterId}`).emit('narration:speech-completed', {
                    chapterId,
                    speechId: speech.id,
                    audioUrl: `/uploads/audio/${audioFilename}`,
                    durationMs: audioDurationMs,
                });

            } catch (error: any) {
                const errorMsg = `Fala ${speech.id} (${speech.character?.name || 'Narrador'}): ${error.message}`;
                errors.push(errorMsg);
                failedSpeeches++;
                console.error(`[SYNC] Erro na fala: ${errorMsg}`);

                // Rastrear falha
                await aiTokenService.trackUsage({
                    userId,
                    operation: 'TTS_GENERATE',
                    provider: providerName,
                    resourceType: 'Speech',
                    resourceId: speech.id,
                    inputChars: speech.text.length,
                    success: false,
                    errorMessage: error.message,
                });

                io?.to(`chapter:${chapterId}`).emit('narration:speech-failed', {
                    chapterId,
                    speechId: speech.id,
                    error: error.message,
                });
            }

            // Atualizar narração com progresso
            await prisma.narration.update({
                where: { id: narration.id },
                data: { completedSpeeches, failedSpeeches },
            });
        }

        // Se nenhum áudio foi gerado, falhar
        if (audioFiles.length === 0) {
            await prisma.narration.update({
                where: { id: narration.id },
                data: {
                    status: 'failed',
                    errorMessage: 'Nenhum áudio foi gerado com sucesso',
                },
            });

            this.emitProgress({
                chapterId,
                status: 'failed',
                currentSpeech: chapter.speeches.length,
                totalSpeeches: chapter.speeches.length,
                completedSpeeches,
                failedSpeeches,
                percentage: 100,
                errorMessage: 'Nenhum áudio foi gerado',
            });

            return {
                success: false,
                narrationId: narration.id,
                outputUrl: null,
                timeline: null,
                totalDurationMs: 0,
                completedSpeeches,
                failedSpeeches,
                errors,
            };
        }

        // Emitir progresso de concatenação
        this.emitProgress({
            chapterId,
            status: 'concatenating',
            currentSpeech: chapter.speeches.length,
            totalSpeeches: chapter.speeches.length,
            completedSpeeches,
            failedSpeeches,
            percentage: 85,
        });

        // Concatenar áudios
        const outputFilename = `chapter_${chapterId}_${Date.now()}.mp3`;
        const outputPath = path.join(this.uploadsDir, outputFilename);

        try {
            await audioProcessorService.concatenateAudios(audioFiles, outputPath);

            // Normalizar áudio final
            const normalizedFilename = `chapter_${chapterId}_normalized_${Date.now()}.mp3`;
            const normalizedPath = path.join(this.uploadsDir, normalizedFilename);
            await audioProcessorService.normalizeAudio(outputPath, normalizedPath);

            // Usar áudio normalizado
            if (fs.existsSync(normalizedPath)) {
                fs.unlinkSync(outputPath); // Remove não-normalizado
                fs.renameSync(normalizedPath, outputPath);
            }

        } catch (error: any) {
            console.error('[SYNC] Erro na concatenação:', error.message);
            errors.push(`Concatenação: ${error.message}`);

            await prisma.narration.update({
                where: { id: narration.id },
                data: {
                    status: 'failed',
                    errorMessage: `Erro na concatenação: ${error.message}`,
                },
            });

            this.emitProgress({
                chapterId,
                status: 'failed',
                currentSpeech: chapter.speeches.length,
                totalSpeeches: chapter.speeches.length,
                completedSpeeches,
                failedSpeeches,
                percentage: 90,
                errorMessage: error.message,
            });

            return {
                success: false,
                narrationId: narration.id,
                outputUrl: null,
                timeline: null,
                totalDurationMs: 0,
                completedSpeeches,
                failedSpeeches,
                errors,
            };
        }

        // Calcular timestamps acumulados
        let currentTimeMs = 0;
        for (const timeline of speechTimelines) {
            timeline.startTimeMs = currentTimeMs;
            timeline.endTimeMs = currentTimeMs + timeline.durationMs;
            currentTimeMs = timeline.endTimeMs;

            // Atualizar speech no banco com timestamps
            await prisma.speech.update({
                where: { id: timeline.speechId },
                data: {
                    startTimeMs: timeline.startTimeMs,
                    endTimeMs: timeline.endTimeMs,
                },
            });
        }

        const totalDurationMs = currentTimeMs;
        const outputUrl = `/uploads/audio/${outputFilename}`;

        // Criar timeline completa
        const chapterTimeline: ChapterTimeline = {
            chapterId,
            chapterTitle: chapter.title,
            bookId: chapter.bookId,
            totalDurationMs,
            totalSpeeches: speechTimelines.length,
            provider: ttsProvider,
            generatedAt: new Date().toISOString(),
            speeches: speechTimelines,
        };

        // Atualizar narração como completa
        await prisma.narration.update({
            where: { id: narration.id },
            data: {
                status: 'completed',
                outputUrl,
                totalDurationMs,
                completedSpeeches,
                failedSpeeches,
                timelineJson: chapterTimeline as any,
                completedAt: new Date(),
            },
        });

        // Rastrear uso total da narração
        await aiTokenService.trackUsage({
            userId,
            operation: 'NARRATION_CHAPTER',
            provider: providerName,
            resourceType: 'Chapter',
            resourceId: chapterId,
            inputChars: chapter.speeches.reduce((sum, s) => sum + s.text.length, 0),
            outputBytes: fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0,
            success: true,
            metadata: {
                totalSpeeches: chapter.speeches.length,
                completedSpeeches,
                failedSpeeches,
                totalDurationMs,
            },
        });

        // Emitir progresso final
        this.emitProgress({
            chapterId,
            status: 'completed',
            currentSpeech: chapter.speeches.length,
            totalSpeeches: chapter.speeches.length,
            completedSpeeches,
            failedSpeeches,
            percentage: 100,
        });

        io?.to(`chapter:${chapterId}`).emit('narration:completed', {
            chapterId,
            narrationId: narration.id,
            outputUrl,
            totalDurationMs,
            completedSpeeches,
            failedSpeeches,
            timeline: chapterTimeline,
        });

        return {
            success: true,
            narrationId: narration.id,
            outputUrl,
            timeline: chapterTimeline,
            totalDurationMs,
            completedSpeeches,
            failedSpeeches,
            errors,
        };
    }

    /**
     * Obtém a timeline de um capítulo já sincronizado
     */
    async getChapterTimeline(chapterId: string): Promise<ChapterTimeline | null> {
        const narration = await prisma.narration.findUnique({
            where: { chapterId },
        });

        if (!narration || !narration.timelineJson) {
            return null;
        }

        return narration.timelineJson as unknown as ChapterTimeline;
    }

    /**
     * Obtém o status de sincronização de um capítulo
     */
    async getSyncStatus(chapterId: string): Promise<{
        status: string;
        progress: number;
        outputUrl: string | null;
        totalDurationMs: number | null;
        completedSpeeches: number | null;
        failedSpeeches: number | null;
    } | null> {
        const narration = await prisma.narration.findUnique({
            where: { chapterId },
        });

        if (!narration) {
            return null;
        }

        let progress = 0;
        if (narration.status === 'completed') {
            progress = 100;
        } else if (narration.status === 'processing' && narration.totalSpeeches) {
            progress = Math.round(
                ((narration.completedSpeeches || 0) / narration.totalSpeeches) * 100
            );
        }

        return {
            status: narration.status,
            progress,
            outputUrl: narration.outputUrl,
            totalDurationMs: narration.totalDurationMs,
            completedSpeeches: narration.completedSpeeches,
            failedSpeeches: narration.failedSpeeches,
        };
    }

    /**
     * Regenera uma fala específica e atualiza a timeline
     */
    async regenerateSpeech(
        userId: string,
        speechId: string,
        provider?: TTSProviderType
    ): Promise<{ audioUrl: string; durationMs: number }> {
        const speech = await prisma.speech.findUnique({
            where: { id: speechId },
            include: { character: true, chapter: true },
        });

        if (!speech) {
            throw new Error('Fala não encontrada');
        }

        const ttsProvider = provider || (aiConfig.defaultTTSProvider as TTSProviderType);
        const tts = AIFactory.createTTSProvider(ttsProvider);
        await tts.initialize();

        const voiceId = speech.character?.voiceId || aiConfig.tts.defaultVoice;
        const textToSpeak = speech.ssmlText || speech.text;

        const startTime = Date.now();
        const audioResult = await tts.generateAudio({
            text: textToSpeak,
            voice: { voiceId },
            outputFormat: 'mp3',
        });
        const processingTime = Date.now() - startTime;

        const audioFilename = `speech_${speechId}_${Date.now()}.mp3`;
        const audioPath = path.join(this.uploadsDir, audioFilename);
        fs.writeFileSync(audioPath, audioResult.buffer);

        const audioDurationMs = await this.getAudioDuration(audioPath);
        const audioUrl = `/uploads/audio/${audioFilename}`;

        await prisma.speech.update({
            where: { id: speechId },
            data: {
                audioUrl,
                audioDurationMs,
                // Reset timestamps - will need re-concatenation
                startTimeMs: null,
                endTimeMs: null,
            },
        });

        // Marcar narração para re-sincronização
        if (speech.chapter.id) {
            await prisma.narration.updateMany({
                where: { chapterId: speech.chapter.id },
                data: { status: 'pending' },
            });
        }

        await aiTokenService.trackUsage({
            userId,
            operation: 'TTS_GENERATE',
            provider: ttsProvider.toUpperCase() as AIProviderName,
            resourceType: 'Speech',
            resourceId: speechId,
            inputChars: textToSpeak.length,
            outputBytes: audioResult.buffer.length,
            durationMs: processingTime,
            success: true,
            metadata: { voiceId, regeneration: true },
        });

        return { audioUrl, durationMs: audioDurationMs };
    }

    // ========== Private Helpers ==========

    /**
     * Obtém a duração de um arquivo de áudio em milissegundos
     */
    private getAudioDuration(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffprobe(filePath, (err: any, metadata: any) => {
                if (err) {
                    console.error('[SYNC] Erro ao obter duração:', err.message);
                    // Fallback: estimar baseado no tamanho do arquivo (MP3 128kbps)
                    const stats = fs.statSync(filePath);
                    const estimatedDuration = Math.round((stats.size / 16000) * 1000); // ~16KB/s for 128kbps
                    return resolve(estimatedDuration);
                }

                const duration = metadata.format?.duration || 0;
                resolve(Math.round(duration * 1000));
            });
        });
    }

    /**
     * Emite progresso de sincronização via WebSocket
     */
    private emitProgress(progress: SyncProgress): void {
        io?.to(`chapter:${progress.chapterId}`).emit('narration:progress', progress);
    }
}

export const chapterSyncService = new ChapterSyncService();
