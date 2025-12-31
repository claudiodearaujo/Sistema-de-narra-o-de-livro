import prisma from '../lib/prisma';
import { redisService } from '../lib/redis';
import { PostWithRelations } from './post.service';

/**
 * Service para gerenciamento de feed com cache Redis
 * Implementa o padrão fanout-on-write para performance
 */
class FeedService {
  // Configurações
  private readonly FEED_TTL = 24 * 60 * 60; // 24 horas em segundos
  private readonly MAX_FEED_SIZE = 500;
  private readonly FANOUT_LIMIT = 10000; // Limite de seguidores para fanout

  /**
   * Busca o feed de um usuário do cache ou banco
   */
  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<{
    postIds: string[];
    fromCache: boolean;
  }> {
    try {
      // Tenta buscar do Redis
      const cachedPostIds = await redisService.getFeed(userId, page, limit);
      
      if (cachedPostIds && cachedPostIds.length > 0) {
        return {
          postIds: cachedPostIds,
          fromCache: true,
        };
      }
    } catch (error) {
      console.error('[FeedService] Erro ao buscar do Redis:', error);
    }

    // Fallback: busca do banco e popula cache
    const postIds = await this.getPostIdsFromDatabase(userId, page, limit);
    
    // Popula o cache em background
    this.warmCache(userId).catch(err => {
      console.error('[FeedService] Erro ao aquecer cache:', err);
    });

    return {
      postIds,
      fromCache: false,
    };
  }

  /**
   * Adiciona um post ao feed de todos os seguidores (fanout-on-write)
   */
  async addPostToFollowerFeeds(postId: string, authorId: string, timestamp: Date): Promise<void> {
    // Busca todos os seguidores
    const followers = await prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });

    // Verifica limite de fanout
    if (followers.length > this.FANOUT_LIMIT) {
      console.log(`[FeedService] Fanout limitado para autor ${authorId} (${followers.length} seguidores)`);
      // Para autores com muitos seguidores, não fazemos fanout
      // O feed será construído on-read
      return;
    }

    const score = timestamp.getTime();
    const followerIds = followers.map(f => f.followerId);
    
    // Inclui o próprio autor
    followerIds.push(authorId);

    // Usa batch para melhor performance
    const batchSize = 100;
    for (let i = 0; i < followerIds.length; i += batchSize) {
      const batch = followerIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (followerId) => {
          try {
            await redisService.addToFeed(followerId, postId, score);
            // Limita o tamanho do feed
            await this.trimFeed(followerId);
          } catch (error) {
            console.error(`[FeedService] Erro ao adicionar ao feed de ${followerId}:`, error);
          }
        })
      );
    }
  }

  /**
   * Remove um post dos feeds de todos os seguidores
   */
  async removePostFromFeeds(postId: string, authorId: string): Promise<void> {
    const followers = await prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });

    const followerIds = followers.map(f => f.followerId);
    followerIds.push(authorId);

    const batchSize = 100;
    for (let i = 0; i < followerIds.length; i += batchSize) {
      const batch = followerIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(followerId =>
          redisService.removeFromFeed(followerId, postId).catch(err => {
            console.error(`[FeedService] Erro ao remover do feed de ${followerId}:`, err);
          })
        )
      );
    }
  }

  /**
   * Reconstrói o feed de um usuário do zero
   */
  async rebuildFeed(userId: string): Promise<number> {
    // Invalida o cache atual
    await redisService.invalidateFeed(userId);

    // Busca quem o usuário segue
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    // Busca os últimos N posts
    const posts = await prisma.post.findMany({
      where: {
        userId: { in: followingIds },
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.MAX_FEED_SIZE,
    });

    // Popula o cache
    for (const post of posts) {
      await redisService.addToFeed(userId, post.id, post.createdAt.getTime());
    }

    console.log(`[FeedService] Feed reconstruído para ${userId}: ${posts.length} posts`);
    return posts.length;
  }

  /**
   * Aquece o cache do feed de um usuário
   */
  async warmCache(userId: string): Promise<void> {
    // Verifica se o cache já existe
    const cached = await redisService.getFeed(userId, 1, 1);
    if (cached && cached.length > 0) {
      return; // Cache já aquecido
    }

    await this.rebuildFeed(userId);
  }

  /**
   * Limita o tamanho do feed para MAX_FEED_SIZE
   */
  private async trimFeed(userId: string): Promise<void> {
    try {
      // Remove posts além do limite (mantém os mais recentes)
      const client = await redisService.getClient();
      if (client) {
        const key = `feed:${userId}`;
        // ZREMRANGEBYRANK remove os elementos com menor score (mais antigos)
        // -MAX_FEED_SIZE-1 mantém os últimos MAX_FEED_SIZE elementos
        await client.zremrangebyrank(key, 0, -(this.MAX_FEED_SIZE + 1));
      }
    } catch (error) {
      console.error(`[FeedService] Erro ao limitar feed de ${userId}:`, error);
    }
  }

  /**
   * Busca IDs de posts do banco de dados
   */
  private async getPostIdsFromDatabase(userId: string, page: number, limit: number): Promise<string[]> {
    const skip = (page - 1) * limit;

    // Busca quem o usuário segue
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    const posts = await prisma.post.findMany({
      where: {
        userId: { in: followingIds },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return posts.map(p => p.id);
  }

  /**
   * Evento: usuário começou a seguir alguém
   * Atualiza o feed para incluir posts do novo seguido
   */
  async onFollow(followerId: string, followingId: string): Promise<void> {
    // Busca os posts recentes do novo seguido
    const posts = await prisma.post.findMany({
      where: { userId: followingId },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Últimos 50 posts
    });

    // Adiciona ao feed do seguidor
    for (const post of posts) {
      await redisService.addToFeed(followerId, post.id, post.createdAt.getTime());
    }

    // Limita o feed
    await this.trimFeed(followerId);
  }

  /**
   * Evento: usuário deixou de seguir alguém
   * Remove os posts do ex-seguido do feed
   */
  async onUnfollow(followerId: string, unfollowedId: string): Promise<void> {
    // Busca os posts do ex-seguido que estão no feed
    const posts = await prisma.post.findMany({
      where: { userId: unfollowedId },
      select: { id: true },
    });

    // Remove do feed
    for (const post of posts) {
      await redisService.removeFromFeed(followerId, post.id);
    }
  }
}

export const feedService = new FeedService();
