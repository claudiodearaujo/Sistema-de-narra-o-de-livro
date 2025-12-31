"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notification_service_1 = require("./notification.service");
const livra_service_1 = require("./livra.service");
const achievement_service_1 = require("./achievement.service");
// Include para campanhas
const campaignInclude = {
    group: {
        select: {
            id: true,
            name: true,
            coverUrl: true,
        },
    },
    books: {
        include: {
            book: {
                select: {
                    id: true,
                    title: true,
                    author: true,
                    coverUrl: true,
                },
            },
        },
        orderBy: {
            orderIndex: 'asc',
        },
    },
    _count: {
        select: {
            progress: true,
        },
    },
};
// Include para progresso
const progressInclude = {
    user: {
        select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
        },
    },
    campaign: {
        select: {
            id: true,
            name: true,
            livraReward: true,
        },
    },
};
class CampaignService {
    /**
     * Lista campanhas de um grupo
     */
    async getCampaignsByGroup(groupId, page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = {
            groupId,
            ...(status && { status }),
        };
        const [campaigns, total] = await Promise.all([
            prisma_1.default.readingCampaign.findMany({
                where,
                include: campaignInclude,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.readingCampaign.count({ where }),
        ]);
        return {
            data: campaigns,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + campaigns.length < total,
        };
    }
    /**
     * Obtém detalhes de uma campanha
     */
    async getById(campaignId, userId) {
        const campaign = await prisma_1.default.readingCampaign.findUnique({
            where: { id: campaignId },
            include: campaignInclude,
        });
        if (!campaign)
            return null;
        let userProgress;
        if (userId) {
            const progress = await prisma_1.default.campaignProgress.findUnique({
                where: { campaignId_userId: { campaignId, userId } },
                include: progressInclude,
            });
            userProgress = progress || undefined;
        }
        return {
            ...campaign,
            userProgress,
            totalBooks: campaign.books.length,
        };
    }
    /**
     * Cria uma nova campanha
     */
    async create(groupId, userId, data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('O nome da campanha é obrigatório');
        }
        if (data.bookIds.length === 0) {
            throw new Error('A campanha deve ter pelo menos um livro');
        }
        // Verificar permissão no grupo
        const membership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership) {
            throw new Error('Você não é membro deste grupo');
        }
        if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
            throw new Error('Você não tem permissão para criar campanhas');
        }
        // Verificar se livros existem
        const books = await prisma_1.default.book.findMany({
            where: { id: { in: data.bookIds } },
            select: { id: true },
        });
        if (books.length !== data.bookIds.length) {
            throw new Error('Um ou mais livros não foram encontrados');
        }
        // Criar campanha
        const campaign = await prisma_1.default.readingCampaign.create({
            data: {
                groupId,
                name: data.name.trim(),
                description: data.description?.trim(),
                status: data.startDate && data.startDate <= new Date() ? 'ACTIVE' : 'DRAFT',
                startDate: data.startDate,
                endDate: data.endDate,
                livraReward: data.livraReward || 50,
                books: {
                    create: data.bookIds.map((bookId, index) => ({
                        bookId,
                        orderIndex: index,
                    })),
                },
            },
            include: campaignInclude,
        });
        // Notificar membros do grupo
        const members = await prisma_1.default.groupMember.findMany({
            where: { groupId, userId: { not: userId } },
            select: { userId: true },
        });
        for (const member of members) {
            await notification_service_1.notificationService.create({
                userId: member.userId,
                type: 'SYSTEM',
                title: 'Nova campanha de leitura',
                message: `Uma nova campanha "${campaign.name}" foi criada no grupo`,
                data: { campaignId: campaign.id, groupId },
            });
        }
        return campaign;
    }
    /**
     * Atualiza uma campanha
     */
    async update(campaignId, userId, data) {
        const campaign = await prisma_1.default.readingCampaign.findUnique({
            where: { id: campaignId },
            select: { groupId: true, status: true },
        });
        if (!campaign) {
            throw new Error('Campanha não encontrada');
        }
        // Verificar permissão no grupo
        const membership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId: campaign.groupId, userId } },
        });
        if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
            throw new Error('Você não tem permissão para editar esta campanha');
        }
        // Não pode editar campanha concluída
        if (campaign.status === 'COMPLETED') {
            throw new Error('Não é possível editar uma campanha concluída');
        }
        const updated = await prisma_1.default.readingCampaign.update({
            where: { id: campaignId },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.description !== undefined && { description: data.description?.trim() }),
                ...(data.status && { status: data.status }),
                ...(data.startDate !== undefined && { startDate: data.startDate }),
                ...(data.endDate !== undefined && { endDate: data.endDate }),
                ...(data.livraReward !== undefined && { livraReward: data.livraReward }),
            },
            include: campaignInclude,
        });
        return updated;
    }
    /**
     * Deleta uma campanha
     */
    async delete(campaignId, userId) {
        const campaign = await prisma_1.default.readingCampaign.findUnique({
            where: { id: campaignId },
            select: { groupId: true },
        });
        if (!campaign) {
            throw new Error('Campanha não encontrada');
        }
        // Verificar se é owner do grupo
        const group = await prisma_1.default.group.findUnique({
            where: { id: campaign.groupId },
            select: { ownerId: true },
        });
        if (group?.ownerId !== userId) {
            throw new Error('Apenas o dono do grupo pode deletar campanhas');
        }
        await prisma_1.default.readingCampaign.delete({
            where: { id: campaignId },
        });
    }
    /**
     * Participa de uma campanha
     */
    async joinCampaign(campaignId, userId) {
        const campaign = await prisma_1.default.readingCampaign.findUnique({
            where: { id: campaignId },
            select: { id: true, groupId: true, status: true },
        });
        if (!campaign) {
            throw new Error('Campanha não encontrada');
        }
        if (campaign.status !== 'ACTIVE') {
            throw new Error('Esta campanha não está ativa');
        }
        // Verificar se é membro do grupo
        const membership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId: campaign.groupId, userId } },
        });
        if (!membership) {
            throw new Error('Você precisa ser membro do grupo para participar da campanha');
        }
        // Verificar se já participa
        const existing = await prisma_1.default.campaignProgress.findUnique({
            where: { campaignId_userId: { campaignId, userId } },
        });
        if (existing) {
            throw new Error('Você já está participando desta campanha');
        }
        const progress = await prisma_1.default.campaignProgress.create({
            data: {
                campaignId,
                userId,
                booksRead: 0,
                isCompleted: false,
            },
            include: progressInclude,
        });
        return progress;
    }
    /**
     * Obtém progresso do usuário em uma campanha
     */
    async getProgress(campaignId, userId) {
        const [progress, campaign] = await Promise.all([
            prisma_1.default.campaignProgress.findUnique({
                where: { campaignId_userId: { campaignId, userId } },
                include: progressInclude,
            }),
            prisma_1.default.readingCampaign.findUnique({
                where: { id: campaignId },
                select: {
                    _count: { select: { books: true } },
                },
            }),
        ]);
        if (!progress || !campaign)
            return null;
        const totalBooks = campaign._count.books;
        const percentComplete = totalBooks > 0 ? Math.round((progress.booksRead / totalBooks) * 100) : 0;
        return {
            ...progress,
            totalBooks,
            percentComplete,
        };
    }
    /**
     * Obtém ranking de progresso de uma campanha
     */
    async getCampaignLeaderboard(campaignId, limit = 10) {
        const leaderboard = await prisma_1.default.campaignProgress.findMany({
            where: { campaignId },
            include: progressInclude,
            orderBy: [{ booksRead: 'desc' }, { updatedAt: 'asc' }],
            take: limit,
        });
        return leaderboard;
    }
    /**
     * Marca um livro como lido na campanha
     */
    async completeBook(campaignId, bookId, userId) {
        const campaign = await prisma_1.default.readingCampaign.findUnique({
            where: { id: campaignId },
            include: {
                books: { select: { bookId: true } },
            },
        });
        if (!campaign) {
            throw new Error('Campanha não encontrada');
        }
        if (campaign.status !== 'ACTIVE') {
            throw new Error('Esta campanha não está ativa');
        }
        // Verificar se o livro faz parte da campanha
        const bookInCampaign = campaign.books.find((b) => b.bookId === bookId);
        if (!bookInCampaign) {
            throw new Error('Este livro não faz parte da campanha');
        }
        // Buscar progresso atual
        let progress = await prisma_1.default.campaignProgress.findUnique({
            where: { campaignId_userId: { campaignId, userId } },
        });
        if (!progress) {
            // Auto-join na campanha
            progress = await prisma_1.default.campaignProgress.create({
                data: {
                    campaignId,
                    userId,
                    booksRead: 0,
                    isCompleted: false,
                },
            });
        }
        // Incrementar livros lidos
        const totalBooks = campaign.books.length;
        const newBooksRead = progress.booksRead + 1;
        const isNowCompleted = newBooksRead >= totalBooks;
        const updatedProgress = await prisma_1.default.campaignProgress.update({
            where: { campaignId_userId: { campaignId, userId } },
            data: {
                booksRead: newBooksRead,
                isCompleted: isNowCompleted,
                ...(isNowCompleted && { completedAt: new Date() }),
            },
            include: progressInclude,
        });
        let rewardEarned;
        // Se completou a campanha, dar recompensa
        if (isNowCompleted && campaign.livraReward > 0) {
            await livra_service_1.livraService.addLivras(userId, {
                type: 'EARNED_CAMPAIGN',
                amount: campaign.livraReward,
                metadata: {
                    campaignId,
                    campaignName: campaign.name,
                },
            });
            rewardEarned = campaign.livraReward;
            // Verificar conquista de campanhas completadas
            await achievement_service_1.achievementService.checkAndUnlock(userId, 'campaigns_completed');
            // Notificar
            await notification_service_1.notificationService.create({
                userId,
                type: 'ACHIEVEMENT',
                title: 'Campanha Concluída! 🎉',
                message: `Você completou a campanha "${campaign.name}" e ganhou ${campaign.livraReward} Livras!`,
                data: { campaignId, livrasEarned: campaign.livraReward },
            });
        }
        return { ...updatedProgress, rewardEarned };
    }
    /**
     * Lista campanhas ativas do usuário (que ele está participando)
     */
    async getMyCampaigns(userId, page = 1, limit = 20, showCompleted = false) {
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(!showCompleted && { isCompleted: false }),
        };
        const [progressList, total] = await Promise.all([
            prisma_1.default.campaignProgress.findMany({
                where,
                include: {
                    ...progressInclude,
                    campaign: {
                        include: campaignInclude,
                    },
                },
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
            prisma_1.default.campaignProgress.count({ where }),
        ]);
        return {
            data: progressList,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + progressList.length < total,
        };
    }
}
exports.campaignService = new CampaignService();
