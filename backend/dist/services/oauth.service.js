"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateClient = validateClient;
exports.validateScope = validateScope;
exports.createAuthorizationCode = createAuthorizationCode;
exports.exchangeCodeForTokens = exchangeCodeForTokens;
exports.getUserInfo = getUserInfo;
exports.cleanupExpiredCodes = cleanupExpiredCodes;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const jwt_utils_1 = require("../utils/jwt.utils");
/**
 * Generate a secure random authorization code
 */
function generateAuthorizationCode() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Validate PKCE code_verifier against code_challenge
 */
function validatePKCE(codeChallenge, codeVerifier, method) {
    if (method === 'S256') {
        const hash = crypto_1.default.createHash('sha256').update(codeVerifier).digest();
        const computed = hash.toString('base64url');
        return computed === codeChallenge;
    }
    else if (method === 'plain') {
        return codeChallenge === codeVerifier;
    }
    return false;
}
/**
 * Sanitize user for external response
 */
function sanitizeUser(user) {
    const { password, verifyToken, resetToken, resetExpires, verifyExpires, ...sanitized } = user;
    return sanitized;
}
/**
 * Create token payload from user
 */
function createTokenPayload(user) {
    return {
        userId: user.id,
        email: user.email,
        role: user.role
    };
}
/**
 * Validate OAuth client exists and redirect URI is allowed
 */
async function validateClient(clientId, redirectUri) {
    const client = await prisma_1.default.oAuthClient.findUnique({
        where: { clientId }
    });
    if (!client) {
        return { valid: false, error: 'Cliente não encontrado' };
    }
    if (!client.isActive) {
        return { valid: false, error: 'Cliente está desativado' };
    }
    if (!client.allowedRedirectUris.includes(redirectUri)) {
        return { valid: false, error: 'Redirect URI não permitida para este cliente' };
    }
    return { valid: true, client };
}
/**
 * Validate requested scopes are allowed for the client
 */
async function validateScope(clientId, scope) {
    const client = await prisma_1.default.oAuthClient.findUnique({
        where: { clientId }
    });
    if (!client) {
        return { valid: false, error: 'Cliente não encontrado' };
    }
    const requestedScopes = scope.split(' ');
    const invalidScopes = requestedScopes.filter(s => !client.allowedScopes.includes(s));
    if (invalidScopes.length > 0) {
        return { valid: false, error: `Escopos não permitidos: ${invalidScopes.join(', ')}` };
    }
    return { valid: true };
}
/**
 * Create an authorization code for the OAuth flow
 */
async function createAuthorizationCode(params) {
    const { clientId, redirectUri, scope, codeChallenge, codeChallengeMethod, userId } = params;
    // Validate client
    const validation = await validateClient(clientId, redirectUri);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    // Validate scope
    const scopeValidation = await validateScope(clientId, scope);
    if (!scopeValidation.valid) {
        throw new Error(scopeValidation.error);
    }
    // Generate authorization code
    const code = generateAuthorizationCode();
    // Store authorization code (expires in 10 minutes)
    await prisma_1.default.oAuthAuthorizationCode.create({
        data: {
            code,
            clientId,
            userId,
            redirectUri,
            scope,
            codeChallenge,
            codeChallengeMethod,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
    });
    return code;
}
/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(params) {
    const { grantType, code, redirectUri, clientId, codeVerifier } = params;
    // Validate grant type
    if (grantType !== 'authorization_code') {
        throw new Error('grant_type inválido. Use authorization_code');
    }
    // Find authorization code
    const authCode = await prisma_1.default.oAuthAuthorizationCode.findUnique({
        where: { code },
        include: { client: true }
    });
    if (!authCode) {
        throw new Error('Código de autorização inválido');
    }
    // Check if code was already used
    if (authCode.usedAt) {
        throw new Error('Código de autorização já foi utilizado');
    }
    // Check if code expired
    if (authCode.expiresAt < new Date()) {
        throw new Error('Código de autorização expirado');
    }
    // Validate client_id matches
    if (authCode.clientId !== clientId) {
        throw new Error('client_id não corresponde ao código');
    }
    // Validate redirect_uri matches
    if (authCode.redirectUri !== redirectUri) {
        throw new Error('redirect_uri não corresponde ao código');
    }
    // Validate PKCE
    if (!validatePKCE(authCode.codeChallenge, codeVerifier, authCode.codeChallengeMethod)) {
        throw new Error('Validação PKCE falhou. code_verifier inválido');
    }
    // Mark code as used
    await prisma_1.default.oAuthAuthorizationCode.update({
        where: { id: authCode.id },
        data: { usedAt: new Date() }
    });
    // Get user
    const user = await prisma_1.default.user.findUnique({
        where: { id: authCode.userId }
    });
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    // Generate tokens
    const payload = createTokenPayload(user);
    const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
    const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
    // Store refresh token
    await prisma_1.default.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: (0, jwt_utils_1.getRefreshTokenExpiresAt)()
        }
    });
    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 3600 // 1 hour
    };
}
/**
 * Get user info for authenticated user
 */
async function getUserInfo(userId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    return sanitizeUser(user);
}
/**
 * Clean up expired authorization codes (can be called periodically)
 */
async function cleanupExpiredCodes() {
    const result = await prisma_1.default.oAuthAuthorizationCode.deleteMany({
        where: {
            expiresAt: { lt: new Date() }
        }
    });
    return result.count;
}
