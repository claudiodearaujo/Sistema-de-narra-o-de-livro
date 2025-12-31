"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notification_service_1 = require("./notification.service");
const achievement_service_1 = require("./achievement.service");
// Include para grupos
const groupInclude = {
    owner: {
        select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
        },
    },
    _count: {
        select: {
            members: true,
            campaigns: true,
        },
    },
};
// Include para membros
const memberInclude = {
    user: {
        select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            role: true,
        },
    },
};
class GroupService {
    /**
     * Lista grupos para descoberta (públicos)
     */
    async discoverGroups(userId, page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = {
            privacy: 'PUBLIC',
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [groups, total] = await Promise.all([
            prisma_1.default.group.findMany({
                where,
                include: groupInclude,
                skip,
                take: limit,
                orderBy: { memberCount: 'desc' },
            }),
            prisma_1.default.group.count({ where }),
        ]);
        // Se usuário logado, verificar quais grupos ele é membro
        let memberGroupIds = [];
        if (userId) {
            const memberships = await prisma_1.default.groupMember.findMany({
                where: {
                    userId,
                    groupId: { in: groups.map((g) => g.id) },
                },
                select: { groupId: true },
            });
            memberGroupIds = memberships.map((m) => m.groupId);
        }
        const data = groups.map((group) => ({
            ...group,
            isMember: memberGroupIds.includes(group.id),
        }));
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + groups.length < total,
        };
    }
    /**
     * Lista grupos do usuário (que ele é membro)
     */
    async getMyGroups(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [memberships, total] = await Promise.all([
            prisma_1.default.groupMember.findMany({
                where: { userId },
                include: {
                    group: {
                        include: groupInclude,
                    },
                },
                skip,
                take: limit,
                orderBy: { joinedAt: 'desc' },
            }),
            prisma_1.default.groupMember.count({ where: { userId } }),
        ]);
        const data = memberships.map((m) => ({
            ...m.group,
            role: m.role,
        }));
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + memberships.length < total,
        };
    }
    /**
     * Obtém detalhes de um grupo
     */
    async getById(groupId, userId) {
        const group = await prisma_1.default.group.findUnique({
            where: { id: groupId },
            include: groupInclude,
        });
        if (!group)
            return null;
        // Verificar se é público ou se usuário é membro
        if (group.privacy !== 'PUBLIC' && userId) {
            const membership = await prisma_1.default.groupMember.findUnique({
                where: { groupId_userId: { groupId, userId } },
            });
            if (!membership && group.privacy === 'PRIVATE') {
                throw new Error('Este grupo é privado');
            }
            return {
                ...group,
                isMember: !!membership,
                memberRole: membership?.role,
            };
        }
        let isMember = false;
        let memberRole;
        if (userId) {
            const membership = await prisma_1.default.groupMember.findUnique({
                where: { groupId_userId: { groupId, userId } },
            });
            isMember = !!membership;
            memberRole = membership?.role;
        }
        return { ...group, isMember, memberRole };
    }
    /**
     * Cria um novo grupo
     */
    async create(userId, data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('O nome do grupo é obrigatório');
        }
        if (data.name.length > 100) {
            throw new Error('O nome do grupo não pode exceder 100 caracteres');
        }
        // Criar grupo e adicionar criador como OWNER
        const group = await prisma_1.default.$transaction(async (tx) => {
            const newGroup = await tx.group.create({
                data: {
                    name: data.name.trim(),
                    description: data.description?.trim(),
                    coverUrl: data.coverUrl,
                    privacy: data.privacy || 'PUBLIC',
                    ownerId: userId,
                    memberCount: 1,
                },
                include: groupInclude,
            });
            // Adicionar owner como membro
            await tx.groupMember.create({
                data: {
                    groupId: newGroup.id,
                    userId,
                    role: 'OWNER',
                },
            });
            return newGroup;
        });
        // Verificar conquista de grupos (criar também conta como participar)
        await achievement_service_1.achievementService.checkAndUnlock(userId, 'groups_joined');
        return group;
    }
    /**
     * Atualiza um grupo
     */
    async update(groupId, userId, data) {
        // Verificar permissão
        await this.checkPermission(groupId, userId, ['OWNER', 'ADMIN']);
        const group = await prisma_1.default.group.update({
            where: { id: groupId },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.description !== undefined && { description: data.description?.trim() }),
                ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
                ...(data.privacy && { privacy: data.privacy }),
            },
            include: groupInclude,
        });
        return group;
    }
    /**
     * Deleta um grupo
     */
    async delete(groupId, userId) {
        // Verificar se é owner
        const group = await prisma_1.default.group.findUnique({
            where: { id: groupId },
            select: { ownerId: true },
        });
        if (!group) {
            throw new Error('Grupo não encontrado');
        }
        if (group.ownerId !== userId) {
            throw new Error('Apenas o dono do grupo pode deletá-lo');
        }
        await prisma_1.default.group.delete({
            where: { id: groupId },
        });
    }
    /**
     * Entrar em um grupo
     */
    async join(groupId, userId) {
        const group = await prisma_1.default.group.findUnique({
            where: { id: groupId },
            select: { id: true, privacy: true, ownerId: true },
        });
        if (!group) {
            throw new Error('Grupo não encontrado');
        }
        if (group.privacy === 'INVITE_ONLY') {
            throw new Error('Este grupo aceita apenas convites');
        }
        // Verificar se já é membro
        const existingMembership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (existingMembership) {
            throw new Error('Você já é membro deste grupo');
        }
        // Adicionar como membro
        const [membership] = await prisma_1.default.$transaction([
            prisma_1.default.groupMember.create({
                data: {
                    groupId,
                    userId,
                    role: 'MEMBER',
                },
                include: memberInclude,
            }),
            prisma_1.default.group.update({
                where: { id: groupId },
                data: { memberCount: { increment: 1 } },
            }),
        ]);
        // Verificar conquista de entrar em grupo
        await achievement_service_1.achievementService.checkAndUnlock(userId, 'groups_joined');
        // Notificar owner
        await notification_service_1.notificationService.create({
            userId: group.ownerId,
            type: 'SYSTEM',
            title: 'Novo membro',
            message: `Um novo membro entrou no seu grupo`,
            data: { groupId, memberId: userId },
        });
        return membership;
    }
    /**
     * Sair de um grupo
     */
    async leave(groupId, userId) {
        const group = await prisma_1.default.group.findUnique({
            where: { id: groupId },
            select: { ownerId: true },
        });
        if (!group) {
            throw new Error('Grupo não encontrado');
        }
        if (group.ownerId === userId) {
            throw new Error('O dono do grupo não pode sair. Transfira a propriedade ou delete o grupo.');
        }
        const membership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership) {
            throw new Error('Você não é membro deste grupo');
        }
        await prisma_1.default.$transaction([
            prisma_1.default.groupMember.delete({
                where: { groupId_userId: { groupId, userId } },
            }),
            prisma_1.default.group.update({
                where: { id: groupId },
                data: { memberCount: { decrement: 1 } },
            }),
        ]);
    }
    /**
     * Lista membros do grupo
     */
    async getMembers(groupId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [members, total] = await Promise.all([
            prisma_1.default.groupMember.findMany({
                where: { groupId },
                include: memberInclude,
                skip,
                take: limit,
                orderBy: [
                    { role: 'asc' }, // OWNER primeiro, depois ADMIN, etc
                    { joinedAt: 'asc' },
                ],
            }),
            prisma_1.default.groupMember.count({ where: { groupId } }),
        ]);
        return {
            data: members,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + members.length < total,
        };
    }
    /**
     * Atualiza role de um membro
     */
    async updateMemberRole(groupId, targetUserId, newRole, actorUserId) {
        // Verificar permissão do ator
        await this.checkPermission(groupId, actorUserId, ['OWNER', 'ADMIN']);
        const group = await prisma_1.default.group.findUnique({
            where: { id: groupId },
            select: { ownerId: true },
        });
        if (!group) {
            throw new Error('Grupo não encontrado');
        }
        // Não pode mudar role do owner
        if (targetUserId === group.ownerId) {
            throw new Error('Não é possível alterar a role do dono do grupo');
        }
        // Verificar se target é membro
        const targetMembership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: targetUserId } },
        });
        if (!targetMembership) {
            throw new Error('Usuário não é membro do grupo');
        }
        // Apenas owner pode promover para ADMIN ou OWNER
        const actorMembership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: actorUserId } },
        });
        if ((newRole === 'ADMIN' || newRole === 'OWNER') &&
            actorMembership?.role !== 'OWNER') {
            throw new Error('Apenas o dono pode promover para Admin ou Owner');
        }
        // Se promovendo para OWNER, transferir propriedade
        if (newRole === 'OWNER') {
            await prisma_1.default.$transaction([
                // Novo owner
                prisma_1.default.groupMember.update({
                    where: { groupId_userId: { groupId, userId: targetUserId } },
                    data: { role: 'OWNER' },
                }),
                // Antigo owner vira admin
                prisma_1.default.groupMember.update({
                    where: { groupId_userId: { groupId, userId: actorUserId } },
                    data: { role: 'ADMIN' },
                }),
                // Atualizar owner no grupo
                prisma_1.default.group.update({
                    where: { id: groupId },
                    data: { ownerId: targetUserId },
                }),
            ]);
        }
        else {
            await prisma_1.default.groupMember.update({
                where: { groupId_userId: { groupId, userId: targetUserId } },
                data: { role: newRole },
            });
        }
        const updatedMember = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: targetUserId } },
            include: memberInclude,
        });
        return updatedMember;
    }
    /**
     * Remove um membro do grupo
     */
    async removeMember(groupId, targetUserId, actorUserId) {
        // Verificar permissão
        await this.checkPermission(groupId, actorUserId, ['OWNER', 'ADMIN', 'MODERATOR']);
        const group = await prisma_1.default.group.findUnique({
            where: { id: groupId },
            select: { ownerId: true },
        });
        if (!group) {
            throw new Error('Grupo não encontrado');
        }
        // Não pode remover o owner
        if (targetUserId === group.ownerId) {
            throw new Error('Não é possível remover o dono do grupo');
        }
        // Verificar hierarquia
        const [actorMembership, targetMembership] = await Promise.all([
            prisma_1.default.groupMember.findUnique({
                where: { groupId_userId: { groupId, userId: actorUserId } },
            }),
            prisma_1.default.groupMember.findUnique({
                where: { groupId_userId: { groupId, userId: targetUserId } },
            }),
        ]);
        if (!targetMembership) {
            throw new Error('Usuário não é membro do grupo');
        }
        // Hierarquia: OWNER > ADMIN > MODERATOR > MEMBER
        const hierarchy = { OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1 };
        if (hierarchy[actorMembership.role] <= hierarchy[targetMembership.role]) {
            throw new Error('Você não tem permissão para remover este membro');
        }
        await prisma_1.default.$transaction([
            prisma_1.default.groupMember.delete({
                where: { groupId_userId: { groupId, userId: targetUserId } },
            }),
            prisma_1.default.group.update({
                where: { id: groupId },
                data: { memberCount: { decrement: 1 } },
            }),
        ]);
    }
    /**
     * Verifica permissão do usuário no grupo
     */
    async checkPermission(groupId, userId, allowedRoles) {
        const membership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership) {
            throw new Error('Você não é membro deste grupo');
        }
        if (!allowedRoles.includes(membership.role)) {
            throw new Error('Você não tem permissão para esta ação');
        }
    }
}
exports.groupService = new GroupService();
