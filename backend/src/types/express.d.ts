import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        ipAddress?: string;
        userAgent?: string;
        method: string;
        endpoint: string;
        statusCode?: number;
        startTime: number;
        duration?: number;
      };
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
