import prisma from '../lib/prisma';
import { GroupPrivacy, GroupRole, Prisma } from '@prisma/client';
import { notificationService } from './notification.service';
import { livraService } from './livra.service';
import { achievementService } from './achievement.service';

export interface CreateGroupDto {
  name: string;
  description?: string;
  coverUrl?: string;
  privacy?: GroupPrivacy;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  coverUrl?: string;
  privacy?: GroupPrivacy;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

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
} satisfies Prisma.GroupInclude;

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
} satisfies Prisma.GroupMemberInclude;

export type GroupWithRelations = Prisma.GroupGetPayload<{ include: typeof groupInclude }>;
export type MemberWithUser = Prisma.GroupMemberGetPayload<{ include: typeof memberInclude }>;

class GroupService {
  /**
   * Lista grupos para descoberta (públicos)
   */
  async discoverGroups(
    userId: string | null,
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<PaginatedResult<GroupWithRelations & { isMember?: boolean }>> {
    const skip = (page - 1) * limit;

    const where: Prisma.GroupWhereInput = {
      privacy: 'PUBLIC',
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: groupInclude,
        skip,
        take: limit,
        orderBy: { memberCount: 'desc' },
      }),
      prisma.group.count({ where }),
    ]);

    // Se usuário logado, verificar quais grupos ele é membro
    let memberGroupIds: string[] = [];
    if (userId) {
      const memberships = await prisma.groupMember.findMany({
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
  async getMyGroups(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<GroupWithRelations & { role: GroupRole }>> {
    const skip = (page - 1) * limit;

    const [memberships, total] = await Promise.all([
      prisma.groupMember.findMany({
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
      prisma.groupMember.count({ where: { userId } }),
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
  async getById(
    groupId: string,
    userId?: string
  ): Promise<(GroupWithRelations & { isMember: boolean; memberRole?: GroupRole }) | null> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: groupInclude,
    });

    if (!group) return null;

    // Verificar se é público ou se usuário é membro
    if (group.privacy !== 'PUBLIC' && userId) {
      const membership = await prisma.groupMember.findUnique({
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
    let memberRole: GroupRole | undefined;

    if (userId) {
      const membership = await prisma.groupMember.findUnique({
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
  async create(userId: string, data: CreateGroupDto): Promise<GroupWithRelations> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('O nome do grupo é obrigatório');
    }

    if (data.name.length > 100) {
      throw new Error('O nome do grupo não pode exceder 100 caracteres');
    }

    // Criar grupo e adicionar criador como OWNER
    const group = await prisma.$transaction(async (tx) => {
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
    await achievementService.checkAndUnlock(userId, 'groups_joined');

    return group;
  }

  /**
   * Atualiza um grupo
   */
  async update(groupId: string, userId: string, data: UpdateGroupDto): Promise<GroupWithRelations> {
    // Verificar permissão
    await this.checkPermission(groupId, userId, ['OWNER', 'ADMIN']);

    const group = await prisma.group.update({
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
  async delete(groupId: string, userId: string): Promise<void> {
    // Verificar se é owner
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    if (group.ownerId !== userId) {
      throw new Error('Apenas o dono do grupo pode deletá-lo');
    }

    await prisma.group.delete({
      where: { id: groupId },
    });
  }

  /**
   * Entrar em um grupo
   */
  async join(groupId: string, userId: string): Promise<MemberWithUser> {
    const group = await prisma.group.findUnique({
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
    const existingMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existingMembership) {
      throw new Error('Você já é membro deste grupo');
    }

    // Adicionar como membro
    const [membership] = await prisma.$transaction([
      prisma.groupMember.create({
        data: {
          groupId,
          userId,
          role: 'MEMBER',
        },
        include: memberInclude,
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    // Verificar conquista de entrar em grupo
    await achievementService.checkAndUnlock(userId, 'groups_joined');

    // Notificar owner
    await notificationService.create({
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
  async leave(groupId: string, userId: string): Promise<void> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    if (group.ownerId === userId) {
      throw new Error('O dono do grupo não pode sair. Transfira a propriedade ou delete o grupo.');
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      throw new Error('Você não é membro deste grupo');
    }

    await prisma.$transaction([
      prisma.groupMember.delete({
        where: { groupId_userId: { groupId, userId } },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);
  }

  /**
   * Lista membros do grupo
   */
  async getMembers(
    groupId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<MemberWithUser>> {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.groupMember.findMany({
        where: { groupId },
        include: memberInclude,
        skip,
        take: limit,
        orderBy: [
          { role: 'asc' }, // OWNER primeiro, depois ADMIN, etc
          { joinedAt: 'asc' },
        ],
      }),
      prisma.groupMember.count({ where: { groupId } }),
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
  async updateMemberRole(
    groupId: string,
    targetUserId: string,
    newRole: GroupRole,
    actorUserId: string
  ): Promise<MemberWithUser> {
    // Verificar permissão do ator
    await this.checkPermission(groupId, actorUserId, ['OWNER', 'ADMIN']);

    const group = await prisma.group.findUnique({
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
    const targetMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw new Error('Usuário não é membro do grupo');
    }

    // Apenas owner pode promover para ADMIN ou OWNER
    const actorMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: actorUserId } },
    });

    if (
      (newRole === 'ADMIN' || newRole === 'OWNER') &&
      actorMembership?.role !== 'OWNER'
    ) {
      throw new Error('Apenas o dono pode promover para Admin ou Owner');
    }

    // Se promovendo para OWNER, transferir propriedade
    if (newRole === 'OWNER') {
      await prisma.$transaction([
        // Novo owner
        prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId: targetUserId } },
          data: { role: 'OWNER' },
        }),
        // Antigo owner vira admin
        prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId: actorUserId } },
          data: { role: 'ADMIN' },
        }),
        // Atualizar owner no grupo
        prisma.group.update({
          where: { id: groupId },
          data: { ownerId: targetUserId },
        }),
      ]);
    } else {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: { role: newRole },
      });
    }

    const updatedMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      include: memberInclude,
    });

    return updatedMember!;
  }

  /**
   * Remove um membro do grupo
   */
  async removeMember(groupId: string, targetUserId: string, actorUserId: string): Promise<void> {
    // Verificar permissão
    await this.checkPermission(groupId, actorUserId, ['OWNER', 'ADMIN', 'MODERATOR']);

    const group = await prisma.group.findUnique({
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
      prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: actorUserId } },
      }),
      prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: targetUserId } },
      }),
    ]);

    if (!targetMembership) {
      throw new Error('Usuário não é membro do grupo');
    }

    // Hierarquia: OWNER > ADMIN > MODERATOR > MEMBER
    const hierarchy = { OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1 };
    if (hierarchy[actorMembership!.role] <= hierarchy[targetMembership.role]) {
      throw new Error('Você não tem permissão para remover este membro');
    }

    await prisma.$transaction([
      prisma.groupMember.delete({
        where: { groupId_userId: { groupId, userId: targetUserId } },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);
  }

  /**
   * Verifica permissão do usuário no grupo
   */
  private async checkPermission(
    groupId: string,
    userId: string,
    allowedRoles: GroupRole[]
  ): Promise<void> {
    const membership = await prisma.groupMember.findUnique({
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

export const groupService = new GroupService();
