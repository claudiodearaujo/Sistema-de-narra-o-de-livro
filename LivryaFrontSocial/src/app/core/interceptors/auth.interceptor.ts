import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { Router } from '@angular/router';
import { AuthService } from 'src/app/features/auth/services/auth.service';

/**
 * HTTP Interceptor that:
 * 1. Attaches JWT token to outgoing requests
 * 2. Handles 401 errors by attempting token refresh
 * 3. Redirects to login on authentication failure
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for public endpoints
  const publicEndpoints = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh'
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  // Clone request with auth header if token exists and not a public endpoint
  let authReq = req;
  const token = authService.getToken();

  if (token && !isPublicEndpoint) {
    authReq = addTokenToRequest(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !isPublicEndpoint) {
        // Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap(response => {
            // Retry the failed request with new token
            const retryReq = addTokenToRequest(req, response.accessToken);
            return next(retryReq);
          }),
          catchError(refreshError => {
            // Refresh failed, logout user
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // Handle 403 Forbidden
      if (error.status === 403) {
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Helper function to clone request with Authorization header
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
