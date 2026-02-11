import { Router } from 'express';
import { ssmlController } from '../controllers/ssml.controller';
import { authenticate, requireWriter } from '../middleware';

const router = Router();

// SSML assistance routes - require authentication and writer role

/**
 * POST /api/ssml/suggest-tags
 * AI-powered SSML tag suggestions based on text and context
 */
router.post('/suggest-tags',
    authenticate,
    requireWriter,
    ssmlController.suggestTags.bind(ssmlController)
);

/**
 * POST /api/ssml/suggest-properties
 * AI-powered SSML property suggestions (pitch, rate, volume)
 */
router.post('/suggest-properties',
    authenticate,
    requireWriter,
    ssmlController.suggestProperties.bind(ssmlController)
);

/**
 * POST /api/ssml/apply-suggestions
 * Apply SSML suggestions to text
 */
router.post('/apply-suggestions',
    authenticate,
    requireWriter,
    ssmlController.applySuggestions.bind(ssmlController)
);

export default router;
