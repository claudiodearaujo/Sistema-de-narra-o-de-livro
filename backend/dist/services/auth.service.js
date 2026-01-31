"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.refreshAccessToken = refreshAccessToken;
exports.logout = logout;
exports.logoutAll = logoutAll;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
exports.verifyEmail = verifyEmail;
exports.resendVerificationEmail = resendVerificationEmail;
exports.findUserById = findUserById;
const client_1 = require("@prisma/client");
const password_utils_1 = require("../utils/password.utils");
const jwt_utils_1 = require("../utils/jwt.utils");
const prisma_1 = __importDefault(require("../lib/prisma"));
const audit_service_1 = require("./audit.service");
// Helper to sanitize user (remove sensitive fields)
function sanitizeUser(user) {
    const { password, verifyToken, resetToken, resetExpires, verifyExpires, ...sanitized } = user;
    return sanitized;
}
// Helper to create token payload
function createTokenPayload(user) {
    return {
        userId: user.id,
        email: user.email,
        role: user.role
    };
}
/**
 * Register a new user
 */
async function signup(input) {
    const { name, email, password, username, ipAddress } = input;
    // Check if email already exists
    const existingEmail = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingEmail) {
        throw new Error('Este e-mail já está cadastrado');
    }
    // Check if username already exists (if provided)
    if (username) {
        const existingUsername = await prisma_1.default.user.findUnique({ where: { username } });
        if (existingUsername) {
            throw new Error('Este nome de usuário já está em uso');
        }
    }
    // Hash password
    const hashedPassword = await (0, password_utils_1.hashPassword)(password);
    // Create user
    const user = await prisma_1.default.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            username,
            role: client_1.UserRole.WRITER, // Default role for signup
            provider: client_1.AuthProvider.LOCAL,
            verifyToken: (0, password_utils_1.generateRandomToken)(),
            verifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
    });
    // Generate tokens
    const payload = createTokenPayload(user);
    const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
    const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
    // Store refresh token in database
    await prisma_1.default.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: (0, jwt_utils_1.getRefreshTokenExpiresAt)()
        }
    });
    // Audit log - fire and forget
    audit_service_1.auditService.logSignup(user.id, user.email, ipAddress || 'unknown')
        .catch(err => console.error('[AUDIT]', err));
    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour in seconds
    };
}
/**
 * Login user
 */
async function login(input) {
    const { email, password, ipAddress, userAgent } = input;
    console.log('[AUTH] Login attempt for email:', email);
    try {
        // Find user
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Audit log - login failed
            audit_service_1.auditService.logLoginFailed(email, ipAddress || 'unknown', userAgent || 'unknown', 'Usuário não encontrado').catch(err => console.error('[AUDIT]', err));
            throw new Error('Credenciais inválidas');
        }
        console.log('[AUTH] User found:', user.id);
        // Check if user has password (local auth)
        if (!user.password) {
            // Audit log - login failed
            audit_service_1.auditService.logLoginFailed(email, ipAddress || 'unknown', userAgent || 'unknown', 'Conta usa login social').catch(err => console.error('[AUDIT]', err));
            throw new Error('Esta conta usa login social. Use o botão correspondente.');
        }
        // Verify password
        const isValidPassword = await (0, password_utils_1.comparePassword)(password, user.password);
        if (!isValidPassword) {
            // Audit log - login failed
            audit_service_1.auditService.logLoginFailed(email, ipAddress || 'unknown', userAgent || 'unknown', 'Senha incorreta').catch(err => console.error('[AUDIT]', err));
            throw new Error('Credenciais inválidas');
        }
        // Generate tokens
        const payload = createTokenPayload(user);
        console.log('create token payload for user:', payload);
        const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
        console.log('generate access token:', accessToken);
        const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
        console.log('generate refresh token:', refreshToken);
        // Store refresh token
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: (0, jwt_utils_1.getRefreshTokenExpiresAt)()
            }
        });
        // Audit log - login success
        audit_service_1.auditService.logLogin(user.id, user.email, ipAddress || 'unknown', userAgent || 'unknown').catch(err => console.error('[AUDIT]', err));
        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken,
            expiresIn: 3600
        };
    }
    catch (error) {
        // Re-throw the error after logging
        throw error;
    }
}
/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
    // Verify the refresh token
    const decoded = (0, jwt_utils_1.verifyRefreshToken)(refreshToken);
    if (!decoded) {
        throw new Error('Token de atualização inválido ou expirado');
    }
    // Check if token exists in database
    const storedToken = await prisma_1.default.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
    });
    if (!storedToken) {
        throw new Error('Token de atualização não encontrado');
    }
    if (storedToken.expiresAt < new Date()) {
        await prisma_1.default.refreshToken.delete({ where: { id: storedToken.id } });
        throw new Error('Token de atualização expirado');
    }
    // Delete old refresh token
    await prisma_1.default.refreshToken.delete({ where: { id: storedToken.id } });
    // Generate new tokens
    const user = storedToken.user;
    const payload = createTokenPayload(user);
    const newAccessToken = (0, jwt_utils_1.generateAccessToken)(payload);
    const newRefreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
    // Store new refresh token
    await prisma_1.default.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: (0, jwt_utils_1.getRefreshTokenExpiresAt)()
        }
    });
    return {
        user: sanitizeUser(user),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600
    };
}
/**
 * Logout user (invalidate refresh token)
 */
