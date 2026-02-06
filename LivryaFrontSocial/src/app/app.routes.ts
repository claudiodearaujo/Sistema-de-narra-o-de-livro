import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

/**
 * Application Root Routes
 *
 * Structure:
 * - /institutional/* - Public institutional pages (about, terms, privacy, etc.)
 * - /auth/*          - Authentication pages (login, signup, forgot-password, profile)
 * - /writer/*        - Writer Area with MainLayout
 * - /livras/*        - Livras management with MainLayout
 * - /subscription/*  - Subscription management with MainLayout
 * - /achievements/*  - Achievements with MainLayout
 * - /social/*        - Social Network with SocialLayout
 * - /unauthorized    - Access denied page
 * - /                - Redirects to /institutional/about (home page)
 */
export const routes: Routes = [
  // Authentication Routes (public)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Unauthorized page
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    title: 'Acesso Negado'
  },

  // Institutional Module (Public pages) - MOVED UP to be accessible before auth guard
  {
    path: 'institutional',
    loadChildren: () => import('./features/institutional/institutional.routes').then(m => m.INSTITUTIONAL_ROUTES)
  },

  // Default redirect - MOVED UP to match before empty path with authGuard
  // CRITICAL: This must come BEFORE the MainLayout route with empty path
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'institutional'
  },

  // Social Module (protected) - Has its own SocialLayout
  {
    path: 'social',
    canActivate: [authGuard],
    loadChildren: () => import('./features/social/social.routes').then(m => m.SOCIAL_ROUTES)
  },

  // Protected routes with MainLayout
  // MOVED DOWN so it doesn't intercept root path before redirect
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      // Writer Module (role-protected)
      {
        path: 'writer',
        canActivate: [roleGuard],
        data: { roles: ['WRITER', 'ADMIN'] },
        loadChildren: () => import('./features/writer/writer.routes').then(m => m.WRITER_ROUTES)
      },
      // Subscription Module (Sprint 9)
      {
        path: 'subscription',
        loadChildren: () => import('./features/assinatura/subscription.routes').then(m => m.subscriptionRoutes)
      },
      // Achievements Module (Sprint 10)
      {
        path: 'achievements',
        loadChildren: () => import('./features/achievements/achievements.routes').then(m => m.achievementRoutes)
      },
      // Admin Module
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  },

  // Wildcard redirect
  {
    path: '**',
    redirectTo: 'institutional'
  }
];
