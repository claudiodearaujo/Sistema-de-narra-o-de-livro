import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';

/**
 * Get user profile by username
 * GET /api/users/:username
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const username = req.params.username as string;
    const currentUserId = req.user?.userId;

    if (!username) {
      res.status(400).json({ error: 'Nome de usuário é obrigatório' });
      return;
    }

    const profile = await profileService.getProfileByUsername(username, currentUserId);

    if (!profile) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(profile);
  } catch (error: any) {
    console.error('[ProfileController] Error getting profile:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
}

/**
 * Get user profile by ID
 * GET /api/users/id/:userId
 */
export async function getProfileById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const currentUserId = req.user?.userId;

    if (!userId) {
      res.status(400).json({ error: 'ID do usuário é obrigatório' });
      return;
    }

    const profile = await profileService.getProfileById(userId, currentUserId);

    if (!profile) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(profile);
  } catch (error: any) {
    console.error('[ProfileController] Error getting profile by ID:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
}

/**
 * Update current user's profile
 * PUT /api/users/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { name, username, bio, avatar } = req.body;

    // Validate input
    if (name !== undefined && (!name || name.length < 2)) {
      res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
      return;
    }

    if (username !== undefined && username.length > 0) {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        res.status(400).json({ 
          error: 'Nome de usuário deve ter 3-30 caracteres e conter apenas letras, números e underscore' 
        });
        return;
      }
    }

    if (bio !== undefined && bio.length > 500) {
      res.status(400).json({ error: 'Bio deve ter no máximo 500 caracteres' });
      return;
    }

    const profile = await profileService.updateProfile(userId, {
      name,
      username,
      bio,
      avatar
    });

    res.json(profile);
  } catch (error: any) {
    console.error('[ProfileController] Error updating profile:', error);
    
    if (error.message === 'Este nome de usuário já está em uso') {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}

/**
 * Get user posts by username
 * GET /api/users/:username/posts
 */
export async function getUserPosts(req: Request, res: Response): Promise<void> {
  try {
    const username = req.params.username as string;
    const currentUserId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    if (!username) {
      res.status(400).json({ error: 'Nome de usuário é obrigatório' });
      return;
    }

    const result = await profileService.getUserPosts(username, page, limit, currentUserId);

    res.json({
      posts: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('[ProfileController] Error getting user posts:', error);
    
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Erro ao buscar posts do usuário' });
  }
}

/**
 * Get user books by username
 * GET /api/users/:username/books
 */
export async function getUserBooks(req: Request, res: Response): Promise<void> {
  try {
    const username = req.params.username as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    if (!username) {
      res.status(400).json({ error: 'Nome de usuário é obrigatório' });
      return;
    }

    const result = await profileService.getUserBooks(username, page, limit);

    res.json({
      books: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('[ProfileController] Error getting user books:', error);
    
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Erro ao buscar livros do usuário' });
  }
}

/**
 * Get current user's own profile
 * GET /api/users/me
 */
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const profile = await profileService.getProfileById(userId);

    if (!profile) {
      res.status(404).json({ error: 'Perfil não encontrado' });
      return;
    }

    res.json(profile);
  } catch (error: any) {
    console.error('[ProfileController] Error getting my profile:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
}