async function logout(refreshToken, userId, email) {
    await prisma_1.default.refreshToken.deleteMany({
        where: { token: refreshToken }
    });
    // Audit log - logout
    if (userId && email) {
        audit_service_1.auditService.logLogout(userId, email)
            .catch(err => console.error('[AUDIT]', err));
    }
}
/**
 * Logout from all devices
 */
async function logoutAll(userId, email) {
    await prisma_1.default.refreshToken.deleteMany({
        where: { userId }
    });
    // Audit log - logout all (if called explicitly, not from password change)
    if (email) {
        audit_service_1.auditService.log({
            userId,
            userEmail: email,
            action: 'AUTH_LOGOUT_ALL',
            category: 'AUTH',
            severity: 'MEDIUM',
            description: `Usuário ${email} fez logout de todos os dispositivos`,
        }).catch(err => console.error('[AUDIT]', err));
    }
}
/**
 * Get user profile
 */
async function getProfile(userId) {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    return sanitizeUser(user);
}
/**
 * Update user profile
 */
async function updateProfile(userId, input) {
    // Check username uniqueness if changing
    if (input.username) {
        const existingUsername = await prisma_1.default.user.findFirst({
            where: {
                username: input.username,
                NOT: { id: userId }
            }
        });
        if (existingUsername) {
            throw new Error('Este nome de usuário já está em uso');
        }
    }
    const user = await prisma_1.default.user.update({
        where: { id: userId },
        data: input
    });
    return sanitizeUser(user);
}
/**
 * Change password
 */
async function changePassword(userId, input) {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
        throw new Error('Usuário não encontrado ou senha não definida');
    }
    // Verify current password
    const isValid = await (0, password_utils_1.comparePassword)(input.currentPassword, user.password);
    if (!isValid) {
        throw new Error('Senha atual incorreta');
    }
    // Hash new password
    const hashedPassword = await (0, password_utils_1.hashPassword)(input.newPassword);
    // Update password
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
    // Audit log - password change
    audit_service_1.auditService.logPasswordChange(userId, user.email)
        .catch(err => console.error('[AUDIT]', err));
    // Invalidate all refresh tokens (security measure)
    await logoutAll(userId);
}
/**
 * Request password reset
 */
async function requestPasswordReset(email, ipAddress) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
        return { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação' };
    }
    // Generate reset token
    const resetToken = (0, password_utils_1.generateRandomToken)();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { resetToken, resetExpires }
    });
    // Audit log - password reset request
    audit_service_1.auditService.logPasswordResetRequest(email, ipAddress || 'unknown')
        .catch(err => console.error('[AUDIT]', err));
    // TODO: Send email with reset link
    // await sendPasswordResetEmail(email, resetToken);
    console.log(`[AUTH] Password reset token for ${email}: ${resetToken}`);
    return { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação' };
}
/**
 * Reset password with token
 */
async function resetPassword(token, newPassword) {
    const user = await prisma_1.default.user.findFirst({
        where: {
            resetToken: token,
            resetExpires: { gt: new Date() }
        }
    });
    if (!user) {
        throw new Error('Token inválido ou expirado');
    }
    const hashedPassword = await (0, password_utils_1.hashPassword)(newPassword);
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetExpires: null
        }
    });
    // Audit log - password reset complete
    audit_service_1.auditService.logPasswordResetComplete(user.id, user.email)
        .catch(err => console.error('[AUDIT]', err));
    // Invalidate all refresh tokens
    await logoutAll(user.id);
}
/**
 * Verify email
 */
async function verifyEmail(token) {
    const user = await prisma_1.default.user.findFirst({
        where: {
            verifyToken: token,
            verifyExpires: { gt: new Date() }
        }
    });
    if (!user) {
        throw new Error('Token de verificação inválido ou expirado');
    }
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verifyToken: null,
            verifyExpires: null
        }
    });
}
/**
 * Resend verification email
 */
async function resendVerificationEmail(userId) {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    if (user.isVerified) {
        throw new Error('E-mail já verificado');
    }
    const verifyToken = (0, password_utils_1.generateRandomToken)();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { verifyToken, verifyExpires }
    });
    // TODO: Send verification email
    console.log(`[AUTH] Verification token for ${user.email}: ${verifyToken}`);
    return { message: 'E-mail de verificação reenviado' };
}
/**
 * Find user by ID
 */
async function findUserById(userId) {
    return prisma_1.default.user.findUnique({ where: { id: userId } });
}
