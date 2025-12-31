import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate, optionalAuth } from '../middleware';

const router = Router();

// Minhas campanhas (autenticado)
router.get('/my', authenticate, campaignController.getMyCampaigns);

// Detalhes da campanha (opcional auth)
router.get('/:id', optionalAuth, campaignController.getById);

// CRUD de campanhas (autenticado)
router.put('/:id', authenticate, campaignController.update);
router.delete('/:id', authenticate, campaignController.delete);

// Participar de campanha
router.post('/:id/join', authenticate, campaignController.join);

// Progresso na campanha
router.get('/:id/progress', authenticate, campaignController.getProgress);

// Leaderboard da campanha
router.get('/:id/leaderboard', optionalAuth, campaignController.getLeaderboard);

// Completar livro na campanha
router.post('/:id/complete-book', authenticate, campaignController.completeBook);

export default router;
