"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("../controllers/campaign.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Minhas campanhas (autenticado)
router.get('/my', middleware_1.authenticate, campaign_controller_1.campaignController.getMyCampaigns);
// Detalhes da campanha (opcional auth)
router.get('/:id', middleware_1.optionalAuth, campaign_controller_1.campaignController.getById);
// CRUD de campanhas (autenticado)
router.put('/:id', middleware_1.authenticate, campaign_controller_1.campaignController.update);
router.delete('/:id', middleware_1.authenticate, campaign_controller_1.campaignController.delete);
// Participar de campanha
router.post('/:id/join', middleware_1.authenticate, campaign_controller_1.campaignController.join);
// Progresso na campanha
router.get('/:id/progress', middleware_1.authenticate, campaign_controller_1.campaignController.getProgress);
// Leaderboard da campanha
router.get('/:id/leaderboard', middleware_1.optionalAuth, campaign_controller_1.campaignController.getLeaderboard);
// Completar livro na campanha
router.post('/:id/complete-book', middleware_1.authenticate, campaign_controller_1.campaignController.completeBook);
exports.default = router;
