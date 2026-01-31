import { Request, Response } from 'express';
import { followService } from '../services/follow.service';

/**
 * POST /api/users/:userId/follow - Toggle follow on a user
 */
export async function toggleFollow(req: Request, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const userId = req.params.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const result = await followService.toggleFollow(currentUserId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[FollowController] Error toggling follow:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('si mesmo')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao processar follow' });
    }
  }
}

/**
 * GET /api/users/:userId/followers - Get followers of a user
 */
export async function getFollowers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const currentUserId = req.user?.userId;

    const result = await followService.getFollowers(userId, page, limit, currentUserId);
    res.json(result);
  } catch (error: any) {
    console.error('[FollowController] Error getting followers:', error.message);
    res.status(500).json({ error: 'Erro ao buscar seguidores' });
  }
}

/**
 * GET /api/users/:userId/following - Get users that a user is following
 */
export async function getFollowing(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const currentUserId = req.user?.userId;

    const result = await followService.getFollowing(userId, page, limit, currentUserId);
    res.json(result);
  } catch (error: any) {
    console.error('[FollowController] Error getting following:', error.message);
    res.status(500).json({ error: 'Erro ao buscar seguindo' });
  }
}

/**
 * GET /api/users/:userId/follow-status - Get follow status between current user and target
 */
export async function getFollowStatus(req: Request, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const userId = req.params.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const result = await followService.getFollowStatus(currentUserId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[FollowController] Error getting follow status:', error.message);
    res.status(500).json({ error: 'Erro ao verificar status de follow' });
  }
}

/**
 * GET /api/users/:userId/follow-counts - Get follower and following counts
 */
export async function getFollowCounts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const result = await followService.getFollowCounts(userId);
    res.json(result);
  } catch (error: any) {
    console.error('[FollowController] Error getting follow counts:', error.message);
    res.status(500).json({ error: 'Erro ao buscar contagens' });
  }
}

/**
 * GET /api/users/suggestions - Get suggested users to follow
 */
export async function getSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    const suggestions = await followService.getSuggestions(currentUserId, limit);
    res.json({ users: suggestions });
  } catch (error: any) {
    console.error('[FollowController] Error getting suggestions:', error.message);
    res.status(500).json({ error: 'Erro ao buscar sugestões' });
  }
}

export const followController = {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowStatus,
  getFollowCounts,
  getSuggestions
};
