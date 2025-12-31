import { Request, Response } from 'express';
import * as searchService from '../services/search.service';

/**
 * Global search
 * GET /api/search
 */
export async function search(req: Request, res: Response): Promise<void> {
  try {
    const query = (req.query.q as string) || '';
    const type = req.query.type as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!query || query.length < 2) {
      res.status(400).json({ 
        error: 'A busca deve ter pelo menos 2 caracteres' 
      });
      return;
    }

    // Parse type filter
    let typeFilter: searchService.SearchResultType[] | undefined;
    if (type) {
      const validTypes: searchService.SearchResultType[] = ['user', 'book', 'post', 'chapter'];
      const requestedTypes = type.split(',') as searchService.SearchResultType[];
      typeFilter = requestedTypes.filter(t => validTypes.includes(t));
      
      if (typeFilter.length === 0) {
        typeFilter = undefined;
      }
    }

    const results = await searchService.search(query, {
      type: typeFilter,
      page,
      limit
    });

    res.json(results);
  } catch (error: any) {
    console.error('[SearchController] Error searching:', error);
    res.status(500).json({ error: 'Erro ao realizar busca' });
  }
}

/**
 * Search suggestions/autocomplete
 * GET /api/search/suggestions
 */
export async function getSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const query = (req.query.q as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);

    if (!query || query.length < 2) {
      res.json({ users: [], books: [] });
      return;
    }

    const suggestions = await searchService.getSuggestions(query, limit);

    res.json(suggestions);
  } catch (error: any) {
    console.error('[SearchController] Error getting suggestions:', error);
    res.status(500).json({ error: 'Erro ao buscar sugestões' });
  }
}

/**
 * Get trending searches
 * GET /api/search/trending
 */
export async function getTrending(req: Request, res: Response): Promise<void> {
  try {
    const trending = await searchService.getTrendingSearches();
    res.json({ trending });
  } catch (error: any) {
    console.error('[SearchController] Error getting trending:', error);
    res.status(500).json({ error: 'Erro ao buscar tendências' });
  }
}
