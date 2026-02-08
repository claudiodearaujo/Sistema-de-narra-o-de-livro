import crypto from 'crypto';
import prisma from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiresAt, TokenPayload } from '../utils/jwt.utils';
import { User } from '@prisma/client';

// Types
export interface AuthorizeParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  userId: string;
}

export interface TokenExchangeParams {
  grantType: string;
  code: string;
  redirectUri: string;
  clientId: string;
  codeVerifier: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Generate a secure random authorization code
 */
function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate PKCE code_verifier against code_challenge
 */
function validatePKCE(codeChallenge: string, codeVerifier: string, method: string): boolean {
  if (method === 'S256') {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    const computed = hash.toString('base64url');
    return computed === codeChallenge;
  } else if (method === 'plain') {
    return codeChallenge === codeVerifier;
  }
  return false;
}

/**
 * Sanitize user for external response
 */
function sanitizeUser(user: User) {
  const { password, verifyToken, resetToken, resetExpires, verifyExpires, ...sanitized } = user;
  return sanitized;
}

/**
 * Create token payload from user
 */
function createTokenPayload(user: User): TokenPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role
  };
}

/**
 * Validate OAuth client exists and redirect URI is allowed
 */
export async function validateClient(clientId: string, redirectUri: string): Promise<{ valid: boolean; error?: string; client?: any }> {
  const client = await prisma.oAuthClient.findUnique({
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
export async function validateScope(clientId: string, scope: string): Promise<{ valid: boolean; error?: string }> {
  const client = await prisma.oAuthClient.findUnique({
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
export async function createAuthorizationCode(params: AuthorizeParams): Promise<string> {
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
  await prisma.oAuthAuthorizationCode.create({
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
export async function exchangeCodeForTokens(params: TokenExchangeParams): Promise<TokenResponse> {
  const { grantType, code, redirectUri, clientId, codeVerifier } = params;

  // Validate grant type
  if (grantType !== 'authorization_code') {
    throw new Error('grant_type inválido. Use authorization_code');
  }

  // Find authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
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
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() }
  });

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: authCode.userId }
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Generate tokens
  const payload = createTokenPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiresAt()
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
export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
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
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.oAuthAuthorizationCode.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  return result.count;
}
