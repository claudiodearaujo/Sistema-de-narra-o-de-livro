import { Request, Response } from 'express';
import { campaignService } from '../services/campaign.service';
import { CampaignStatus } from '@prisma/client';

interface AuthRequest extends Request {
  userId?: string;
}

class CampaignController {
  /**
   * GET /api/groups/:groupId/campaigns
   * Lista campanhas de um grupo
   */
  async getCampaignsByGroup(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const status = req.query.status as CampaignStatus | undefined;

      const result = await campaignService.getCampaignsByGroup(groupId, page, limit, status);

      res.json(result);
    } catch (error: any) {
      console.error('Erro ao listar campanhas:', error);
      res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/groups/:groupId/campaigns
   * Cria uma nova campanha
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const { name, description, startDate, endDate, livraReward, bookIds } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'O nome da campanha é obrigatório' });
      }

      if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
        return res.status(400).json({ error: 'A campanha deve ter pelo menos um livro' });
      }

      const campaign = await campaignService.create(groupId, req.userId!, {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        livraReward: livraReward ? parseInt(livraReward) : undefined,
        bookIds,
      });

      res.status(201).json(campaign);
    } catch (error: any) {
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
  async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const campaign = await campaignService.getById(id, req.userId);

      if (!campaign) {
        return res.status(404).json({ error: 'Campanha não encontrada' });
      }

      res.json(campaign);
    } catch (error: any) {
      console.error('Erro ao obter campanha:', error);
      res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }

  /**
   * PUT /api/campaigns/:id
   * Atualiza uma campanha
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, description, status, startDate, endDate, livraReward } = req.body;

      const validStatus = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)
        ? (status as CampaignStatus)
        : undefined;

      const campaign = await campaignService.update(id, req.userId!, {
        name,
        description,
        status: validStatus,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        livraReward: livraReward !== undefined ? parseInt(livraReward) : undefined,
      });

      res.json(campaign);
    } catch (error: any) {
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
  async delete(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      await campaignService.delete(id, req.userId!);

      res.status(204).send();
    } catch (error: any) {
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
  async join(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const progress = await campaignService.joinCampaign(id, req.userId!);

      res.status(201).json(progress);
    } catch (error: any) {
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
  async getProgress(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const progress = await campaignService.getProgress(id, req.userId!);

      if (!progress) {
        return res.status(404).json({ error: 'Você não está participando desta campanha' });
      }

      res.json(progress);
    } catch (error: any) {
      console.error('Erro ao obter progresso:', error);
      res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/campaigns/:id/leaderboard
   * Obtém ranking da campanha
   */
  async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      const leaderboard = await campaignService.getCampaignLeaderboard(id, limit);

      res.json(leaderboard);
    } catch (error: any) {
      console.error('Erro ao obter leaderboard:', error);
      res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/campaigns/:id/complete-book
   * Marca um livro como lido na campanha
   */
  async completeBook(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { bookId } = req.body;

      if (!bookId) {
        return res.status(400).json({ error: 'O ID do livro é obrigatório' });
      }

      const progress = await campaignService.completeBook(id, bookId, req.userId!);

      res.json(progress);
    } catch (error: any) {
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
  async getMyCampaigns(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const showCompleted = req.query.showCompleted === 'true';

      const result = await campaignService.getMyCampaigns(req.userId!, page, limit, showCompleted);

      res.json(result);
    } catch (error: any) {
      console.error('Erro ao listar minhas campanhas:', error);
      res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }
}

export const campaignController = new CampaignController();
