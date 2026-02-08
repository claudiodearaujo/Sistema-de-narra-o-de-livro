import { Router } from 'express';
import { aiApiController } from '../controllers/ai-api.controller';
import { authenticate, requireWriter, requireFeature, requireAdmin } from '../middleware';

const router = Router();

// ========== Health Check ==========

router.get('/health', aiApiController.healthCheck.bind(aiApiController));

// ========== TTS Routes ==========

// Listar vozes - requer autenticação
router.get('/tts/voices',
    authenticate,
    aiApiController.listVoices.bind(aiApiController)
);

// Gerar áudio - requer writer + TTS habilitado
router.post('/tts/generate',
    authenticate,
    requireWriter,
    requireFeature('canUseTTS'),
    aiApiController.generateAudio.bind(aiApiController)
);

// Preview de voz - requer writer + TTS habilitado
router.post('/tts/preview',
    authenticate,
    requireWriter,
    requireFeature('canUseTTS'),
    aiApiController.previewVoice.bind(aiApiController)
);

// ========== Usage & Info Routes ==========

// Resumo de uso - requer autenticação
router.get('/usage',
    authenticate,
    aiApiController.getUsage.bind(aiApiController)
);

// Custos das operações - público (para informar pricing)
router.get('/costs',
    aiApiController.getCosts.bind(aiApiController)
);

// Providers disponíveis - público
router.get('/providers',
    aiApiController.getProviders.bind(aiApiController)
);

// ========== Admin Routes ==========

// Estatísticas da plataforma - apenas admin
router.get('/admin/stats',
    authenticate,
    requireAdmin,
    aiApiController.getPlatformStats.bind(aiApiController)
);

// Histórico de uso por dia - apenas admin
router.get('/admin/history',
    authenticate,
    requireAdmin,
    aiApiController.getUsageHistory.bind(aiApiController)
);

// Configurações de custo - apenas admin
router.get('/admin/costs',
    authenticate,
    requireAdmin,
    aiApiController.getAdminCosts.bind(aiApiController)
);

// Atualizar custo de operação - apenas admin
router.put('/admin/costs/:operation',
    authenticate,
    requireAdmin,
    aiApiController.updateOperationCost.bind(aiApiController)
);

// Estatísticas do cache de áudio - apenas admin
router.get('/admin/cache/stats',
    authenticate,
    requireAdmin,
    aiApiController.getCacheStats.bind(aiApiController)
);

// Limpar cache - apenas admin
router.post('/admin/cache/clean',
    authenticate,
    requireAdmin,
    aiApiController.cleanCache.bind(aiApiController)
);

export default router;
