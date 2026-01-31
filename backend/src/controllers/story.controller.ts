import { Request, Response, NextFunction } from 'express';
import { storyService } from '../services/story.service';

/**
 * Get stories feed (from followed users)
 */
export async function getStoriesFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const stories = await storyService.getStoriesFeed(userId);

    res.json({ stories });
  } catch (error) {
    next(error);
  }
}

/**
 * Get stories by user
 */
export async function getStoriesByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId as string;
    const viewerId = (req as any).user?.userId;

    const stories = await storyService.getStoriesByUser(userId, viewerId);

    res.json({ stories });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single story
 */
export async function getStoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const viewerId = (req as any).user?.userId;

    const story = await storyService.getById(id, viewerId);

    if (!story) {
      return res.status(404).json({ error: 'Story não encontrado ou expirado' });
    }

    res.json(story);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new story
 */
export async function createStory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const { type, content, mediaUrl, expiresInHours } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Tipo do story é obrigatório' });
    }

    const story = await storyService.create(userId, {
      type,
      content,
      mediaUrl,
      expiresInHours,
    });

    res.status(201).json(story);
  } catch (error: any) {
    if (error.message?.includes('limite')) {
      return res.status(429).json({ error: error.message });
    }
    next(error);
  }
}

/**
 * Mark story as viewed
 */
export async function viewStory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    await storyService.markAsViewed(id, userId);

    res.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes('não encontrado') || error.message?.includes('expirado')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

/**
 * Delete a story
 */
export async function deleteStory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    await storyService.delete(id, userId);

    res.json({ success: true, message: 'Story excluído com sucesso' });
  } catch (error: any) {
    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message?.includes('permissão')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
}

/**
 * Get story viewers
 */
export async function getStoryViewers(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await storyService.getViewers(id, userId, page, limit);

    res.json(result);
  } catch (error: any) {
    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message?.includes('permissão')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
}

/**
 * Get my active stories count
 */
export async function getMyStoriesCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { count, limit } = await storyService.getActiveStoriesCountWithLimit(userId);

    res.json({
      count,
      limit,
      remaining: Math.max(0, limit - count),
    });
  } catch (error) {
    next(error);
  }
}
