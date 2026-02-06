import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AIOperationType, AIProviderName } from '@prisma/client';
import { aiFactory } from '../ai/ai.factory';
import { aiConfig, TTSProviderType } from '../config/ai.config';
import { audioCacheService } from './cache.service';
import { usageService } from './usage.service';
import { getAudioDuration } from './audio-converter';
import {
    TTSGenerateRequest,
    TTSGenerateResponse,
    TTSPreviewRequest,
    VoiceListResponse,
    UsageInfo,
} from '../types/api.types';

class TTSService {
    private storageBasePath: string;

    constructor() {
        this.storageBasePath = aiConfig.storage.audioPath;
        this.ensureStorageDir();
    }

    private ensureStorageDir(): void {
        if (!fs.existsSync(this.storageBasePath)) {
            fs.mkdirSync(this.storageBasePath, { recursive: true });
        }
    }

    private mapProviderToEnum(provider: string): AIProviderName {
        switch (provider.toUpperCase()) {
            case 'ELEVENLABS':
                return 'ELEVENLABS';
            case 'GEMINI':
                return 'GEMINI';
            case 'OPENAI':
                return 'OPENAI';
            default:
                return 'GEMINI';
        }
    }

    /**
     * Generate audio from text
     */
    async generate(
        request: TTSGenerateRequest,
        userId: string,
        clientId: string
    ): Promise<TTSGenerateResponse> {
        const startTime = Date.now();
        const providerName = (request.provider as TTSProviderType) || aiConfig.defaultTTSProvider;
        const useCache = request.useCache !== false;

        // Check cache first
        if (useCache) {
            const cached = await audioCacheService.get(
                request.text,
                request.voiceId,
                providerName
            );

            if (cached) {
                console.log(`Cache hit for TTS request`);

                // Log usage with zero cost (from cache)
                await usageService.logUsage({
                    userId,
                    clientId,
                    operation: 'TTS_GENERATE',
                    provider: this.mapProviderToEnum(providerName),
                    inputChars: request.text.length,
                    outputBytes: cached.audioSizeBytes,
                    durationMs: Date.now() - startTime,
                    metadata: { fromCache: true, cacheHitCount: cached.hitCount },
                });

                // Read audio file and return
                const audioBuffer = fs.readFileSync(cached.audioUrl);

                return {
                    audioBase64: audioBuffer.toString('base64'),
                    audioUrl: cached.audioUrl,
                    format: cached.format,
                    durationMs: cached.audioDurationMs,
                    fromCache: true,
                    usage: {
                        operation: 'TTS_GENERATE',
                        provider: this.mapProviderToEnum(providerName),
                        creditsCost: 0, // Free from cache
                        estimatedUsd: 0,
                        durationMs: Date.now() - startTime,
                    },
                };
            }
        }

        // Generate audio with provider
        const provider = await aiFactory.getTTSProvider(providerName);
        const result = await provider.generateAudio({
            text: request.text,
            voice: { voiceId: request.voiceId },
            outputFormat: request.outputFormat || 'mp3',
        });

        // Save audio to storage
        const filename = `${uuidv4()}.${result.format}`;
        const filePath = path.join(this.storageBasePath, filename);
        fs.writeFileSync(filePath, result.buffer);

        // Get audio duration
        const durationMs = await getAudioDuration(result.buffer).catch(() => 0);

        // Save to cache
        if (useCache) {
            await audioCacheService.set(
                request.text,
                request.voiceId,
                providerName,
                filePath,
                durationMs,
                result.buffer.length,
                result.format
            );
        }

        // Get cost and log usage
        const cost = await usageService.getCost('TTS_GENERATE');
        await usageService.logUsage({
            userId,
            clientId,
            operation: 'TTS_GENERATE',
            provider: this.mapProviderToEnum(providerName),
            inputChars: request.text.length,
            outputBytes: result.buffer.length,
            durationMs: Date.now() - startTime,
            metadata: { voiceId: request.voiceId, format: result.format },
        });

        return {
            audioBase64: result.buffer.toString('base64'),
            audioUrl: filePath,
            format: result.format,
            durationMs,
            fromCache: false,
            usage: {
                operation: 'TTS_GENERATE',
                provider: this.mapProviderToEnum(providerName),
                creditsCost: cost.credits,
                estimatedUsd: cost.estimatedUsd,
                durationMs: Date.now() - startTime,
            },
        };
    }

