"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = void 0;
exports.createPost = createPost;
exports.getFeed = getFeed;
exports.getExplore = getExplore;
exports.getPostById = getPostById;
exports.getPostsByUser = getPostsByUser;
exports.deletePost = deletePost;
exports.rebuildFeed = rebuildFeed;
const post_service_1 = require("../services/post.service");
/**
 * POST /api/posts - Criar post
 */
async function createPost(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { type, content, mediaUrl, bookId, chapterId, sharedPostId } = req.body;
        // Validação do tipo
        const validTypes = ['TEXT', 'IMAGE', 'BOOK_UPDATE', 'CHAPTER_PREVIEW', 'AUDIO_PREVIEW', 'POLL', 'SHARED'];
        if (!validTypes.includes(type)) {
            res.status(400).json({
                error: 'Tipo de post inválido',
                validTypes
            });
            return;
        }
        // Validação do conteúdo
        if (!content || typeof content !== 'string') {
            res.status(400).json({ error: 'O conteúdo do post é obrigatório' });
            return;
        }
        if (content.length > 2000) {
            res.status(400).json({ error: 'O conteúdo do post não pode exceder 2000 caracteres' });
            return;
        }
        const post = await post_service_1.postService.create(userId, {
            type,
            content,
            mediaUrl,
            bookId,
            chapterId,
            sharedPostId,
        });
        res.status(201).json(post);
    }
    catch (error) {
        console.error('[PostController] Erro ao criar post:', error.message);
        res.status(400).json({ error: error.message });
    }
}
/**
 * GET /api/posts/feed - Feed personalizado
 */
async function getFeed(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const result = await post_service_1.postService.getFeed(userId, page, limit);
        res.json({
            posts: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasMore: result.hasMore,
            },
        });
    }
    catch (error) {
        console.error('[PostController] Erro ao buscar feed:', error.message);
        res.status(500).json({ error: 'Erro ao buscar feed' });
    }
}
/**
 * GET /api/posts/explore - Posts em destaque
 */
async function getExplore(req, res) {
    try {
        const userId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const result = await post_service_1.postService.getExplore(page, limit, userId);
        res.json({
            posts: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasMore: result.hasMore,
            },
        });
    }
    catch (error) {
        console.error('[PostController] Erro ao buscar explore:', error.message);
        res.status(500).json({ error: 'Erro ao buscar posts em destaque' });
    }
}
/**
 * GET /api/posts/:id - Detalhes do post
 */
async function getPostById(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const post = await post_service_1.postService.getById(id, userId);
        res.json(post);
    }
    catch (error) {
        console.error('[PostController] Erro ao buscar post:', error.message);
        if (error.message.includes('não encontrado')) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao buscar post' });
        }
    }
}
/**
 * GET /api/posts/user/:userId - Posts de um usuário
 */
async function getPostsByUser(req, res) {
    try {
        const { userId: targetUserId } = req.params;
        const currentUserId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const result = await post_service_1.postService.getByUser(targetUserId, page, limit, currentUserId);
        res.json({
            posts: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasMore: result.hasMore,
            },
        });
    }
    catch (error) {
        console.error('[PostController] Erro ao buscar posts do usuário:', error.message);
        res.status(500).json({ error: 'Erro ao buscar posts do usuário' });
    }
}
/**
 * DELETE /api/posts/:id - Excluir post
 */
async function deletePost(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        await post_service_1.postService.delete(id, userId, isAdmin);
        res.status(204).send();
    }
    catch (error) {
        console.error('[PostController] Erro ao deletar post:', error.message);
        if (error.message.includes('não encontrado')) {
            res.status(404).json({ error: error.message });
        }
        else if (error.message.includes('permissão')) {
            res.status(403).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao deletar post' });
        }
    }
}
/**
 * POST /api/posts/:id/rebuild-feed - Reconstruir feed do usuário
 */
async function rebuildFeed(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        await post_service_1.postService.rebuildFeed(userId);
        res.json({ message: 'Feed reconstruído com sucesso' });
    }
    catch (error) {
        console.error('[PostController] Erro ao reconstruir feed:', error.message);
        res.status(500).json({ error: 'Erro ao reconstruir feed' });
    }
}
exports.postController = {
    createPost,
    getFeed,
    getExplore,
    getPostById,
    getPostsByUser,
    deletePost,
    rebuildFeed,
};
