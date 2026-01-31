import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que captura contexto de auditoria de cada request
 * Deve ser registrado ANTES de outros middlewares
 */
export function auditContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Captura IP real (considerando proxies)
    const ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      req.ip;

    // Anexa contexto de auditoria ao request
    req.auditContext = {
      ipAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      endpoint: req.originalUrl || req.url,
      startTime,
    };

    // Intercepta o fim da resposta para capturar statusCode e duração
    const originalEnd = res.end;
    res.end = function (this: Response, ...args: any[]): Response {
      if (req.auditContext) {
        req.auditContext.statusCode = res.statusCode;
        req.auditContext.duration = Date.now() - startTime;
      }
      return originalEnd.apply(this, args as any);
    };

    next();
  };
}
