import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, DecodedToken } from '../utils/jwt.utils';
import { UserRole } from '@prisma/client';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
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
    import('../services/audit.service').then(({ auditService }) => {
      auditService.log({
        userId: 'system',
        userEmail: 'anonymous',
        action: 'AUTH_FAILURE' as any,
        category: 'SECURITY' as any,
        severity: 'LOW' as any,
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
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    // Audit log - invalid/expired token
    import('../services/audit.service').then(({ auditService }) => {
      auditService.log({
        userId: 'system',
        userEmail: 'anonymous',
        action: 'AUTH_FAILURE' as any,
        category: 'SECURITY' as any,
        severity: 'LOW' as any,
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
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    const token = parts[1];
    const decoded = verifyAccessToken(token);
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
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Autenticação necessária',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Audit log - unauthorized access attempt
      import('../services/audit.service').then(({ auditService }) => {
        auditService.logPermissionDenied(
          req.user!.id,
          req.user!.email,
          req.originalUrl,
          `Required roles: ${allowedRoles.join(', ')}, User role: ${req.user!.role}`
        ).catch(err => console.error('[AUDIT]', err));
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
export const adminOnly = authorize(UserRole.ADMIN);

/**
 * Shorthand for writer and admin routes
 */
export const writerOrAdmin = authorize(UserRole.WRITER, UserRole.ADMIN);
