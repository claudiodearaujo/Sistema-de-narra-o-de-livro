"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.refresh = refresh;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.uploadAvatar = uploadAvatar;
exports.changePassword = changePassword;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
const authService = __importStar(require("../services/auth.service"));
/**
 * POST /api/auth/signup
 */
async function signup(req, res) {
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
    }
    catch (error) {
        console.error('[AUTH] Signup error:', error.message);
        if (error.message.includes('já está cadastrado') || error.message.includes('já está em uso')) {
            res.status(409).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao criar conta' });
        }
    }
}
/**
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
            return;
        }
        const result = await authService.login({ email, password });
        res.json(result);
    }
    catch (error) {
        console.error('[AUTH] Login error:', error.message);
        res.status(401).json({ error: error.message });
    }
}
/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        res.json({ message: 'Logout realizado com sucesso' });
    }
    catch (error) {
        console.error('[AUTH] Logout error:', error.message);
        res.status(500).json({ error: 'Erro ao realizar logout' });
    }
}
/**
 * POST /api/auth/refresh
 */
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Token de atualização não fornecido' });
            return;
        }
        const result = await authService.refreshAccessToken(refreshToken);
        res.json(result);
    }
    catch (error) {
        console.error('[AUTH] Refresh error:', error.message);
        res.status(401).json({ error: error.message });
    }
}
/**
 * GET /api/auth/profile
 */
async function getProfile(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }
        const user = await authService.getProfile(userId);
        res.json(user);
    }
    catch (error) {
        console.error('[AUTH] Get profile error:', error.message);
        res.status(404).json({ error: error.message });
    }
}
/**
 * PATCH /api/auth/profile
 */
async function updateProfile(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }
        const { name, username, bio } = req.body;
        const user = await authService.updateProfile(userId, { name, username, bio });
        res.json(user);
    }
    catch (error) {
        console.error('[AUTH] Update profile error:', error.message);
        if (error.message.includes('já está em uso')) {
            res.status(409).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
    }
}
/**
 * POST /api/auth/profile/avatar
 */
async function uploadAvatar(req, res) {
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
    }
    catch (error) {
        console.error('[AUTH] Upload avatar error:', error.message);
        res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
}
/**
 * POST /api/auth/change-password
 */
async function changePassword(req, res) {
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
    }
    catch (error) {
        console.error('[AUTH] Change password error:', error.message);
        if (error.message.includes('incorreta')) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao alterar senha' });
        }
    }
}
/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'E-mail é obrigatório' });
            return;
        }
        const result = await authService.requestPasswordReset(email);
        res.json(result);
    }
    catch (error) {
        console.error('[AUTH] Forgot password error:', error.message);
        // Always return success to prevent email enumeration
        res.json({ message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação' });
    }
}
/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
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
    }
    catch (error) {
        console.error('[AUTH] Reset password error:', error.message);
        res.status(400).json({ error: error.message });
    }
}
/**
 * POST /api/auth/verify-email
 */
async function verifyEmail(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: 'Token de verificação não fornecido' });
            return;
        }
        await authService.verifyEmail(token);
        res.json({ message: 'E-mail verificado com sucesso' });
    }
    catch (error) {
        console.error('[AUTH] Verify email error:', error.message);
        res.status(400).json({ error: error.message });
    }
}
/**
 * POST /api/auth/resend-verification
 */
async function resendVerification(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }
        const result = await authService.resendVerificationEmail(userId);
        res.json(result);
    }
    catch (error) {
        console.error('[AUTH] Resend verification error:', error.message);
        res.status(400).json({ error: error.message });
    }
}
