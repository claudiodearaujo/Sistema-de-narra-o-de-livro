"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
exports.getSuggestions = getSuggestions;
exports.getTrending = getTrending;
const searchService = __importStar(require("../services/search.service"));
/**
 * Global search
 * GET /api/search
 */
async function search(req, res) {
    try {
        const query = req.query.q || '';
        const type = req.query.type;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        if (!query || query.length < 2) {
            res.status(400).json({
                error: 'A busca deve ter pelo menos 2 caracteres'
            });
            return;
        }
        // Parse type filter
        let typeFilter;
        if (type) {
            const validTypes = ['user', 'book', 'post', 'chapter'];
            const requestedTypes = type.split(',');
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
    }
    catch (error) {
        console.error('[SearchController] Error searching:', error);
        res.status(500).json({ error: 'Erro ao realizar busca' });
    }
}
/**
 * Search suggestions/autocomplete
 * GET /api/search/suggestions
 */
async function getSuggestions(req, res) {
    try {
        const query = req.query.q || '';
        const limit = Math.min(parseInt(req.query.limit) || 5, 10);
        if (!query || query.length < 2) {
            res.json({ users: [], books: [] });
            return;
        }
        const suggestions = await searchService.getSuggestions(query, limit);
        res.json(suggestions);
    }
    catch (error) {
        console.error('[SearchController] Error getting suggestions:', error);
        res.status(500).json({ error: 'Erro ao buscar sugestões' });
    }
}
/**
 * Get trending searches
 * GET /api/search/trending
 */
async function getTrending(req, res) {
    try {
        const trending = await searchService.getTrendingSearches();
        res.json({ trending });
    }
    catch (error) {
        console.error('[SearchController] Error getting trending:', error);
        res.status(500).json({ error: 'Erro ao buscar tendências' });
    }
}
