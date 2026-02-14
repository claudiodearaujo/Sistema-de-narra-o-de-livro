import type { DecodedToken } from '../utils/jwt.utils';

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
      user?: DecodedToken;
    }
  }
}

export {};
