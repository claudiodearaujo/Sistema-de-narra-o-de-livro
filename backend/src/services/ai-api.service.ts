import { AIOperationType, AIProviderName } from '@prisma/client';
import { AIFactory } from '../ai/ai.factory';
import { aiConfig, TTSProviderType } from '../ai/ai.config';
import { TTSProvider, Voice, AudioResult } from '../ai/interfaces/tts-provider.interface';
import { aiService } from '../ai/ai.service';
import { aiTokenService, TrackUsageParams } from './ai-token.service';
import { audioCacheService } from './audio-cache.service';
import prisma from '../lib/prisma';
import { io } from '../websocket/websocket.server';

/**
 * Serviço da API de IA
 *
 * Orquestra todas as operações de IA com:
 * - Abstração de providers (troca transparente)
 * - Controle de tokens/custos via AITokenService
 * - Integração com o sistema de Livras
 * - Logs de auditoria
 *
 * Este serviço é a camada entre os controllers e os providers,
 * garantindo que toda operação seja rastreada e cobrada.
 */

// ========== DTOs ==========

export interface TTSGenerateRequest {
    text: string;
    voiceId: string;
    outputFormat?: 'mp3' | 'wav' | 'ogg' | 'aac';
    provider?: TTSProviderType;
    useCache?: boolean; // Default true - use cache if available
}

export interface TTSPreviewRequest {
    voiceId: string;
    sampleText?: string;
    provider?: TTSProviderType;
}

export interface ListVoicesRequest {
    provider?: TTSProviderType;
}

export interface NarrateChapterRequest {
    chapterId: string;
    provider?: TTSProviderType;
}

export interface TextGenerateRequest {
    text: string;
    characterId?: string;
    chapterId?: string;
    includeContext?: boolean;
}

export interface SpellCheckRequest {
    text: string;
    language?: string;
}

export interface ImageGenerateRequest {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    style?: string;
    characterId?: string;
}

export interface EmotionImageRequest {
    text: string;
    characterId?: string;
    styleHint?: string;
}

// ========== Response types ==========

export interface AIOperationResult<T> {
    data: T;
    usage: {
        operation: string;
        provider: string;
        livrasCost: number;
        durationMs: number;
    };
}

// ========== Service ==========

class AIApiService {
    /**
     * Resolve qual provider TTS usar baseado na preferência
     */
    private getTTSProvider(preferred?: TTSProviderType): { provider: TTSProvider; name: AIProviderName } {
        const providerType = preferred || aiConfig.defaultTTSProvider;
        const provider = AIFactory.createTTSProvider(providerType);
        const name = providerType.toUpperCase() as AIProviderName;
        return { provider, name };
    }

    // ========== TTS Operations ==========

