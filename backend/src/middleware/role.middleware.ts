import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// Import to extend Express Request type with user property
import './auth.middleware';

/**
 * Role hierarchy: ADMIN > PRO > WRITER > USER
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
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
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verifica se o usuário está autenticado (authenticate middleware deve ter rodado antes)
    if (!req.user) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    const userRole = req.user.role as UserRole;

    // Verifica se a role do usuário está na lista de roles permitidas
    if (!allowedRoles.includes(userRole)) {
      // Audit log - permission denied
      import('../services/audit.service').then(({ auditService }) => {
        auditService.logPermissionDenied(
          req.user!.id,
          req.user!.email,
          req.originalUrl,
          `Required roles: ${allowedRoles.join(', ')}, User role: ${userRole}`
        ).catch(err => console.error('[AUDIT]', err));
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
export function requireMinimumRole(minimumRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    const userLevel = ROLE_HIERARCHY[userRole];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      // Audit log - permission denied
      import('../services/audit.service').then(({ auditService }) => {
        auditService.logPermissionDenied(
          req.user!.id,
          req.user!.email,
          req.originalUrl,
          `Required minimum role: ${minimumRole}, User role: ${userRole}`
        ).catch(err => console.error('[AUDIT]', err));
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
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware para verificar se o usuário é escritor ou superior
 * Atalho para requireMinimumRole('WRITER')
 */
export const requireWriter = requireMinimumRole('WRITER');

/**
 * Middleware para verificar se o usuário é PRO ou superior
 * Atalho para requireMinimumRole('PRO')
 */
export const requirePro = requireMinimumRole('PRO');