    /**
     * Generate voice preview
     */
    async preview(
        request: TTSPreviewRequest,
        userId: string,
        clientId: string
    ): Promise<TTSGenerateResponse> {
        const startTime = Date.now();
        const providerName = (request.provider as TTSProviderType) || aiConfig.defaultTTSProvider;
        const sampleText = request.sampleText || 'Hello! This is a voice preview.';

        const provider = await aiFactory.getTTSProvider(providerName);
        const result = await provider.previewVoice(request.voiceId, sampleText);

        // Get cost and log usage
        const cost = await usageService.getCost('TTS_PREVIEW');
        await usageService.logUsage({
            userId,
            clientId,
            operation: 'TTS_PREVIEW',
            provider: this.mapProviderToEnum(providerName),
            inputChars: sampleText.length,
            outputBytes: result.buffer.length,
            durationMs: Date.now() - startTime,
            metadata: { voiceId: request.voiceId },
        });

        return {
            audioBase64: result.buffer.toString('base64'),
            format: result.format,
            fromCache: false,
            usage: {
                operation: 'TTS_PREVIEW',
                provider: this.mapProviderToEnum(providerName),
                creditsCost: cost.credits,
                estimatedUsd: cost.estimatedUsd,
                durationMs: Date.now() - startTime,
            },
        };
    }

    /**
     * List available voices
     */
    async listVoices(
        provider?: string,
        userId?: string,
        clientId?: string
    ): Promise<VoiceListResponse> {
        const startTime = Date.now();
        const providerName = (provider as TTSProviderType) || aiConfig.defaultTTSProvider;

        const ttsProvider = await aiFactory.getTTSProvider(providerName);
        const voices = await ttsProvider.getAvailableVoices();

        // Log usage if user info provided
        if (userId && clientId) {
            await usageService.logUsage({
                userId,
                clientId,
                operation: 'TTS_VOICES_LIST',
                provider: this.mapProviderToEnum(providerName),
                durationMs: Date.now() - startTime,
            });
        }

        return {
            voices: voices.map(v => ({
                voiceId: v.id,
                name: v.name,
                gender: v.gender,
                language: v.languageCode,
                description: v.description,
                previewUrl: v.previewUrl,
            })),
            count: voices.length,
            provider: providerName,
        };
    }

    /**
     * Generate audio for multiple items (batch)
     */
    async generateBatch(
        items: Array<{ id: string; text: string; voiceId: string }>,
        userId: string,
        clientId: string,
        provider?: string,
        onProgress?: (completed: number, total: number, itemId: string) => void
    ): Promise<Array<{
        id: string;
        success: boolean;
        audioUrl?: string;
        durationMs?: number;
        error?: string;
    }>> {
        const results: Array<{
            id: string;
            success: boolean;
            audioUrl?: string;
            durationMs?: number;
            error?: string;
        }> = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                const response = await this.generate(
                    {
                        text: item.text,
                        voiceId: item.voiceId,
                        provider,
                        useCache: true,
                    },
                    userId,
                    clientId
                );

                results.push({
                    id: item.id,
                    success: true,
                    audioUrl: response.audioUrl,
                    durationMs: response.durationMs,
                });

                if (onProgress) {
                    onProgress(i + 1, items.length, item.id);
                }
            } catch (error: any) {
                results.push({
                    id: item.id,
                    success: false,
                    error: error.message,
                });
            }
        }

        return results;
    }
}

export const ttsService = new TTSService();
