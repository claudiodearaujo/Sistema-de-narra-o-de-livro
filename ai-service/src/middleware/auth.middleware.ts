import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { serverConfig } from '../config/server.config';
import { prisma } from '../services/prisma';

export interface AuthUser {
    userId: string;
    clientId: string;
    permissions: string[];
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthUser;
        }
    }
}

/**
 * Authenticate via API Key or JWT Token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Check for API Key first
        const apiKey = req.headers['x-api-key'] as string;
        if (apiKey) {
            const keyHash = createHash('sha256').update(apiKey).digest('hex');

            const keyRecord = await prisma.apiKey.findUnique({
                where: { keyHash },
            });

            if (!keyRecord) {
                res.status(401).json({ error: 'Invalid API key' });
                return;
            }

            if (!keyRecord.isActive) {
                res.status(401).json({ error: 'API key is disabled' });
                return;
            }

            if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
                res.status(401).json({ error: 'API key has expired' });
                return;
            }

            // Update last used timestamp
            await prisma.apiKey.update({
                where: { id: keyRecord.id },
                data: { lastUsedAt: new Date() },
            });

            // Get userId from header or use client name
            const userId = req.headers['x-user-id'] as string || keyRecord.name;

            req.auth = {
                userId,
                clientId: keyRecord.id,
                permissions: keyRecord.permissions as string[],
            };

            next();
            return;
        }

        // Check for JWT Bearer token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            try {
                const decoded = jwt.verify(token, serverConfig.jwtSecret) as {
                    userId: string;
                    clientId?: string;
                };

                req.auth = {
                    userId: decoded.userId,
                    clientId: decoded.clientId || 'jwt-client',
                    permissions: ['*'], // JWT tokens have full permissions
                };

                next();
                return;
            } catch (err) {
                res.status(401).json({ error: 'Invalid or expired token' });
                return;
            }
        }

        res.status(401).json({
            error: 'Authentication required',
            hint: 'Provide X-Api-Key header or Bearer token',
        });
    } catch (error: any) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}

/**
 * Check if user has required permission
 */
export function requirePermission(...permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.auth) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Wildcard permission grants all access
        if (req.auth.permissions.includes('*')) {
            next();
            return;
        }

        const hasPermission = permissions.some(p =>
            req.auth!.permissions.includes(p)
        );

        if (!hasPermission) {
            res.status(403).json({
                error: 'Permission denied',
                required: permissions,
                current: req.auth.permissions,
            });
            return;
        }

        next();
    };
}

/**
 * Admin permission check
 */
export const requireAdmin = requirePermission('admin', '*');
