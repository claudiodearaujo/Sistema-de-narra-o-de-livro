/**
 * Middleware Barrel File
 * 
 * Exports all middleware for easy importing throughout the application.
 * 
 * @example
 * import { authenticate, requireRole, requireFeature, checkLimit } from '../middleware';
 */

// Authentication middleware
export { 
  authenticate, 
  optionalAuth, 
  authorize 
} from './auth.middleware';

// Role-based authorization middleware
export { 
  requireRole, 
  requireMinimumRole, 
  requireAdmin, 
  requireWriter, 
  requirePro 
} from './role.middleware';

// Plan limits and feature gating middleware
export { 
  requireFeature, 
  checkLimit, 
  loadPlanInfo,
  isPremiumOrAbove,
  isPro,
  getPlanLimits,
  PLAN_LIMITS,
  type PlanLimits 
} from './plan-limits.middleware';
