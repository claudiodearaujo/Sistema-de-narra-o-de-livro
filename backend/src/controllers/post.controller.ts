import { Request, Response } from 'express';
import { postService } from '../services/post.service';
import { PostType } from '@prisma/client';

/**
 * POST /api/posts - Criar post
 */
export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { type, content, mediaUrl, bookId, chapterId, sharedPostId } = req.body;

    // Validação do tipo
    const validTypes: PostType[] = ['TEXT', 'IMAGE', 'BOOK_UPDATE', 'CHAPTER_PREVIEW', 'AUDIO_PREVIEW', 'POLL', 'SHARED'];
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

    const post = await postService.create(userId, {
      type,
      content,
      mediaUrl,
      bookId,
      chapterId,
      sharedPostId,
    });

    res.status(201).json(post);
  } catch (error: any) {
    console.error('[PostController] Erro ao criar post:', error.message);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/posts/feed - Feed personalizado
 */
export async function getFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await postService.getFeed(userId, page, limit);

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
  } catch (error: any) {
    console.error('[PostController] Erro ao buscar feed:', error.message);
    res.status(500).json({ error: 'Erro ao buscar feed' });
  }
}

/**
 * GET /api/posts/explore - Posts em destaque
 */
export async function getExplore(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await postService.getExplore(page, limit, userId);

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
  } catch (error: any) {
    console.error('[PostController] Erro ao buscar explore:', error.message);
    res.status(500).json({ error: 'Erro ao buscar posts em destaque' });
  }
}

/**
 * GET /api/posts/:id - Detalhes do post
 */
export async function getPostById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const post = await postService.getById(id, userId);

    res.json(post);
  } catch (error: any) {
    console.error('[PostController] Erro ao buscar post:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao buscar post' });
    }
  }
}

/**
 * GET /api/posts/user/:userId - Posts de um usuário
 */
export async function getPostsByUser(req: Request, res: Response): Promise<void> {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await postService.getByUser(targetUserId, page, limit, currentUserId);

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
  } catch (error: any) {
    console.error('[PostController] Erro ao buscar posts do usuário:', error.message);
    res.status(500).json({ error: 'Erro ao buscar posts do usuário' });
  }
}

/**
 * DELETE /api/posts/:id - Excluir post
 */
export async function deletePost(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    await postService.delete(id, userId, isAdmin);

    res.status(204).send();
  } catch (error: any) {
    console.error('[PostController] Erro ao deletar post:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('permissão')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao deletar post' });
    }
  }
}

/**
 * POST /api/posts/:id/rebuild-feed - Reconstruir feed do usuário
 */
export async function rebuildFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    await postService.rebuildFeed(userId);

    res.json({ message: 'Feed reconstruído com sucesso' });
  } catch (error: any) {
    console.error('[PostController] Erro ao reconstruir feed:', error.message);
    res.status(500).json({ error: 'Erro ao reconstruir feed' });
  }
}

export const postController = {
  createPost,
  getFeed,
  getExplore,
  getPostById,
  getPostsByUser,
  deletePost,
  rebuildFeed,
  sharePost,
  getTrending,
  getPostStats,
};

/**
 * POST /api/posts/:id/share - Compartilhar post
 */
export async function sharePost(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { id } = req.params;
    const { content } = req.body;

    const post = await postService.share(userId, id, { content });

    res.status(201).json(post);
  } catch (error: any) {
    console.error('[PostController] Erro ao compartilhar post:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Não é possível')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao compartilhar post' });
    }
  }
}

/**
 * GET /api/posts/trending - Posts em alta (últimas 24h)
 */
export async function getTrending(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const result = await postService.getTrending(page, limit, userId);

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
  } catch (error: any) {
    console.error('[PostController] Erro ao buscar trending:', error.message);
    res.status(500).json({ error: 'Erro ao buscar posts em alta' });
  }
}

/**
 * GET /api/posts/:id/stats - Estatísticas do post
 */
export async function getPostStats(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const stats = await postService.getPostStats(id);

    res.json(stats);
  } catch (error: any) {
    console.error('[PostController] Erro ao buscar estatísticas:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}
