"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeController = void 0;
exports.toggleLike = toggleLike;
exports.getLikes = getLikes;
exports.getLikeStatus = getLikeStatus;
const like_service_1 = require("../services/like.service");
/**
 * POST /api/posts/:postId/like - Toggle like on a post
 */
async function toggleLike(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const postId = req.params.postId;
        if (!postId) {
            res.status(400).json({ error: 'ID do post é obrigatório' });
            return;
        }
        const result = await like_service_1.likeService.toggleLike(postId, userId);
        res.json(result);
    }
    catch (error) {
        console.error('[LikeController] Error toggling like:', error.message);
        if (error.message.includes('não encontrado')) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao processar curtida' });
        }
    }
}
/**
 * GET /api/posts/:postId/likes - Get users who liked a post
 */
async function getLikes(req, res) {
    try {
        const postId = req.params.postId;
        if (!postId) {
            res.status(400).json({ error: 'ID do post é obrigatório' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const result = await like_service_1.likeService.getLikesByPost(postId, page, limit);
        res.json(result);
    }
    catch (error) {
        console.error('[LikeController] Error getting likes:', error.message);
        res.status(500).json({ error: 'Erro ao buscar curtidas' });
    }
}
/**
 * GET /api/posts/:postId/like/status - Check if current user liked the post
 */
async function getLikeStatus(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const postId = req.params.postId;
        if (!postId) {
            res.status(400).json({ error: 'ID do post é obrigatório' });
            return;
        }
        const isLiked = await like_service_1.likeService.isLiked(postId, userId);
        res.json({ isLiked });
    }
    catch (error) {
        console.error('[LikeController] Error checking like status:', error.message);
        res.status(500).json({ error: 'Erro ao verificar curtida' });
    }
}
exports.likeController = {
    toggleLike,
    getLikes,
    getLikeStatus
};
