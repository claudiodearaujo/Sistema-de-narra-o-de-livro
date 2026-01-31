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
        // Audit log - malformed token
        Promise.resolve().then(() => __importStar(require('../services/audit.service'))).then(({ auditService }) => {
            auditService.log({
                userId: 'system',
                userEmail: 'anonymous',
                action: 'AUTH_FAILURE',
                category: 'SECURITY',
                severity: 'LOW',
                resource: 'Auth',
                description: `Formato de token inválido`,
                metadata: { path: req.originalUrl, ip: req.ip }
            }).catch(err => console.error('[AUDIT]', err));
        });
        res.status(401).json({
            error: 'Formato de token inválido',
            code: 'INVALID_TOKEN_FORMAT'
        });
        return;
    }
    const token = parts[1];
    const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
    if (!decoded) {
        // Audit log - invalid/expired token
        Promise.resolve().then(() => __importStar(require('../services/audit.service'))).then(({ auditService }) => {
            auditService.log({
                userId: 'system',
                userEmail: 'anonymous',
                action: 'AUTH_FAILURE',
                category: 'SECURITY',
                severity: 'LOW',
                resource: 'Auth',
                description: `Token inválido ou expirado`,
                metadata: { path: req.originalUrl, ip: req.ip }
            }).catch(err => console.error('[AUDIT]', err));
        });
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
            // Audit log - unauthorized access attempt
            Promise.resolve().then(() => __importStar(require('../services/audit.service'))).then(({ auditService }) => {
                auditService.logPermissionDenied(req.user.id, req.user.email, req.originalUrl, `Required roles: ${allowedRoles.join(', ')}, User role: ${req.user.role}`).catch(err => console.error('[AUDIT]', err));
            });
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
