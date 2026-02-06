import { Routes } from '@angular/router';

export const achievementRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/achievements-page/achievements-page.component')
      .then(m => m.AchievementsPageComponent),
    title: 'Conquistas | Livrya'
  }
];