    /**
     * Gera áudio a partir de texto (com cache automático)
     */
    async generateAudio(
        userId: string,
        request: TTSGenerateRequest
    ): Promise<AIOperationResult<{ buffer: Buffer; format: string; audioBase64: string; fromCache?: boolean }>> {
        const { provider, name } = this.getTTSProvider(request.provider);
        const providerName = request.provider || aiConfig.defaultTTSProvider;
        const startTime = Date.now();
        const useCache = request.useCache !== false; // Default true

        // Verificar cache primeiro (se habilitado)
        if (useCache) {
            const cached = await audioCacheService.get(request.text, request.voiceId, providerName);
            if (cached) {
                console.log(`[AI-API] Cache hit para áudio: ${cached.cacheHits} hits`);

                // Ler o arquivo do cache
                const fs = await import('fs');
                const path = await import('path');
                const filePath = path.join(__dirname, '../../uploads', cached.audioUrl.replace('/uploads/', ''));
                const buffer = fs.readFileSync(filePath);

                // Registrar uso com custo zero (cache hit)
                await aiTokenService.trackUsage({
                    userId,
                    operation: 'TTS_GENERATE',
                    provider: name,
                    inputChars: request.text.length,
                    outputBytes: buffer.length,
                    durationMs: Date.now() - startTime,
                    success: true,
                    metadata: {
                        voiceId: request.voiceId,
                        format: cached.format,
                        fromCache: true,
                        cacheHits: cached.cacheHits,
                    },
                });

                return {
                    data: {
                        buffer,
                        format: cached.format,
                        audioBase64: buffer.toString('base64'),
                        fromCache: true,
                    },
                    usage: {
                        operation: 'TTS_GENERATE',
                        provider: provider.name,
                        livrasCost: 0, // Cache hit = custo zero
                        durationMs: Date.now() - startTime,
                    },
                };
            }
        }

        // Verificar se pode executar (tem saldo)
        const canExec = await aiTokenService.canExecute(userId, 'TTS_GENERATE');
        if (!canExec.allowed) {
            throw new Error(canExec.reason);
        }

        try {
            // Inicializar provider se necessário
            await provider.initialize();

            const result = await provider.generateAudio({
                text: request.text,
                voice: { voiceId: request.voiceId },
                outputFormat: request.outputFormat,
            });

            const durationMs = Date.now() - startTime;

            // Salvar no cache
            if (useCache) {
                try {
                    await audioCacheService.set(
                        request.text,
                        request.voiceId,
                        providerName,
                        result.buffer,
                        0, // Duration será calculado se necessário
                        result.format,
                        90 // Expirar em 90 dias
                    );
                } catch (cacheError: any) {
                    console.error('[AI-API] Erro ao salvar no cache:', cacheError.message);
                }
            }

            // Registrar uso
            const { livrasCost } = await aiTokenService.trackUsage({
                userId,
                operation: 'TTS_GENERATE',
                provider: name,
                inputChars: request.text.length,
                outputBytes: result.buffer.length,
                durationMs,
                success: true,
                metadata: {
                    voiceId: request.voiceId,
                    format: result.format,
                    providerName: provider.name,
                    fromCache: false,
                },
            });

            return {
                data: {
                    buffer: result.buffer,
                    format: result.format,
                    audioBase64: result.buffer.toString('base64'),
                },
                usage: {
                    operation: 'TTS_GENERATE',
                    provider: provider.name,
                    livrasCost,
                    durationMs,
                },
            };
        } catch (error: any) {
            await aiTokenService.trackUsage({
                userId,
                operation: 'TTS_GENERATE',
                provider: name,
                inputChars: request.text.length,
                durationMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }

    /**
     * Lista vozes disponíveis no provider
     */
    async listVoices(
        userId: string,
        request: ListVoicesRequest
    ): Promise<AIOperationResult<Voice[]>> {
        const { provider, name } = this.getTTSProvider(request.provider);
        const startTime = Date.now();

        await provider.initialize();
        const voices = await provider.getAvailableVoices();
        const durationMs = Date.now() - startTime;

        // Listar vozes não tem custo
        await aiTokenService.trackUsage({
            userId,
            operation: 'TTS_VOICES_LIST',
            provider: name,
            durationMs,
            success: true,
            metadata: { voiceCount: voices.length },
        });

        return {
            data: voices,
            usage: {
                operation: 'TTS_VOICES_LIST',
                provider: provider.name,
                livrasCost: 0,
                durationMs,
            },
        };
    }

    /**
     * Preview de uma voz específica
     */
    async previewVoice(
        userId: string,
        request: TTSPreviewRequest
    ): Promise<AIOperationResult<{ audioBase64: string; format: string }>> {
        const { provider, name } = this.getTTSProvider(request.provider);
        const startTime = Date.now();

        const canExec = await aiTokenService.canExecute(userId, 'TTS_PREVIEW');
        if (!canExec.allowed) {
            throw new Error(canExec.reason);
        }

        await provider.initialize();
        const result = await provider.previewVoice(request.voiceId, request.sampleText);
        const durationMs = Date.now() - startTime;

        const { livrasCost } = await aiTokenService.trackUsage({
            userId,
            operation: 'TTS_PREVIEW',
            provider: name,
            inputChars: (request.sampleText || '').length || 50,
            outputBytes: result.buffer.length,
            durationMs,
            success: true,
            metadata: { voiceId: request.voiceId },
        });

        return {
            data: {
                audioBase64: result.buffer.toString('base64'),
                format: result.format,
            },
            usage: {
                operation: 'TTS_PREVIEW',
                provider: provider.name,
                livrasCost,
                durationMs,
            },
        };
    }

    /**
     * Narração completa de um capítulo
     * Gera áudio para todas as falas do capítulo
     */
    async narrateChapter(
        userId: string,
        request: NarrateChapterRequest
    ): Promise<AIOperationResult<{ speechCount: number; completedCount: number; errors: string[] }>> {
        const { provider, name } = this.getTTSProvider(request.provider);
        const startTime = Date.now();

        const canExec = await aiTokenService.canExecute(userId, 'NARRATION_CHAPTER');
        if (!canExec.allowed) {
            throw new Error(canExec.reason);
        }

        // Buscar falas do capítulo
        const speeches = await prisma.speech.findMany({
            where: { chapterId: request.chapterId },
            orderBy: { orderIndex: 'asc' },
            include: { character: true },
        });

        if (speeches.length === 0) {
            throw new Error('Nenhuma fala encontrada para este capítulo');
        }

        await provider.initialize();

        // Notificar início via WebSocket
        io?.to(`chapter:${request.chapterId}`).emit('narration:started', {
            chapterId: request.chapterId,
            totalSpeeches: speeches.length,
            provider: provider.name,
        });

        let completedCount = 0;
        const errors: string[] = [];
        let totalInputChars = 0;
        let totalOutputBytes = 0;

        for (let i = 0; i < speeches.length; i++) {
            const speech = speeches[i];

            // Notificar progresso
            io?.to(`chapter:${request.chapterId}`).emit('narration:progress', {
                chapterId: request.chapterId,
                current: i + 1,
                total: speeches.length,
                speechId: speech.id,
            });

            try {
                const voiceId = speech.character?.voiceId || aiConfig.tts.defaultVoice;
                const textToSpeak = speech.ssmlText || speech.text;

                const audioResult = await provider.generateAudio({
                    text: textToSpeak,
                    voice: { voiceId },
                });

                totalInputChars += textToSpeak.length;
                totalOutputBytes += audioResult.buffer.length;

                // Salvar áudio
                const audioUrl = await this.saveAudioBuffer(audioResult.buffer, speech.id);

                // Atualizar fala no banco
                await prisma.speech.update({
                    where: { id: speech.id },
                    data: { audioUrl },
                });

                completedCount++;

                io?.to(`chapter:${request.chapterId}`).emit('narration:speech-completed', {
                    chapterId: request.chapterId,
                    speechId: speech.id,
                    audioUrl,
                });
            } catch (err: any) {
                const errorMsg = `Fala ${speech.id}: ${err.message}`;
                errors.push(errorMsg);
                console.error(`Erro na narração: ${errorMsg}`);

                io?.to(`chapter:${request.chapterId}`).emit('narration:speech-failed', {
                    chapterId: request.chapterId,
                    speechId: speech.id,
                    error: err.message,
                });
            }
        }

        const durationMs = Date.now() - startTime;

        // Notificar conclusão
        io?.to(`chapter:${request.chapterId}`).emit('narration:completed', {
            chapterId: request.chapterId,
            completedCount,
            totalSpeeches: speeches.length,
            errors: errors.length,
        });

        // Registrar uso
        const { livrasCost } = await aiTokenService.trackUsage({
            userId,
            operation: 'NARRATION_CHAPTER',
            provider: name,
            resourceType: 'Chapter',
            resourceId: request.chapterId,
            inputChars: totalInputChars,
            outputBytes: totalOutputBytes,
            durationMs,
            success: errors.length === 0,
            errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
            metadata: {
                speechCount: speeches.length,
                completedCount,
                errorCount: errors.length,
                providerName: provider.name,
            },
        });

        return {
            data: {
                speechCount: speeches.length,
                completedCount,
                errors,
            },
            usage: {
                operation: 'NARRATION_CHAPTER',
                provider: provider.name,
                livrasCost,
                durationMs,
            },
        };
    }

    // ========== Text Operations (delegam ao AIService existente) ==========

    /**
     * Correção ortográfica
     */
    async spellCheck(
        userId: string,
        request: SpellCheckRequest
    ): Promise<AIOperationResult<any>> {
        const startTime = Date.now();
        const providerName: AIProviderName = aiConfig.defaultTextProvider.toUpperCase() as AIProviderName;

        const canExec = await aiTokenService.canExecute(userId, 'TEXT_SPELLCHECK');
        if (!canExec.allowed) throw new Error(canExec.reason);

        try {
            const result = await aiService.spellCheck(request);
            const durationMs = Date.now() - startTime;

            const { livrasCost } = await aiTokenService.trackUsage({
                userId,
                operation: 'TEXT_SPELLCHECK',
                provider: providerName,
                inputChars: request.text.length,
                durationMs,
                success: true,
            });

            return {
                data: result,
                usage: { operation: 'TEXT_SPELLCHECK', provider: aiConfig.defaultTextProvider, livrasCost, durationMs },
            };
        } catch (error: any) {
            await aiTokenService.trackUsage({
                userId,
                operation: 'TEXT_SPELLCHECK',
                provider: providerName,
                inputChars: request.text.length,
                durationMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }

    /**
     * Sugestões de melhorias
     */
    async suggestImprovements(
        userId: string,
        request: TextGenerateRequest
    ): Promise<AIOperationResult<any>> {
        const startTime = Date.now();
        const providerName: AIProviderName = aiConfig.defaultTextProvider.toUpperCase() as AIProviderName;

        const canExec = await aiTokenService.canExecute(userId, 'TEXT_SUGGEST');
        if (!canExec.allowed) throw new Error(canExec.reason);

        try {
            const result = await aiService.suggestImprovements({
                text: request.text,
                characterId: request.characterId,
                chapterId: request.chapterId,
                includeContext: request.includeContext,
            });
            const durationMs = Date.now() - startTime;

            const { livrasCost } = await aiTokenService.trackUsage({
                userId,
                operation: 'TEXT_SUGGEST',
                provider: providerName,
                inputChars: request.text.length,
                durationMs,
                success: true,
            });

            return {
                data: result,
                usage: { operation: 'TEXT_SUGGEST', provider: aiConfig.defaultTextProvider, livrasCost, durationMs },
            };
        } catch (error: any) {
            await aiTokenService.trackUsage({
                userId,
                operation: 'TEXT_SUGGEST',
                provider: providerName,
                durationMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }

    /**
     * Enriquecimento com detalhes do personagem
     */
    async enrichWithCharacter(
        userId: string,
        request: { text?: string; characterId: string }
    ): Promise<AIOperationResult<any>> {
        const startTime = Date.now();
        const providerName: AIProviderName = aiConfig.defaultTextProvider.toUpperCase() as AIProviderName;

        const canExec = await aiTokenService.canExecute(userId, 'TEXT_ENRICH');
        if (!canExec.allowed) throw new Error(canExec.reason);

        try {
            const result = await aiService.enrichWithCharacterDetails(request);
            const durationMs = Date.now() - startTime;

            const { livrasCost } = await aiTokenService.trackUsage({
                userId,
                operation: 'TEXT_ENRICH',
                provider: providerName,
                resourceType: 'Character',
                resourceId: request.characterId,
                inputChars: (request.text || '').length,
                durationMs,
                success: true,
            });

            return {
                data: result,
                usage: { operation: 'TEXT_ENRICH', provider: aiConfig.defaultTextProvider, livrasCost, durationMs },
            };
        } catch (error: any) {
            await aiTokenService.trackUsage({
                userId,
                operation: 'TEXT_ENRICH',
                provider: providerName,
                durationMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }

    // ========== Image Operations (delegam ao AIService existente) ==========

    /**
     * Geração de imagem
     */
    async generateImage(
        userId: string,
        request: ImageGenerateRequest
    ): Promise<AIOperationResult<any>> {
        const startTime = Date.now();
        const providerName: AIProviderName = aiConfig.defaultImageProvider.toUpperCase() as AIProviderName;

        const canExec = await aiTokenService.canExecute(userId, 'IMAGE_GENERATE');
        if (!canExec.allowed) throw new Error(canExec.reason);

        try {
            const result = await aiService.generateImage(request);
            const durationMs = Date.now() - startTime;

            const { livrasCost } = await aiTokenService.trackUsage({
                userId,
                operation: 'IMAGE_GENERATE',
                provider: providerName,
                inputChars: request.prompt.length,
                durationMs,
                success: true,
                metadata: { style: request.style, width: request.width, height: request.height },
            });

            return {
                data: result,
                usage: { operation: 'IMAGE_GENERATE', provider: aiConfig.defaultImageProvider, livrasCost, durationMs },
            };
        } catch (error: any) {
            await aiTokenService.trackUsage({
                userId,
                operation: 'IMAGE_GENERATE',
                provider: providerName,
                durationMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }

    /**
     * Geração de imagem emocional
     */
    async generateEmotionImage(
        userId: string,
        request: EmotionImageRequest
    ): Promise<AIOperationResult<any>> {
        const startTime = Date.now();
        const providerName: AIProviderName = aiConfig.defaultImageProvider.toUpperCase() as AIProviderName;

        const canExec = await aiTokenService.canExecute(userId, 'IMAGE_EMOTION');
        if (!canExec.allowed) throw new Error(canExec.reason);

        try {
            const result = await aiService.generateEmotionImage(request);
            const durationMs = Date.now() - startTime;

            const { livrasCost } = await aiTokenService.trackUsage({
                userId,
                operation: 'IMAGE_EMOTION',
                provider: providerName,
                inputChars: request.text.length,
                resourceType: request.characterId ? 'Character' : undefined,
                resourceId: request.characterId,
                durationMs,
                success: true,
            });

            return {
                data: result,
                usage: { operation: 'IMAGE_EMOTION', provider: aiConfig.defaultImageProvider, livrasCost, durationMs },
            };
        } catch (error: any) {
            await aiTokenService.trackUsage({
                userId,
                operation: 'IMAGE_EMOTION',
                provider: providerName,
                durationMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }

    // ========== Meta/Info ==========

    /**
     * Retorna informações sobre os providers disponíveis
     */
    getProviderInfo(): {
        text: { current: string; available: string[] };
        image: { current: string; available: string[] };
        tts: { current: string; available: string[] };
    } {
        return {
            text: {
                current: aiConfig.defaultTextProvider,
                available: ['gemini', 'openai', 'anthropic'],
            },
            image: {
                current: aiConfig.defaultImageProvider,
                available: ['gemini', 'openai', 'stability'],
            },
            tts: {
                current: aiConfig.defaultTTSProvider,
                available: ['gemini', 'elevenlabs', 'azure'],
            },
        };
    }

    // ========== Private Helpers ==========

    /**
     * Salva buffer de áudio em arquivo
     */
    private async saveAudioBuffer(buffer: Buffer, speechId: string): Promise<string> {
        const fs = await import('fs');
        const path = await import('path');

        const audioDir = path.join(__dirname, '../../uploads/audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        const filename = `speech_${speechId}_${Date.now()}.mp3`;
        const filepath = path.join(audioDir, filename);
        fs.writeFileSync(filepath, buffer);

        return `/uploads/audio/${filename}`;
    }
}

export const aiApiService = new AIApiService();
