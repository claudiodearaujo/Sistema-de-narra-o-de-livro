"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_api_controller_1 = require("../controllers/ai-api.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// ========== Health Check ==========
router.get('/health', ai_api_controller_1.aiApiController.healthCheck.bind(ai_api_controller_1.aiApiController));
// ========== TTS Routes ==========
// Listar vozes - requer autenticação
router.get('/tts/voices', middleware_1.authenticate, ai_api_controller_1.aiApiController.listVoices.bind(ai_api_controller_1.aiApiController));
// Gerar áudio - requer writer + TTS habilitado
router.post('/tts/generate', middleware_1.authenticate, middleware_1.requireWriter, (0, middleware_1.requireFeature)('canUseTTS'), ai_api_controller_1.aiApiController.generateAudio.bind(ai_api_controller_1.aiApiController));
// Preview de voz - requer writer + TTS habilitado
router.post('/tts/preview', middleware_1.authenticate, middleware_1.requireWriter, (0, middleware_1.requireFeature)('canUseTTS'), ai_api_controller_1.aiApiController.previewVoice.bind(ai_api_controller_1.aiApiController));
// ========== Usage & Info Routes ==========
// Resumo de uso - requer autenticação
router.get('/usage', middleware_1.authenticate, ai_api_controller_1.aiApiController.getUsage.bind(ai_api_controller_1.aiApiController));
// Custos das operações - público (para informar pricing)
router.get('/costs', ai_api_controller_1.aiApiController.getCosts.bind(ai_api_controller_1.aiApiController));
// Providers disponíveis - público
router.get('/providers', ai_api_controller_1.aiApiController.getProviders.bind(ai_api_controller_1.aiApiController));
// ========== Admin Routes ==========
// Estatísticas da plataforma - apenas admin
router.get('/admin/stats', middleware_1.authenticate, middleware_1.requireAdmin, ai_api_controller_1.aiApiController.getPlatformStats.bind(ai_api_controller_1.aiApiController));
// Histórico de uso por dia - apenas admin
router.get('/admin/history', middleware_1.authenticate, middleware_1.requireAdmin, ai_api_controller_1.aiApiController.getUsageHistory.bind(ai_api_controller_1.aiApiController));
// Configurações de custo - apenas admin
router.get('/admin/costs', middleware_1.authenticate, middleware_1.requireAdmin, ai_api_controller_1.aiApiController.getAdminCosts.bind(ai_api_controller_1.aiApiController));
// Atualizar custo de operação - apenas admin
router.put('/admin/costs/:operation', middleware_1.authenticate, middleware_1.requireAdmin, ai_api_controller_1.aiApiController.updateOperationCost.bind(ai_api_controller_1.aiApiController));
// Estatísticas do cache de áudio - apenas admin
router.get('/admin/cache/stats', middleware_1.authenticate, middleware_1.requireAdmin, ai_api_controller_1.aiApiController.getCacheStats.bind(ai_api_controller_1.aiApiController));
// Limpar cache - apenas admin
router.post('/admin/cache/clean', middleware_1.authenticate, middleware_1.requireAdmin, ai_api_controller_1.aiApiController.cleanCache.bind(ai_api_controller_1.aiApiController));
exports.default = router;
