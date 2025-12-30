import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/**
 * POST /api/auth/signup
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, confirmPassword, username, acceptTerms } = req.body;

    // Validations
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'As senhas não coincidem' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' });
      return;
    }

    if (!acceptTerms) {
      res.status(400).json({ error: 'Você deve aceitar os termos de uso' });
      return;
    }

    const result = await authService.signup({ name, email, password, username });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('[AUTH] Signup error:', error.message);
    
    if (error.message.includes('já está cadastrado') || error.message.includes('já está em uso')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      return;
    }

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error: any) {
    console.error('[AUTH] Login error:', error.message);
    res.status(401).json({ error: error.message });
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error: any) {
    console.error('[AUTH] Logout error:', error.message);
    res.status(500).json({ error: 'Erro ao realizar logout' });
  }
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Token de atualização não fornecido' });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error: any) {
    console.error('[AUTH] Refresh error:', error.message);
    res.status(401).json({ error: error.message });
  }
}

/**
 * GET /api/auth/profile
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const user = await authService.getProfile(userId);
    res.json(user);
  } catch (error: any) {
    console.error('[AUTH] Get profile error:', error.message);
    res.status(404).json({ error: error.message });
  }
}

/**
 * PATCH /api/auth/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { name, username, bio } = req.body;
    const user = await authService.updateProfile(userId, { name, username, bio });
    res.json(user);
  } catch (error: any) {
    console.error('[AUTH] Update profile error:', error.message);
    
    if (error.message.includes('já está em uso')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }
}

/**
 * POST /api/auth/profile/avatar
 */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // TODO: Implement file upload with multer
    // For now, accept avatar URL in body
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      res.status(400).json({ error: 'URL do avatar não fornecida' });
      return;
    }

    await authService.updateProfile(userId, { avatar: avatarUrl });
    res.json({ avatarUrl });
  } catch (error: any) {
    console.error('[AUTH] Upload avatar error:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar avatar' });
  }
}

/**
 * POST /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'As senhas não coincidem' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres' });
      return;
    }

    await authService.changePassword(userId, { currentPassword, newPassword });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    console.error('[AUTH] Change password error:', error.message);
    
    if (error.message.includes('incorreta')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'E-mail é obrigatório' });
      return;
    }

    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    console.error('[AUTH] Forgot password error:', error.message);
    // Always return success to prevent email enumeration
    res.json({ message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação' });
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'As senhas não coincidem' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' });
      return;
    }

    await authService.resetPassword(token, password);
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error: any) {
    console.error('[AUTH] Reset password error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/auth/verify-email
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token de verificação não fornecido' });
      return;
    }

    await authService.verifyEmail(token);
    res.json({ message: 'E-mail verificado com sucesso' });
  } catch (error: any) {
    console.error('[AUTH] Verify email error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/auth/resend-verification
 */
export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const result = await authService.resendVerificationEmail(userId);
    res.json(result);
  } catch (error: any) {
    console.error('[AUTH] Resend verification error:', error.message);
    res.status(400).json({ error: error.message });
  }
}
