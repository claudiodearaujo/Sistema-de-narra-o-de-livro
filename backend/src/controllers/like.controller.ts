import { Request, Response } from 'express';
import { likeService } from '../services/like.service';

/**
 * POST /api/posts/:postId/like - Toggle like on a post
 */
export async function toggleLike(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ error: 'ID do post é obrigatório' });
      return;
    }

    const result = await likeService.toggleLike(postId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[LikeController] Error toggling like:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao processar curtida' });
    }
  }
}

/**
 * GET /api/posts/:postId/likes - Get users who liked a post
 */
export async function getLikes(req: Request, res: Response): Promise<void> {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ error: 'ID do post é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await likeService.getLikesByPost(postId, page, limit);
    res.json(result);
  } catch (error: any) {
    console.error('[LikeController] Error getting likes:', error.message);
    res.status(500).json({ error: 'Erro ao buscar curtidas' });
  }
}

/**
 * GET /api/posts/:postId/like/status - Check if current user liked the post
 */
export async function getLikeStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ error: 'ID do post é obrigatório' });
      return;
    }

    const isLiked = await likeService.isLiked(postId, userId);
    res.json({ isLiked });
  } catch (error: any) {
    console.error('[LikeController] Error checking like status:', error.message);
    res.status(500).json({ error: 'Erro ao verificar curtida' });
  }
}

export const likeController = {
  toggleLike,
  getLikes,
  getLikeStatus
};
