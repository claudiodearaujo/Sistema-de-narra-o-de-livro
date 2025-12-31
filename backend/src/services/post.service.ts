import prisma from '../lib/prisma';
import { PostType, Prisma } from '@prisma/client';
import { redisService } from '../lib/redis';
import { feedService } from './feed.service';

export interface CreatePostDto {
  type: PostType;
  content: string;
  mediaUrl?: string;
  bookId?: string;
  chapterId?: string;
  sharedPostId?: string;
}

export interface UpdatePostDto {
  content?: string;
  mediaUrl?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Include completo para posts
const postInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      role: true,
    },
  },
  book: {
    select: {
      id: true,
      title: true,
      coverUrl: true,
      author: true,
    },
  },
  chapter: {
    select: {
      id: true,
      title: true,
      orderIndex: true,
    },
  },
  sharedPost: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  },
  _count: {
    select: {
      comments: true,
      likes: true,
    },
  },
} satisfies Prisma.PostInclude;

export type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

class PostService {
  /**
   * Cria um novo post
   */
  async create(userId: string, data: CreatePostDto): Promise<PostWithRelations> {
    // Validações
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('O conteúdo do post é obrigatório');
    }

    if (data.content.length > 2000) {
      throw new Error('O conteúdo do post não pode exceder 2000 caracteres');
    }

    // Validações de tipo
    if (data.type === 'BOOK_UPDATE' && !data.bookId) {
      throw new Error('Para atualização de livro, o bookId é obrigatório');
    }

    if (data.type === 'CHAPTER_PREVIEW' && !data.chapterId) {
      throw new Error('Para preview de capítulo, o chapterId é obrigatório');
    }

    if (data.type === 'SHARED' && !data.sharedPostId) {
      throw new Error('Para compartilhar, o sharedPostId é obrigatório');
    }

    // Verifica se o post compartilhado existe
    if (data.sharedPostId) {
      const sharedPost = await prisma.post.findUnique({
        where: { id: data.sharedPostId },
      });
      if (!sharedPost) {
        throw new Error('Post a ser compartilhado não encontrado');
      }
    }

    // Verifica se o livro existe
    if (data.bookId) {
      const book = await prisma.book.findUnique({
        where: { id: data.bookId },
      });
      if (!book) {
        throw new Error('Livro não encontrado');
      }
    }

