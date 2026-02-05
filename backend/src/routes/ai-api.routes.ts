import { Router } from 'express';
import { aiApiController } from '../controllers/ai-api.controller';
import { authenticate, requireWriter, requireFeature } from '../middleware';

const router = Router();

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

// Narrar capítulo completo - requer writer + TTS habilitado
router.post('/tts/narrate-chapter',
    authenticate,
    requireWriter,
    requireFeature('canUseTTS'),
    aiApiController.narrateChapter.bind(aiApiController)
);

// ========== Text Routes ==========

// Correção ortográfica - requer autenticação
router.post('/text/spellcheck',
    authenticate,
    aiApiController.spellCheck.bind(aiApiController)
);

// Sugestões de melhoria - requer autenticação
router.post('/text/suggest',
    authenticate,
    aiApiController.suggestImprovements.bind(aiApiController)
);

// Enriquecimento com personagem - requer writer
router.post('/text/enrich',
    authenticate,
    requireWriter,
    aiApiController.enrichWithCharacter.bind(aiApiController)
);

// ========== Image Routes ==========

// Geração de imagem - requer writer + Image Gen habilitado
router.post('/image/generate',
    authenticate,
    requireWriter,
    requireFeature('canUseImageGen'),
    aiApiController.generateImage.bind(aiApiController)
);

// Geração de imagem emocional - requer writer + Image Gen habilitado
router.post('/image/emotion',
    authenticate,
    requireWriter,
    requireFeature('canUseImageGen'),
    aiApiController.generateEmotionImage.bind(aiApiController)
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

export default router;
