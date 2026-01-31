"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.followController = void 0;
exports.toggleFollow = toggleFollow;
exports.getFollowers = getFollowers;
exports.getFollowing = getFollowing;
exports.getFollowStatus = getFollowStatus;
exports.getFollowCounts = getFollowCounts;
exports.getSuggestions = getSuggestions;
const follow_service_1 = require("../services/follow.service");
/**
 * POST /api/users/:userId/follow - Toggle follow on a user
 */
async function toggleFollow(req, res) {
    try {
        const currentUserId = req.user?.userId;
        if (!currentUserId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const result = await follow_service_1.followService.toggleFollow(currentUserId, userId);
        res.json(result);
    }
    catch (error) {
        console.error('[FollowController] Error toggling follow:', error.message);
        if (error.message.includes('não encontrado')) {
            res.status(404).json({ error: error.message });
        }
        else if (error.message.includes('si mesmo')) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao processar follow' });
        }
    }
}
/**
 * GET /api/users/:userId/followers - Get followers of a user
 */
async function getFollowers(req, res) {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const currentUserId = req.user?.userId;
        const result = await follow_service_1.followService.getFollowers(userId, page, limit, currentUserId);
        res.json(result);
    }
    catch (error) {
        console.error('[FollowController] Error getting followers:', error.message);
        res.status(500).json({ error: 'Erro ao buscar seguidores' });
    }
}
/**
 * GET /api/users/:userId/following - Get users that a user is following
 */
async function getFollowing(req, res) {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const currentUserId = req.user?.userId;
        const result = await follow_service_1.followService.getFollowing(userId, page, limit, currentUserId);
        res.json(result);
    }
    catch (error) {
        console.error('[FollowController] Error getting following:', error.message);
        res.status(500).json({ error: 'Erro ao buscar seguindo' });
    }
}
/**
 * GET /api/users/:userId/follow-status - Get follow status between current user and target
 */
async function getFollowStatus(req, res) {
    try {
        const currentUserId = req.user?.userId;
        if (!currentUserId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const result = await follow_service_1.followService.getFollowStatus(currentUserId, userId);
        res.json(result);
    }
    catch (error) {
        console.error('[FollowController] Error getting follow status:', error.message);
        res.status(500).json({ error: 'Erro ao verificar status de follow' });
    }
}
/**
 * GET /api/users/:userId/follow-counts - Get follower and following counts
 */
async function getFollowCounts(req, res) {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const result = await follow_service_1.followService.getFollowCounts(userId);
        res.json(result);
    }
    catch (error) {
        console.error('[FollowController] Error getting follow counts:', error.message);
        res.status(500).json({ error: 'Erro ao buscar contagens' });
    }
}
/**
 * GET /api/users/suggestions - Get suggested users to follow
 */
async function getSuggestions(req, res) {
    try {
        const currentUserId = req.user?.userId;
        if (!currentUserId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const limit = Math.min(parseInt(req.query.limit) || 5, 20);
        const suggestions = await follow_service_1.followService.getSuggestions(currentUserId, limit);
        res.json({ users: suggestions });
    }
    catch (error) {
        console.error('[FollowController] Error getting suggestions:', error.message);
        res.status(500).json({ error: 'Erro ao buscar sugestões' });
    }
}
exports.followController = {
    toggleFollow,
    getFollowers,
    getFollowing,
    getFollowStatus,
    getFollowCounts,
    getSuggestions
};
