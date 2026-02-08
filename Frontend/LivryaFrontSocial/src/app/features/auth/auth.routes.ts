import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';
import { authGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Entrar | Sistema de Narração'
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent),
    title: 'Criar Conta | Sistema de Narração'
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Recuperar Senha | Sistema de Narração'
  },
  // Redirect to social profile to avoid duplicate routes
  {
    path: 'profile',
    redirectTo: '/social/profile',
    pathMatch: 'full'
  },
  // SSO OAuth2 authorization endpoint
  {
    path: 'sso/authorize',
    loadComponent: () => import('./pages/sso-authorize/sso-authorize.component').then(m => m.SsoAuthorizeComponent),
    title: 'Autorizar Aplicação | Livrya'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
