"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupController = void 0;
const group_service_1 = require("../services/group.service");
// Helper to get userId from request (uses Express.Request.user from auth middleware)
function getUserId(req) {
    return req.user?.userId;
}
class GroupController {
    /**
     * GET /api/groups
     * Lista grupos públicos para descoberta
     */
    async discoverGroups(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const search = req.query.search;
            const result = await group_service_1.groupService.discoverGroups(getUserId(req) || null, page, limit, search);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao listar grupos:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * GET /api/groups/my
     * Lista grupos do usuário logado
     */
    async getMyGroups(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const result = await group_service_1.groupService.getMyGroups(userId, page, limit);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao listar meus grupos:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * GET /api/groups/:id
     * Obtém detalhes de um grupo
     */
    async getById(req, res) {
        try {
            const id = req.params.id;
            const group = await group_service_1.groupService.getById(id, getUserId(req));
            if (!group) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }
            res.json(group);
        }
        catch (error) {
            console.error('Erro ao obter grupo:', error);
            if (error.message === 'Este grupo é privado') {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * POST /api/groups
     * Cria um novo grupo
     */
    async create(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const { name, description, coverUrl, privacy } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'O nome do grupo é obrigatório' });
            }
            const validPrivacy = ['PUBLIC', 'PRIVATE', 'INVITE_ONLY'].includes(privacy)
                ? privacy
                : undefined;
            const group = await group_service_1.groupService.create(userId, {
                name,
                description,
                coverUrl,
                privacy: validPrivacy,
            });
            res.status(201).json(group);
        }
        catch (error) {
            console.error('Erro ao criar grupo:', error);
            res.status(400).json({ error: error.message || 'Erro ao criar grupo' });
        }
    }
    /**
     * PUT /api/groups/:id
     * Atualiza um grupo
     */
    async update(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const id = req.params.id;
            const { name, description, coverUrl, privacy } = req.body;
            const validPrivacy = ['PUBLIC', 'PRIVATE', 'INVITE_ONLY'].includes(privacy)
                ? privacy
                : undefined;
            const group = await group_service_1.groupService.update(id, userId, {
                name,
                description,
                coverUrl,
                privacy: validPrivacy,
            });
            res.json(group);
        }
        catch (error) {
            console.error('Erro ao atualizar grupo:', error);
            if (error.message.includes('permissão')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao atualizar grupo' });
        }
    }
    /**
     * DELETE /api/groups/:id
     * Deleta um grupo
     */
    async delete(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const id = req.params.id;
            await group_service_1.groupService.delete(id, userId);
            res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao deletar grupo:', error);
            if (error.message.includes('dono')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao deletar grupo' });
        }
    }
    /**
     * POST /api/groups/:id/join
     * Entrar em um grupo
     */
    async join(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const id = req.params.id;
            const membership = await group_service_1.groupService.join(id, userId);
            res.status(201).json(membership);
        }
        catch (error) {
            console.error('Erro ao entrar no grupo:', error);
            if (error.message.includes('convites')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao entrar no grupo' });
        }
    }
    /**
     * DELETE /api/groups/:id/leave
     * Sair de um grupo
     */
    async leave(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const id = req.params.id;
            await group_service_1.groupService.leave(id, userId);
            res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao sair do grupo:', error);
            if (error.message.includes('dono')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao sair do grupo' });
        }
    }
    /**
     * GET /api/groups/:id/members
     * Lista membros do grupo
     */
    async getMembers(req, res) {
        try {
            const id = req.params.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const result = await group_service_1.groupService.getMembers(id, page, limit);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao listar membros:', error);
            res.status(500).json({ error: error.message || 'Erro interno do servidor' });
        }
    }
    /**
     * PUT /api/groups/:id/members/:userId/role
     * Atualiza role de um membro
     */
    async updateMemberRole(req, res) {
        try {
            const currentUserId = getUserId(req);
            if (!currentUserId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const id = req.params.id;
            const userId = req.params.userId;
            const { role } = req.body;
            if (!['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'].includes(role)) {
                return res.status(400).json({ error: 'Role inválida' });
            }
            const member = await group_service_1.groupService.updateMemberRole(id, userId, role, currentUserId);
            res.json(member);
        }
        catch (error) {
            console.error('Erro ao atualizar role:', error);
            if (error.message.includes('permissão') || error.message.includes('dono')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao atualizar role' });
        }
    }
    /**
     * DELETE /api/groups/:id/members/:userId
     * Remove um membro do grupo
     */
    async removeMember(req, res) {
        try {
            const currentUserId = getUserId(req);
            if (!currentUserId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const id = req.params.id;
            const userId = req.params.userId;
            await group_service_1.groupService.removeMember(id, userId, currentUserId);
            res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao remover membro:', error);
            if (error.message.includes('permissão')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(400).json({ error: error.message || 'Erro ao remover membro' });
        }
    }
}
exports.groupController = new GroupController();
