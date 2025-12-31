import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';

/**
 * GET /api/posts/:postId/comments - Get comments for a post
 */
export async function getComments(req: Request, res: Response): Promise<void> {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ error: 'ID do post é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const parentId = req.query.parentId as string | undefined;

    const result = await commentService.getByPost(postId, page, limit, parentId || null);
    res.json(result);
  } catch (error: any) {
    console.error('[CommentController] Error getting comments:', error.message);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
}

/**
 * POST /api/posts/:postId/comments - Create a comment
 */
export async function createComment(req: Request, res: Response): Promise<void> {
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

    const { content, parentId } = req.body;

    // Validate content
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'O conteúdo do comentário é obrigatório' });
      return;
    }

    if (content.length < 1 || content.length > 1000) {
      res.status(400).json({ error: 'O comentário deve ter entre 1 e 1000 caracteres' });
      return;
    }

    const comment = await commentService.create(postId, userId, { content, parentId });
    res.status(201).json(comment);
  } catch (error: any) {
    console.error('[CommentController] Error creating comment:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}

/**
 * GET /api/comments/:id/replies - Get replies for a comment
 */
export async function getReplies(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID do comentário é obrigatório' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const result = await commentService.getReplies(id, page, limit);
    res.json(result);
  } catch (error: any) {
    console.error('[CommentController] Error getting replies:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao buscar respostas' });
    }
  }
}

/**
 * PUT /api/comments/:id - Update a comment
 */
export async function updateComment(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID do comentário é obrigatório' });
      return;
    }

    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'O conteúdo do comentário é obrigatório' });
      return;
    }

    if (content.length < 1 || content.length > 1000) {
      res.status(400).json({ error: 'O comentário deve ter entre 1 e 1000 caracteres' });
      return;
    }

    const comment = await commentService.update(id, userId, content);
    res.json(comment);
  } catch (error: any) {
    console.error('[CommentController] Error updating comment:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('permissão')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}

/**
 * DELETE /api/comments/:id - Delete a comment
 */
export async function deleteComment(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID do comentário é obrigatório' });
      return;
    }

    // Check if user is admin
    const isAdmin = req.user?.role === 'ADMIN';

    await commentService.delete(id, userId, isAdmin);
    res.status(204).send();
  } catch (error: any) {
    console.error('[CommentController] Error deleting comment:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('permissão')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao excluir comentário' });
    }
  }
}

/**
 * POST /api/comments/:id/like - Toggle like on a comment
 */
export async function toggleCommentLike(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID do comentário é obrigatório' });
      return;
    }

    const result = await commentService.toggleCommentLike(id, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[CommentController] Error toggling comment like:', error.message);
    
    if (error.message.includes('não encontrado')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao curtir comentário' });
    }
  }
}

export const commentController = {
  getComments,
  createComment,
  getReplies,
  updateComment,
  deleteComment,
  toggleCommentLike
};
