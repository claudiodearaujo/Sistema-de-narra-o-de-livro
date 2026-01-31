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
exports.requirePro = exports.requireWriter = exports.requireAdmin = void 0;
exports.requireRole = requireRole;
exports.requireMinimumRole = requireMinimumRole;
// Import to extend Express Request type with user property
require("./auth.middleware");
/**
 * Role hierarchy: ADMIN > PRO > WRITER > USER
 */
const ROLE_HIERARCHY = {
    USER: 1,
    WRITER: 2,
    PRO: 3,
    ADMIN: 4,
};
/**
 * Role-based authorization middleware factory
 * Verifica se o usuário tem uma das roles permitidas
 *
 * @param allowedRoles - Roles que podem acessar a rota
 * @returns Express middleware
 *
 * @example
 * // Apenas ADMIN
 * router.get('/admin', authenticate, requireRole('ADMIN'), handler);
 *
 * // WRITER, PRO ou ADMIN
 * router.post('/books', authenticate, requireRole('WRITER', 'PRO', 'ADMIN'), handler);
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        // Verifica se o usuário está autenticado (authenticate middleware deve ter rodado antes)
        if (!req.user) {
            res.status(401).json({
                error: 'Usuário não autenticado',
                code: 'NOT_AUTHENTICATED',
            });
            return;
        }
        const userRole = req.user.role;
        // Verifica se a role do usuário está na lista de roles permitidas
        if (!allowedRoles.includes(userRole)) {
            // Audit log - permission denied
            Promise.resolve().then(() => __importStar(require('../services/audit.service'))).then(({ auditService }) => {
                auditService.logPermissionDenied(req.user.id, req.user.email, req.originalUrl, `Required roles: ${allowedRoles.join(', ')}, User role: ${userRole}`).catch(err => console.error('[AUDIT]', err));
            });
            res.status(403).json({
                error: 'Acesso negado. Você não tem permissão para acessar este recurso.',
                code: 'INSUFFICIENT_ROLE',
                required: allowedRoles,
                current: userRole,
            });
            return;
        }
        next();
    };
}
/**
 * Middleware que requer uma role mínima baseada na hierarquia
 * Útil quando qualquer role acima de um nível pode acessar
 *
 * @param minimumRole - Role mínima necessária
 * @returns Express middleware
 *
 * @example
 * // WRITER ou superior (WRITER, PRO, ADMIN)
 * router.post('/chapters', authenticate, requireMinimumRole('WRITER'), handler);
 */
function requireMinimumRole(minimumRole) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Usuário não autenticado',
                code: 'NOT_AUTHENTICATED',
            });
            return;
        }
        const userRole = req.user.role;
        const userLevel = ROLE_HIERARCHY[userRole];
        const requiredLevel = ROLE_HIERARCHY[minimumRole];
        if (userLevel < requiredLevel) {
            // Audit log - permission denied
            Promise.resolve().then(() => __importStar(require('../services/audit.service'))).then(({ auditService }) => {
                auditService.logPermissionDenied(req.user.id, req.user.email, req.originalUrl, `Required minimum role: ${minimumRole}, User role: ${userRole}`).catch(err => console.error('[AUDIT]', err));
            });
            res.status(403).json({
                error: 'Acesso negado. Você precisa de um nível de acesso maior.',
                code: 'INSUFFICIENT_ROLE_LEVEL',
                required: minimumRole,
                current: userRole,
            });
            return;
        }
        next();
    };
}
/**
 * Middleware para verificar se o usuário é admin
 * Atalho para requireRole('ADMIN')
 */
exports.requireAdmin = requireRole('ADMIN');
/**
 * Middleware para verificar se o usuário é escritor ou superior
 * Atalho para requireMinimumRole('WRITER')
 */
exports.requireWriter = requireMinimumRole('WRITER');
/**
 * Middleware para verificar se o usuário é PRO ou superior
 * Atalho para requireMinimumRole('PRO')
 */
exports.requirePro = requireMinimumRole('PRO');