    // Verifica se o capítulo existe
    if (data.chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: data.chapterId },
      });
      if (!chapter) {
        throw new Error('Capítulo não encontrado');
      }
    }

    const post = await prisma.post.create({
      data: {
        userId,
        type: data.type,
        content: data.content.trim(),
        mediaUrl: data.mediaUrl,
        bookId: data.bookId,
        chapterId: data.chapterId,
        sharedPostId: data.sharedPostId,
      },
      include: postInclude,
    });

    // Se é um compartilhamento, incrementa o contador do post original
    if (data.sharedPostId) {
      await prisma.post.update({
        where: { id: data.sharedPostId },
        data: { shareCount: { increment: 1 } },
      });
    }

    // Adiciona ao feed dos seguidores (fanout-on-write via FeedService)
    feedService.addPostToFollowerFeeds(post.id, userId, post.createdAt).catch(err => {
      console.error('[PostService] Erro no fanout:', err);
    });

    return post;
  }

  /**
   * Busca um post por ID
   */
  async getById(id: string, userId?: string): Promise<PostWithRelations & { isLiked?: boolean }> {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        ...postInclude,
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post não encontrado');
    }

    // Verifica se o usuário curtiu o post
    let isLiked = false;
    if (userId) {
      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId,
          },
        },
      });
      isLiked = !!like;
    }

    return { ...post, isLiked };
  }

  /**
   * Feed personalizado do usuário
   */
  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<PostWithRelations & { isLiked: boolean }>> {
    const skip = (page - 1) * limit;

    // Tenta buscar do cache Redis primeiro
    try {
      const cachedPostIds = await redisService.getFeed(userId, page, limit);
      if (cachedPostIds && cachedPostIds.length > 0) {
        const posts = await this.getPostsByIds(cachedPostIds, userId);
        const feedSize = await redisService.getFeedSize(userId);
        const totalPages = Math.ceil(feedSize / limit);
        const hasMore = page < totalPages;
        return {
          data: posts,
          total: feedSize,
          page,
          limit,
          totalPages,
          hasMore,
        };
      }
    } catch (err) {
      console.error('[PostService] Redis cache miss ou erro:', err);
    }

    // Fallback: busca do banco
    // Busca IDs de quem o usuário segue
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    // Inclui os próprios posts do usuário
    followingIds.push(userId);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          userId: { in: followingIds },
        },
        include: postInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          userId: { in: followingIds },
        },
      }),
    ]);

    // Verifica quais posts o usuário curtiu
    const likedPosts = await prisma.like.findMany({
      where: {
        userId,
        postId: { in: posts.map(p => p.id) },
      },
      select: { postId: true },
    });

    const likedPostIds = new Set(likedPosts.map(l => l.postId));

    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    return {
      data: postsWithLikes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    };
  }

  /**
   * Posts em destaque (explore)
   */
  async getExplore(page: number = 1, limit: number = 20, userId?: string): Promise<PaginatedResult<PostWithRelations & { isLiked?: boolean }>> {
    const skip = (page - 1) * limit;
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          createdAt: { gte: fortyEightHoursAgo },
        },
        include: postInclude,
        orderBy: [
          { likeCount: 'desc' },
          { commentCount: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          createdAt: { gte: fortyEightHoursAgo },
        },
      }),
    ]);

    // Verifica quais posts o usuário curtiu
    let likedPostIds = new Set<string>();
    if (userId) {
      const likedPosts = await prisma.like.findMany({
        where: {
          userId,
          postId: { in: posts.map(p => p.id) },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likedPosts.map(l => l.postId));
    }

    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: userId ? likedPostIds.has(post.id) : undefined,
    }));

    return {
      data: postsWithLikes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    };
  }

  /**
   * Posts de um usuário específico
   */
  async getByUser(targetUserId: string, page: number = 1, limit: number = 20, currentUserId?: string): Promise<PaginatedResult<PostWithRelations & { isLiked?: boolean }>> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { userId: targetUserId },
        include: postInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: { userId: targetUserId },
      }),
    ]);

    // Verifica quais posts o usuário curtiu
    let likedPostIds = new Set<string>();
    if (currentUserId) {
      const likedPosts = await prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map(p => p.id) },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likedPosts.map(l => l.postId));
    }

    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: currentUserId ? likedPostIds.has(post.id) : undefined,
    }));

    return {
      data: postsWithLikes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    };
  }

  /**
   * Deleta um post
   */
  async delete(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!post) {
      throw new Error('Post não encontrado');
    }

    if (post.userId !== userId && !isAdmin) {
      throw new Error('Você não tem permissão para deletar este post');
    }

    await prisma.post.delete({
      where: { id },
    });

    // Remove do feed dos seguidores via FeedService
    feedService.removePostFromFeeds(id, post.userId).catch(err => {
      console.error('[PostService] Erro ao remover do feed:', err);
    });
  }

  /**
   * Busca posts por IDs (mantendo ordem)
   */
  private async getPostsByIds(ids: string[], userId?: string): Promise<(PostWithRelations & { isLiked: boolean })[]> {
    const posts = await prisma.post.findMany({
      where: { id: { in: ids } },
      include: postInclude,
    });

    // Ordena pelos IDs originais
    const postMap = new Map(posts.map(p => [p.id, p]));
    const orderedPosts = ids.map(id => postMap.get(id)).filter(Boolean) as PostWithRelations[];

    // Verifica quais posts o usuário curtiu
    let likedPostIds = new Set<string>();
    if (userId) {
      const likedPosts = await prisma.like.findMany({
        where: {
          userId,
          postId: { in: ids },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likedPosts.map(l => l.postId));
    }

    return orderedPosts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));
  }

  /**
   * Reconstrói o feed de um usuário
   */
  async rebuildFeed(userId: string): Promise<void> {
    // Invalida o cache atual
    await redisService.invalidateFeed(userId);

    // Busca quem o usuário segue
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    // Busca os últimos 500 posts
    const posts = await prisma.post.findMany({
      where: {
        userId: { in: followingIds },
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Popula o cache
    for (const post of posts) {
      await redisService.addToFeed(userId, post.id, post.createdAt.getTime());
    }
  }
}

export const postService = new PostService();
