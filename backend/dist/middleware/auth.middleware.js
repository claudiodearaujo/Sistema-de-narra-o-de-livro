"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writerOrAdmin = exports.adminOnly = void 0;
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.authorize = authorize;
const jwt_utils_1 = require("../utils/jwt.utils");
const client_1 = require("@prisma/client");
/**
 * Authentication middleware - verifies JWT token
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            error: 'Token de autenticação não fornecido',
            code: 'NO_TOKEN'
        });
        return;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
            error: 'Formato de token inválido',
            code: 'INVALID_TOKEN_FORMAT'
        });
        return;
    }
    const token = parts[1];
    const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
    if (!decoded) {
        res.status(401).json({
            error: 'Token inválido ou expirado',
            code: 'INVALID_TOKEN'
        });
        return;
    }
    req.user = decoded;
    next();
}
/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        next();
        return;
    }
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
        if (decoded) {
            req.user = decoded;
        }
    }
    next();
}
/**
 * Role-based authorization middleware factory
 * Usage: authorize(UserRole.ADMIN) or authorize(UserRole.ADMIN, UserRole.WRITER)
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Autenticação necessária',
                code: 'AUTHENTICATION_REQUIRED'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Você não tem permissão para acessar este recurso',
                code: 'FORBIDDEN'
            });
            return;
        }
        next();
    };
}
/**
 * Shorthand for admin-only routes
 */
exports.adminOnly = authorize(client_1.UserRole.ADMIN);
/**
 * Shorthand for writer and admin routes
 */
exports.writerOrAdmin = authorize(client_1.UserRole.WRITER, client_1.UserRole.ADMIN);
