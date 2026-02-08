"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiApiController = exports.AIApiController = void 0;
const ai_service_client_1 = require("../services/ai-service.client");
/**
 * Controller da API de Inteligência Artificial
 *
 * Atua como proxy para o AI Service standalone.
 * Todas as requisições são encaminhadas para o serviço de IA.
 */
class AIApiController {
    // ========== TTS Endpoints ==========
    /**
     * POST /api/ai/tts/generate
     * Gera áudio a partir de texto
     */
    async generateAudio(req, res) {
        try {
            const userId = req.user.userId;
            ai_service_client_1.aiServiceClient.setUserContext(userId);
            const { text, voiceId, outputFormat, provider, useCache } = req.body;
            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }
            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }
            const result = await ai_service_client_1.aiServiceClient.generateAudio({
                text,
                voiceId,
                outputFormat,
                provider,
                useCache,
            });
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao gerar áudio:', error);
            const status = error.message.includes('insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }
    /**
     * GET /api/ai/tts/voices
     * Lista todas as vozes disponíveis
     */
    async listVoices(req, res) {
        try {
            const userId = req.user.userId;
            ai_service_client_1.aiServiceClient.setUserContext(userId);
            const provider = req.query.provider;
            const result = await ai_service_client_1.aiServiceClient.listVoices(provider);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao listar vozes:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * POST /api/ai/tts/preview
     * Gera preview de áudio para uma voz
     */
    async previewVoice(req, res) {
        try {
            const userId = req.user.userId;
            ai_service_client_1.aiServiceClient.setUserContext(userId);
            const { voiceId, sampleText, provider } = req.body;
            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }
            const result = await ai_service_client_1.aiServiceClient.previewVoice({
                voiceId,
                sampleText,
                provider,
            });
            res.json(result);
        }
        catch (error) {
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
    async getUsage(req, res) {
        try {
            const userId = req.user.userId;
            ai_service_client_1.aiServiceClient.setUserContext(userId);
            const period = req.query.period;
            const result = await ai_service_client_1.aiServiceClient.getUsage(period);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar uso:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * GET /api/ai/costs
     * Lista custos de todas as operações de IA
     */
    async getCosts(req, res) {
        try {
            const result = await ai_service_client_1.aiServiceClient.getCosts();
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar custos:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * GET /api/ai/providers
     * Informações sobre providers disponíveis
     */
    async getProviders(req, res) {
        try {
            const result = await ai_service_client_1.aiServiceClient.getProviders();
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar providers:', error);
            res.status(500).json({ error: error.message });
        }
    }
    // ========== Admin Endpoints ==========
    /**
     * GET /api/ai/admin/stats
     * Estatísticas gerais de uso da plataforma (Admin only)
     */
    async getPlatformStats(req, res) {
        try {
            const period = req.query.period;
            const result = await ai_service_client_1.aiServiceClient.getPlatformStats(period);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * GET /api/ai/admin/history
     * Histórico de uso por dia (Admin only)
     */
    async getUsageHistory(req, res) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : undefined;
            const result = await ai_service_client_1.aiServiceClient.getUsageHistory(days);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar histórico:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * GET /api/ai/admin/costs
     * Lista todas as configurações de custo (Admin only)
     */
    async getAdminCosts(req, res) {
        try {
            const result = await ai_service_client_1.aiServiceClient.getCosts();
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar configurações de custo:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * PUT /api/ai/admin/costs/:operation
     * Atualiza o custo em Livras de uma operação (Admin only)
     */
    async updateOperationCost(req, res) {
        try {
            const operation = req.params.operation;
            const { credits } = req.body;
            if (credits === undefined || credits < 0) {
                return res.status(400).json({ error: 'Custo deve ser um número não negativo' });
            }
            const result = await ai_service_client_1.aiServiceClient.updateCost(operation, credits);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao atualizar custo:', error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * GET /api/ai/admin/cache/stats
     * Estatísticas do cache de áudio (Admin only)
     */
    async getCacheStats(req, res) {
        try {
            const result = await ai_service_client_1.aiServiceClient.getCacheStats();
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas do cache:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * POST /api/ai/admin/cache/clean
     * Limpa entradas expiradas ou não utilizadas do cache (Admin only)
     */
    async cleanCache(req, res) {
        try {
            const { type, daysUnused } = req.body;
            if (!['expired', 'unused', 'all'].includes(type)) {
                return res.status(400).json({
                    error: 'Tipo de limpeza inválido. Use: expired, unused, ou all',
                });
            }
            const result = await ai_service_client_1.aiServiceClient.cleanCache(type, daysUnused);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao limpar cache:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * GET /api/ai/health
     * Verifica saúde do serviço de IA
     */
    async healthCheck(req, res) {
        try {
            const result = await ai_service_client_1.aiServiceClient.healthCheck();
            res.json(result);
        }
        catch (error) {
            console.error('AI Service não disponível:', error);
            res.status(503).json({
                status: 'unhealthy',
                error: 'AI Service não disponível',
            });
        }
    }
}
exports.AIApiController = AIApiController;
exports.aiApiController = new AIApiController();
