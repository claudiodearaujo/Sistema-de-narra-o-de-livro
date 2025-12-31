import { Router } from 'express';
import { groupController } from '../controllers/group.controller';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate, optionalAuth } from '../middleware';

const router = Router();

// ========== GROUP ROUTES ==========

// Descoberta de grupos (opcional auth para ver status de membro)
router.get('/', optionalAuth, groupController.discoverGroups);

// Meus grupos (autenticado)
router.get('/my', authenticate, groupController.getMyGroups);

// Detalhes do grupo (opcional auth)
router.get('/:id', optionalAuth, groupController.getById);

// CRUD de grupos (autenticado)
router.post('/', authenticate, groupController.create);
router.put('/:id', authenticate, groupController.update);
router.delete('/:id', authenticate, groupController.delete);

// Entrar/Sair de grupo (autenticado)
router.post('/:id/join', authenticate, groupController.join);
router.delete('/:id/leave', authenticate, groupController.leave);

// Membros do grupo
router.get('/:id/members', optionalAuth, groupController.getMembers);
router.put('/:id/members/:userId/role', authenticate, groupController.updateMemberRole);
router.delete('/:id/members/:userId', authenticate, groupController.removeMember);

// ========== CAMPAIGN ROUTES (nested under groups) ==========

// Campanhas do grupo
router.get('/:groupId/campaigns', optionalAuth, campaignController.getCampaignsByGroup);
router.post('/:groupId/campaigns', authenticate, campaignController.create);

export default router;
