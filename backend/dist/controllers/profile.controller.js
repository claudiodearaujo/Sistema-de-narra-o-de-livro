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
exports.getProfile = getProfile;
exports.getProfileById = getProfileById;
exports.updateProfile = updateProfile;
exports.getUserPosts = getUserPosts;
exports.getUserBooks = getUserBooks;
exports.getMyProfile = getMyProfile;
const profileService = __importStar(require("../services/profile.service"));
/**
 * Get user profile by username
 * GET /api/users/:username
 */
async function getProfile(req, res) {
    try {
        const username = req.params.username;
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
    }
    catch (error) {
        console.error('[ProfileController] Error getting profile:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
}
/**
 * Get user profile by ID
 * GET /api/users/id/:userId
 */
async function getProfileById(req, res) {
    try {
        const userId = req.params.userId;
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
    }
    catch (error) {
        console.error('[ProfileController] Error getting profile by ID:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
}
/**
 * Update current user's profile
 * PUT /api/users/profile
 */
async function updateProfile(req, res) {
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
    }
    catch (error) {
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
async function getUserPosts(req, res) {
    try {
        const username = req.params.username;
        const currentUserId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        if (!username) {
            res.status(400).json({ error: 'Nome de usuário é obrigatório' });
            return;
        }
        const result = await profileService.getUserPosts(username, page, limit, currentUserId);
        res.json({
            posts: result.data,
            pagination: result.pagination
        });
    }
    catch (error) {
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
async function getUserBooks(req, res) {
    try {
        const username = req.params.username;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        if (!username) {
            res.status(400).json({ error: 'Nome de usuário é obrigatório' });
            return;
        }
        const result = await profileService.getUserBooks(username, page, limit);
        res.json({
            books: result.data,
            pagination: result.pagination
        });
    }
    catch (error) {
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
async function getMyProfile(req, res) {
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
    }
    catch (error) {
        console.error('[ProfileController] Error getting my profile:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
}
