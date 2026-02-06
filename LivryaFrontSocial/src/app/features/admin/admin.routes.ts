import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'audit-logs',
    pathMatch: 'full'
  },
  {
    path: 'audit-logs',
    loadComponent: () => import('./pages/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
    title: 'Audit Logs | Admin'
  }
];
