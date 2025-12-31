"use strict";
/**
 * Middleware Barrel File
 *
 * Exports all middleware for easy importing throughout the application.
 *
 * @example
 * import { authenticate, requireRole, requireFeature, checkLimit } from '../middleware';
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMITS = exports.getRateLimitInfo = exports.rateLimit = exports.PLAN_LIMITS = exports.getPlanLimits = exports.isPro = exports.isPremiumOrAbove = exports.loadPlanInfo = exports.checkLimit = exports.requireFeature = exports.requirePro = exports.requireWriter = exports.requireAdmin = exports.requireMinimumRole = exports.requireRole = exports.authorize = exports.optionalAuth = exports.authenticate = void 0;
// Authentication middleware
var auth_middleware_1 = require("./auth.middleware");
Object.defineProperty(exports, "authenticate", { enumerable: true, get: function () { return auth_middleware_1.authenticate; } });
Object.defineProperty(exports, "optionalAuth", { enumerable: true, get: function () { return auth_middleware_1.optionalAuth; } });
Object.defineProperty(exports, "authorize", { enumerable: true, get: function () { return auth_middleware_1.authorize; } });
// Role-based authorization middleware
var role_middleware_1 = require("./role.middleware");
Object.defineProperty(exports, "requireRole", { enumerable: true, get: function () { return role_middleware_1.requireRole; } });
Object.defineProperty(exports, "requireMinimumRole", { enumerable: true, get: function () { return role_middleware_1.requireMinimumRole; } });
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return role_middleware_1.requireAdmin; } });
Object.defineProperty(exports, "requireWriter", { enumerable: true, get: function () { return role_middleware_1.requireWriter; } });
Object.defineProperty(exports, "requirePro", { enumerable: true, get: function () { return role_middleware_1.requirePro; } });
// Plan limits and feature gating middleware
var plan_limits_middleware_1 = require("./plan-limits.middleware");
Object.defineProperty(exports, "requireFeature", { enumerable: true, get: function () { return plan_limits_middleware_1.requireFeature; } });
Object.defineProperty(exports, "checkLimit", { enumerable: true, get: function () { return plan_limits_middleware_1.checkLimit; } });
Object.defineProperty(exports, "loadPlanInfo", { enumerable: true, get: function () { return plan_limits_middleware_1.loadPlanInfo; } });
Object.defineProperty(exports, "isPremiumOrAbove", { enumerable: true, get: function () { return plan_limits_middleware_1.isPremiumOrAbove; } });
Object.defineProperty(exports, "isPro", { enumerable: true, get: function () { return plan_limits_middleware_1.isPro; } });
Object.defineProperty(exports, "getPlanLimits", { enumerable: true, get: function () { return plan_limits_middleware_1.getPlanLimits; } });
Object.defineProperty(exports, "PLAN_LIMITS", { enumerable: true, get: function () { return plan_limits_middleware_1.PLAN_LIMITS; } });
// Rate limiting middleware
var rate_limit_middleware_1 = require("./rate-limit.middleware");
Object.defineProperty(exports, "rateLimit", { enumerable: true, get: function () { return rate_limit_middleware_1.rateLimit; } });
Object.defineProperty(exports, "getRateLimitInfo", { enumerable: true, get: function () { return rate_limit_middleware_1.getRateLimitInfo; } });
Object.defineProperty(exports, "RATE_LIMITS", { enumerable: true, get: function () { return rate_limit_middleware_1.RATE_LIMITS; } });
