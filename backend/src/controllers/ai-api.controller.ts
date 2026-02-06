import { Request, Response } from 'express';
import { AIOperationType } from '@prisma/client';
import { aiApiService } from '../services/ai-api.service';
import { aiTokenService } from '../services/ai-token.service';
import { chapterSyncService } from '../services/chapter-sync.service';
import { audioCacheService } from '../services/audio-cache.service';
import {
    addChapterSyncJob,
    getChapterSyncJobStatus,
    cancelChapterSyncJob,
} from '../queues/chapter-sync.worker';

/**
 * Controller da API de Inteligência Artificial
 *
 * Centraliza todos os endpoints de IA em /api/ai/*
 * Cada operação é rastreada com controle de tokens e custos.
 */
export class AIApiController {

    // ========== TTS Endpoints ==========

    /**
     * POST /api/ai/tts/generate
     * Gera áudio a partir de texto
     */
    async generateAudio(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, voiceId, outputFormat, provider } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }
            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }

            const result = await aiApiService.generateAudio(userId, {
                text,
                voiceId,
                outputFormat,
                provider,
            });

            res.json({
                audioBase64: result.data.audioBase64,
                format: result.data.format,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro ao gerar áudio:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/tts/voices
     * Lista todas as vozes disponíveis
     */
    async listVoices(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const provider = req.query.provider as string | undefined;

            const result = await aiApiService.listVoices(userId, {
                provider: provider as any,
            });

            res.json({
                voices: result.data,
                count: result.data.length,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro ao listar vozes:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/tts/preview
     * Gera preview de áudio para uma voz
     */
    async previewVoice(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { voiceId, sampleText, provider } = req.body;

            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }

            const result = await aiApiService.previewVoice(userId, {
                voiceId,
                sampleText,
                provider,
            });

            res.json({
                audioBase64: result.data.audioBase64,
                format: result.data.format,
                voiceId,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro ao gerar preview:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/tts/narrate-chapter
     * Narra todas as falas de um capítulo
     */
    async narrateChapter(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { chapterId, provider } = req.body;

            if (!chapterId?.trim()) {
                return res.status(400).json({ error: 'ID do capítulo é obrigatório' });
            }

            const result = await aiApiService.narrateChapter(userId, {
                chapterId,
                provider,
            });

            res.json({
                speechCount: result.data.speechCount,
                completedCount: result.data.completedCount,
                errors: result.data.errors,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro na narração:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 400;
            res.status(status).json({ error: error.message });
        }
    }

    // ========== Text Endpoints ==========

    /**
     * POST /api/ai/text/spellcheck
     * Correção ortográfica
     */
    async spellCheck(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, language } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }

            const result = await aiApiService.spellCheck(userId, { text, language });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro no spellcheck:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/text/suggest
     * Sugestões de melhoria de texto
     */
    async suggestImprovements(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, characterId, chapterId, includeContext } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }

            const result = await aiApiService.suggestImprovements(userId, {
                text,
                characterId,
                chapterId,
                includeContext,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro nas sugestões:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/text/enrich
     * Enriquecimento de texto com dados do personagem
     */
    async enrichWithCharacter(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, characterId } = req.body;

            if (!characterId?.trim()) {
                return res.status(400).json({ error: 'ID do personagem é obrigatório' });
            }

            const result = await aiApiService.enrichWithCharacter(userId, {
                text,
                characterId,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro no enriquecimento:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    // ========== Image Endpoints ==========

    /**
     * POST /api/ai/image/generate
     * Geração de imagem a partir de prompt
     */
    async generateImage(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { prompt, negativePrompt, width, height, style } = req.body;

            if (!prompt?.trim()) {
                return res.status(400).json({ error: 'Prompt é obrigatório' });
            }

            const result = await aiApiService.generateImage(userId, {
                prompt,
                negativePrompt,
                width,
                height,
                style,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro na geração de imagem:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/image/emotion
     * Geração de imagem emocional para texto/personagem
     */
    async generateEmotionImage(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, characterId, styleHint } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }

            const result = await aiApiService.generateEmotionImage(userId, {
                text,
                characterId,
                styleHint,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro na geração de imagem emocional:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    // ========== Usage & Info Endpoints ==========

    /**
     * GET /api/ai/usage
     * Resumo de uso de IA do usuário
     */
    async getUsage(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

            const summary = await aiTokenService.getUsageSummary(userId, period);

            res.json({
                period,
                ...summary,
            });
        } catch (error: any) {
            console.error('Erro ao buscar uso:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/costs
     * Lista custos de todas as operações de IA
     */
    async getCosts(req: Request, res: Response) {
        try {
            const costs = await aiTokenService.getAllCosts();

            res.json({ costs });
        } catch (error: any) {
            console.error('Erro ao buscar custos:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/providers
     * Informações sobre providers disponíveis
     */
    async getProviders(req: Request, res: Response) {
        try {
            const info = aiApiService.getProviderInfo();
            res.json(info);
        } catch (error: any) {
            console.error('Erro ao buscar providers:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ========== Chapter Sync Endpoints ==========

    /**
     * POST /api/ai/sync/chapter
     * Sincroniza um capítulo: gera áudios, concatena e cria timeline
     * Executa em background se Redis estiver habilitado
     */
    async syncChapter(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { chapterId, provider, background, priority } = req.body;

            if (!chapterId?.trim()) {
                return res.status(400).json({ error: 'ID do capítulo é obrigatório' });
            }

            // Se background=true, adicionar à fila
            if (background) {
                const { jobId, queued } = await addChapterSyncJob({
                    chapterId,
                    userId,
                    provider,
                    priority,
                });

                return res.json({
                    message: queued ? 'Sincronização adicionada à fila' : 'Sincronização iniciada',
                    jobId,
                    queued,
                    chapterId,
                });
            }

            // Executar síncronamente
            const result = await chapterSyncService.syncChapter(userId, chapterId, provider);

            res.json({
                success: result.success,
                narrationId: result.narrationId,
                outputUrl: result.outputUrl,
                totalDurationMs: result.totalDurationMs,
                completedSpeeches: result.completedSpeeches,
                failedSpeeches: result.failedSpeeches,
                errors: result.errors,
                timeline: result.timeline,
            });
        } catch (error: any) {
            console.error('Erro na sincronização:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 400;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/sync/chapter/:chapterId/status
     * Obtém o status de sincronização de um capítulo
     */
    async getSyncStatus(req: Request, res: Response) {
        try {
            const chapterId = req.params.chapterId as string;

            if (!chapterId?.trim()) {
                return res.status(400).json({ error: 'ID do capítulo é obrigatório' });
            }

            const status = await chapterSyncService.getSyncStatus(chapterId);

            if (!status) {
                return res.status(404).json({ error: 'Nenhuma sincronização encontrada para este capítulo' });
            }

            res.json(status);
        } catch (error: any) {
            console.error('Erro ao buscar status:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/sync/chapter/:chapterId/timeline
     * Obtém a timeline completa de um capítulo sincronizado
     */
    async getChapterTimeline(req: Request, res: Response) {
        try {
            const chapterId = req.params.chapterId as string;

            if (!chapterId?.trim()) {
                return res.status(400).json({ error: 'ID do capítulo é obrigatório' });
            }

            const timeline = await chapterSyncService.getChapterTimeline(chapterId);

            if (!timeline) {
                return res.status(404).json({ error: 'Timeline não encontrada. O capítulo pode não estar sincronizado.' });
            }

            res.json(timeline);
        } catch (error: any) {
            console.error('Erro ao buscar timeline:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/sync/speech/:speechId/regenerate
     * Regenera o áudio de uma fala específica
     */
    async regenerateSpeech(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const speechId = req.params.speechId as string;
            const { provider } = req.body;

            if (!speechId?.trim()) {
                return res.status(400).json({ error: 'ID da fala é obrigatório' });
            }

            const result = await chapterSyncService.regenerateSpeech(userId, speechId, provider);

            res.json({
                speechId,
                audioUrl: result.audioUrl,
                durationMs: result.durationMs,
                message: 'Áudio regenerado. O capítulo precisa ser re-sincronizado para atualizar a timeline.',
            });
        } catch (error: any) {
            console.error('Erro ao regenerar fala:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 400;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/sync/job/:jobId
     * Obtém o status de um job de sincronização na fila
     */
    async getSyncJobStatus(req: Request, res: Response) {
        try {
            const jobId = req.params.jobId as string;

            if (!jobId?.trim()) {
                return res.status(400).json({ error: 'ID do job é obrigatório' });
            }

            const status = await getChapterSyncJobStatus(jobId);

            if (!status) {
                return res.status(404).json({ error: 'Job não encontrado' });
            }

            res.json(status);
        } catch (error: any) {
            console.error('Erro ao buscar status do job:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * DELETE /api/ai/sync/job/:jobId
     * Cancela um job de sincronização pendente
     */
    async cancelSyncJob(req: Request, res: Response) {
        try {
            const jobId = req.params.jobId as string;

            if (!jobId?.trim()) {
                return res.status(400).json({ error: 'ID do job é obrigatório' });
            }

            const cancelled = await cancelChapterSyncJob(jobId);

            if (!cancelled) {
                return res.status(400).json({
                    error: 'Não foi possível cancelar o job. Ele pode já estar em execução ou concluído.',
                });
            }

            res.json({ message: 'Job cancelado com sucesso', jobId });
        } catch (error: any) {
            console.error('Erro ao cancelar job:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ========== Admin Endpoints ==========

    /**
     * GET /api/ai/admin/stats
     * Estatísticas gerais de uso da plataforma (Admin only)
     */
    async getPlatformStats(req: Request, res: Response) {
        try {
            const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

            const stats = await aiTokenService.getPlatformStats(period);

            res.json({
                period,
                ...stats,
            });
        } catch (error: any) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/admin/history
     * Histórico de uso por dia (Admin only)
     */
    async getUsageHistory(req: Request, res: Response) {
        try {
            const days = parseInt(req.query.days as string) || 30;

            const history = await aiTokenService.getUsageHistory(days);

            res.json({
                days,
                history,
            });
        } catch (error: any) {
            console.error('Erro ao buscar histórico:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/admin/costs
     * Lista todas as configurações de custo (Admin only)
     */
    async getAdminCosts(req: Request, res: Response) {
        try {
            const configs = aiTokenService.getAllCostConfigs();
            const currentCosts = await aiTokenService.getAllCosts();

            const result = configs.map(config => ({
                ...config,
                currentValue: currentCosts[config.operation]?.livras || config.defaultValue,
                estimatedUsd: currentCosts[config.operation]?.estimatedUsd || 0,
            }));

            res.json({ costs: result });
        } catch (error: any) {
            console.error('Erro ao buscar configurações de custo:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * PUT /api/ai/admin/costs/:operation
     * Atualiza o custo em Livras de uma operação (Admin only)
     */
    async updateOperationCost(req: Request, res: Response) {
        try {
            const operation = req.params.operation as AIOperationType;
            const { livrasCost } = req.body;

            if (livrasCost === undefined || livrasCost < 0) {
                return res.status(400).json({ error: 'Custo em Livras deve ser um número não negativo' });
            }

            const result = await aiTokenService.updateOperationCost(operation, livrasCost);

            res.json({
                message: 'Custo atualizado com sucesso',
                ...result,
            });
        } catch (error: any) {
            console.error('Erro ao atualizar custo:', error);
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/admin/cache/stats
     * Estatísticas do cache de áudio (Admin only)
     */
    async getCacheStats(req: Request, res: Response) {
        try {
            const stats = await audioCacheService.getStats();

            res.json({
                ...stats,
                totalSizeMB: (stats.totalSizeBytes / (1024 * 1024)).toFixed(2),
            });
        } catch (error: any) {
            console.error('Erro ao buscar estatísticas do cache:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/admin/cache/clean
     * Limpa entradas expiradas ou não utilizadas do cache (Admin only)
     */
    async cleanCache(req: Request, res: Response) {
        try {
            const { type, daysUnused } = req.body;

            let removedCount = 0;

            if (type === 'expired') {
                removedCount = await audioCacheService.cleanExpired();
            } else if (type === 'unused') {
                removedCount = await audioCacheService.cleanUnused(daysUnused || 30);
            } else if (type === 'all') {
                removedCount = await audioCacheService.clearAll();
            } else {
                return res.status(400).json({
                    error: 'Tipo de limpeza inválido. Use: expired, unused, ou all',
                });
            }

            res.json({
                message: `Cache limpo com sucesso`,
                type,
                removedCount,
            });
        } catch (error: any) {
            console.error('Erro ao limpar cache:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const aiApiController = new AIApiController();
