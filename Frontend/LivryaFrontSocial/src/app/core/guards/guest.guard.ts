import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/features/auth/services/auth.service';

/**
 * Guard that prevents authenticated users from accessing guest-only pages.
 * Useful for login/signup pages - redirects authenticated users to dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasToken() || authService.isTokenExpired()) {
    return true;
  }

  return router.createUrlTree(['/social']);
};
