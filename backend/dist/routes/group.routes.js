"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = require("../controllers/group.controller");
const campaign_controller_1 = require("../controllers/campaign.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// ========== GROUP ROUTES ==========
// Descoberta de grupos (opcional auth para ver status de membro)
router.get('/', middleware_1.optionalAuth, group_controller_1.groupController.discoverGroups);
// Meus grupos (autenticado)
router.get('/my', middleware_1.authenticate, group_controller_1.groupController.getMyGroups);
// Detalhes do grupo (opcional auth)
router.get('/:id', middleware_1.optionalAuth, group_controller_1.groupController.getById);
// CRUD de grupos (autenticado)
router.post('/', middleware_1.authenticate, group_controller_1.groupController.create);
router.put('/:id', middleware_1.authenticate, group_controller_1.groupController.update);
router.delete('/:id', middleware_1.authenticate, group_controller_1.groupController.delete);
// Entrar/Sair de grupo (autenticado)
router.post('/:id/join', middleware_1.authenticate, group_controller_1.groupController.join);
router.delete('/:id/leave', middleware_1.authenticate, group_controller_1.groupController.leave);
// Membros do grupo
router.get('/:id/members', middleware_1.optionalAuth, group_controller_1.groupController.getMembers);
router.put('/:id/members/:userId/role', middleware_1.authenticate, group_controller_1.groupController.updateMemberRole);
router.delete('/:id/members/:userId', middleware_1.authenticate, group_controller_1.groupController.removeMember);
// ========== CAMPAIGN ROUTES (nested under groups) ==========
// Campanhas do grupo
router.get('/:groupId/campaigns', middleware_1.optionalAuth, campaign_controller_1.campaignController.getCampaignsByGroup);
router.post('/:groupId/campaigns', middleware_1.authenticate, campaign_controller_1.campaignController.create);
exports.default = router;
