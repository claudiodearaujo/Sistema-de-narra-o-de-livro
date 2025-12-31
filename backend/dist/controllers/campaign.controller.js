"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignController = void 0;
const campaign_service_1 = require("../services/campaign.service");
class CampaignController {
    /**
     * GET /api/groups/:groupId/campaigns
     * Lista campanhas de um grupo
     */
    async getCampaignsByGroup(req, res) {
        try {
            const { groupId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const status = req.query.status;
            const result = await campaign_service_1.campaignService.getCampaignsByGroup(groupId, page, limit, status);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao listar campanhas:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * POST /api/groups/:groupId/campaigns
     * Cria uma nova campanha
     */
    async create(req, res) {
        try {
            const { groupId } = req.params;
            const { name, description, startDate, endDate, livraReward, bookIds } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'O nome da campanha é obrigatório' });
            }
            if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
                return res.status(400).json({ error: 'A campanha deve ter pelo menos um livro' });
            }
            const campaign = await campaign_service_1.campaignService.create(groupId, req.userId, {
                name,
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                livraReward: livraReward ? parseInt(livraReward) : undefined,
                bookIds,
            });
            res.status(201).json(campaign);
        }
        catch (error) {
            console.error('Erro ao criar campanha:', error);
            if (error.message.includes('permissão') || error.message.includes('membro')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao criar campanha' });
        }
    }
    /**
     * GET /api/campaigns/:id
     * Obtém detalhes de uma campanha
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const campaign = await campaign_service_1.campaignService.getById(id, req.userId);
            if (!campaign) {
                return res.status(404).json({ error: 'Campanha não encontrada' });
            }
            res.json(campaign);
        }
        catch (error) {
            console.error('Erro ao obter campanha:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * PUT /api/campaigns/:id
     * Atualiza uma campanha
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, status, startDate, endDate, livraReward } = req.body;
            const validStatus = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)
                ? status
                : undefined;
            const campaign = await campaign_service_1.campaignService.update(id, req.userId, {
                name,
                description,
                status: validStatus,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                livraReward: livraReward !== undefined ? parseInt(livraReward) : undefined,
            });
            res.json(campaign);
        }
        catch (error) {
            console.error('Erro ao atualizar campanha:', error);
            if (error.message.includes('permissão')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao atualizar campanha' });
        }
    }
    /**
     * DELETE /api/campaigns/:id
     * Deleta uma campanha
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await campaign_service_1.campaignService.delete(id, req.userId);
            res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao deletar campanha:', error);
            if (error.message.includes('dono')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao deletar campanha' });
        }
    }
    /**
     * POST /api/campaigns/:id/join
     * Participar de uma campanha
     */
    async join(req, res) {
        try {
            const { id } = req.params;
            const progress = await campaign_service_1.campaignService.joinCampaign(id, req.userId);
            res.status(201).json(progress);
        }
        catch (error) {
            console.error('Erro ao participar da campanha:', error);
            if (error.message.includes('membro')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao participar da campanha' });
        }
    }
    /**
     * GET /api/campaigns/:id/progress
     * Obtém progresso do usuário na campanha
     */
    async getProgress(req, res) {
        try {
            const { id } = req.params;
            const progress = await campaign_service_1.campaignService.getProgress(id, req.userId);
            if (!progress) {
                return res.status(404).json({ error: 'Você não está participando desta campanha' });
            }
            res.json(progress);
        }
        catch (error) {
            console.error('Erro ao obter progresso:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * GET /api/campaigns/:id/leaderboard
     * Obtém ranking da campanha
     */
    async getLeaderboard(req, res) {
        try {
            const { id } = req.params;
            const limit = Math.min(parseInt(req.query.limit) || 10, 50);
            const leaderboard = await campaign_service_1.campaignService.getCampaignLeaderboard(id, limit);
            res.json(leaderboard);
        }
        catch (error) {
            console.error('Erro ao obter leaderboard:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * POST /api/campaigns/:id/complete-book
     * Marca um livro como lido na campanha
     */
    async completeBook(req, res) {
        try {
            const { id } = req.params;
            const { bookId } = req.body;
            if (!bookId) {
                return res.status(400).json({ error: 'O ID do livro é obrigatório' });
            }
            const progress = await campaign_service_1.campaignService.completeBook(id, bookId, req.userId);
            res.json(progress);
        }
        catch (error) {
            console.error('Erro ao completar livro:', error);
            if (error.message.includes('ativa')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao completar livro' });
        }
    }
    /**
     * GET /api/campaigns/my
     * Lista campanhas do usuário
     */
    async getMyCampaigns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const showCompleted = req.query.showCompleted === 'true';
            const result = await campaign_service_1.campaignService.getMyCampaigns(req.userId, page, limit, showCompleted);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao listar minhas campanhas:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
}
exports.campaignController = new CampaignController();
