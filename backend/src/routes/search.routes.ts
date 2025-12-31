import { Router } from 'express';
import * as searchController from '../controllers/search.controller';

const router = Router();

/**
 * Search Routes
 * Base path: /api/search
 */

// Get trending searches
router.get('/trending', searchController.getTrending);

// Get search suggestions (autocomplete)
router.get('/suggestions', searchController.getSuggestions);

// Global search
router.get('/', searchController.search);

export default router;
