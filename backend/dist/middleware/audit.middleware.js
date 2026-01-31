"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditContext = auditContext;
/**
 * Middleware que captura contexto de auditoria de cada request
 * Deve ser registrado ANTES de outros middlewares
 */
function auditContext() {
    return (req, res, next) => {
        const startTime = Date.now();
        // Captura IP real (considerando proxies)
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
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
        res.end = function (...args) {
            if (req.auditContext) {
                req.auditContext.statusCode = res.statusCode;
                req.auditContext.duration = Date.now() - startTime;
            }
            return originalEnd.apply(this, args);
        };
        next();
    };
}
