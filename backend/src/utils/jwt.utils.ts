import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import type { StringValue } from 'ms';

// JWT Configuration - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
// Default to 2 days for access token to maintain longer sessions
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '2d') as StringValue;
// Default to 30 days for refresh token
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as StringValue;

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'livria-api',
    subject: payload.userId,
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'livria-api',
    subject: payload.userId,
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

/**
 * Decode a token without verification (useful for debugging)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    return null;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration < new Date();
}

/**
 * Calculate refresh token expiration date for database storage
 */
export function getRefreshTokenExpiresAt(): Date {
  const days = parseInt(JWT_REFRESH_EXPIRES_IN.replace('d', '')) || 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

/**
 * Get access token expiration in seconds
 */
export function getAccessTokenExpiresIn(): number {
  const timeString = JWT_EXPIRES_IN;
  // Parse time string like '1h', '2d', '30m', etc.
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 172800; // Default: 2 days in seconds
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 172800; // Default: 2 days in seconds
  }
}
