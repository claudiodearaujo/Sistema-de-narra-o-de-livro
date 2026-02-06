import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from 'src/app/features/auth/services/auth.service';

/**
 * Guard that protects routes requiring authentication.
 * Redirects to login page if user is not authenticated.
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasToken = authService.hasToken();
  const isExpired = authService.isTokenExpired();

  if (hasToken && !isExpired) {
    console.log('[AuthGuard] Access granted');
    return true;
  }

  console.log('[AuthGuard] Access denied, redirecting to login');
  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl }
  });
};

/**
 * Guard that checks for specific user roles.
 * Use with route data: { roles: ['ADMIN', 'WRITER'] }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const userRole = authService.userRole();

  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }
  
  // Redirect to unauthorized page or dashboard
  return router.createUrlTree(['/unauthorized']);
};

/**
 * Guard that ensures user email is verified.
 * Redirects to social feed if not verified, showing a warning.
 *
 * Usage: Apply to routes that require email verification (e.g., creating posts, purchasing livras)
 * Example:
 * {
 *   path: 'create-post',
 *   canActivate: [authGuard, verifiedGuard],
 *   component: CreatePostComponent
 * }
 */
export const verifiedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (user?.isVerified) {
    return true;
  }

  // Redirect to social feed instead of returning false to avoid blank screen
  // The component should handle showing a verification warning
  console.warn('[VerifiedGuard] User email not verified, redirecting to feed');
  return router.createUrlTree(['/social/feed'], {
    queryParams: { verificationRequired: 'true' }
  });
};
