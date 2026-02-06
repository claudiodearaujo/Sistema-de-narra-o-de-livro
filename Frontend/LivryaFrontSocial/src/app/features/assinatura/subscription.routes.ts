/**
 * Subscription Routes
 * Sprint 9: Planos e Pagamentos
 */
import { Routes } from '@angular/router';

export const subscriptionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-subscription-page/my-subscription-page.component').then(
        (m) => m.MySubscriptionPageComponent
      ),
    title: 'Minha Assinatura | Livrya'
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./pages/plans-page/plans-page.component').then(
        (m) => m.PlansPageComponent
      ),
    title: 'Planos de Assinatura | Livrya'
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./pages/success-page/success-page.component').then(
        (m) => m.SuccessPageComponent
      ),
    title: 'Assinatura Confirmada | Livrya'
  },
  {
    path: 'livras',
    loadComponent: () =>
      import('./pages/livras-page/livras-page.component').then(
        (m) => m.LivrasPageComponent
      ),
    title: 'Comprar Livras | Livrya'
  },
  {
    path: 'livras/success',
    loadComponent: () =>
      import('./pages/livra-success-page/livra-success-page.component').then(
        (m) => m.LivraSuccessPageComponent
      ),
    title: 'Compra de Livras Confirmada | Livrya'
  },
];

