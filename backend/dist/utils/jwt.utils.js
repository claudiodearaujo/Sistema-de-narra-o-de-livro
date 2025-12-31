"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.decodeToken = decodeToken;
exports.getTokenExpiration = getTokenExpiration;
exports.isTokenExpired = isTokenExpired;
exports.getRefreshTokenExpiresAt = getRefreshTokenExpiresAt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// JWT Configuration - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h');
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d');
/**
 * Generate an access token
 */
function generateAccessToken(payload) {
    const options = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'livria-api',
        subject: payload.userId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
}
/**
 * Generate a refresh token
 */
function generateRefreshToken(payload) {
    const options = {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'livria-api',
        subject: payload.userId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, options);
}
/**
 * Verify an access token
 */
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
/**
 * Verify a refresh token
 */
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    }
    catch (error) {
        return null;
    }
}
/**
 * Decode a token without verification (useful for debugging)
 */
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        return null;
    }
}
/**
 * Get token expiration date
 */
function getTokenExpiration(token) {
    const decoded = decodeToken(token);
    if (decoded?.exp) {
        return new Date(decoded.exp * 1000);
    }
    return null;
}
/**
 * Check if token is expired
 */
function isTokenExpired(token) {
    const expiration = getTokenExpiration(token);
    if (!expiration)
        return true;
    return expiration < new Date();
}
/**
 * Calculate refresh token expiration date for database storage
 */
function getRefreshTokenExpiresAt() {
    const days = parseInt(JWT_REFRESH_EXPIRES_IN.replace('d', '')) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
}
