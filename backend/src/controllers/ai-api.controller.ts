import { Request, Response } from 'express';
import { aiServiceClient } from '../services/ai-service.client';

/**
 * Controller da API de Inteligência Artificial
 *
 * Atua como proxy para o AI Service standalone.
 * Todas as requisições são encaminhadas para o serviço de IA.
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
            aiServiceClient.setUserContext(userId);

            const { text, voiceId, outputFormat, provider, useCache } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }
            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }

            const result = await aiServiceClient.generateAudio({
                text,
                voiceId,
                outputFormat,
                provider,
                useCache,
            });

            res.json(result);
        } catch (error: any) {
            console.error('Erro ao gerar áudio:', error);
            const status = error.message.includes('insuficiente') ? 402 : 500;
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
            aiServiceClient.setUserContext(userId);

            const provider = req.query.provider as string | undefined;

            const result = await aiServiceClient.listVoices(provider);

            res.json(result);
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
            aiServiceClient.setUserContext(userId);

            const { voiceId, sampleText, provider } = req.body;

            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }

            const result = await aiServiceClient.previewVoice({
                voiceId,
                sampleText,
                provider,
            });

            res.json(result);
        } catch (error: any) {
            console.error('Erro ao gerar preview:', error);
            const status = error.message.includes('insuficiente') ? 402 : 500;
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
            aiServiceClient.setUserContext(userId);

            const period = req.query.period as 'day' | 'week' | 'month' | undefined;

            const result = await aiServiceClient.getUsage(period);

            res.json(result);
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
            const result = await aiServiceClient.getCosts();
            res.json(result);
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
            const result = await aiServiceClient.getProviders();
            res.json(result);
        } catch (error: any) {
            console.error('Erro ao buscar providers:', error);
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
            const period = req.query.period as 'day' | 'week' | 'month' | undefined;
            const result = await aiServiceClient.getPlatformStats(period);
            res.json(result);
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
            const days = req.query.days ? parseInt(req.query.days as string) : undefined;
            const result = await aiServiceClient.getUsageHistory(days);
            res.json(result);
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
            const result = await aiServiceClient.getCosts();
            res.json(result);
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
            const operation = req.params.operation as string;
            const { credits } = req.body;

            if (credits === undefined || credits < 0) {
                return res.status(400).json({ error: 'Custo deve ser um número não negativo' });
            }

            const result = await aiServiceClient.updateCost(operation, credits);
            res.json(result);
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
            const result = await aiServiceClient.getCacheStats();
            res.json(result);
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

            if (!['expired', 'unused', 'all'].includes(type)) {
                return res.status(400).json({
                    error: 'Tipo de limpeza inválido. Use: expired, unused, ou all',
                });
            }

            const result = await aiServiceClient.cleanCache(type, daysUnused);
            res.json(result);
        } catch (error: any) {
            console.error('Erro ao limpar cache:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/health
     * Verifica saúde do serviço de IA
     */
    async healthCheck(req: Request, res: Response) {
        try {
            const result = await aiServiceClient.healthCheck();
            res.json(result);
        } catch (error: any) {
            console.error('AI Service não disponível:', error);
            res.status(503).json({
                status: 'unhealthy',
                error: 'AI Service não disponível',
            });
        }
    }
}

export const aiApiController = new AIApiController();
