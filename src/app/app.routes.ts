import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/auth/auth.guard';

// loadComponent = lazy loading: cada tela vira um "chunk" baixado só quando é aberta.
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [visitanteGuard],
    title: 'Entrar | Rende',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard | Rende',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'pedidos',
        title: 'Pedidos | Rende',
        loadComponent: () => import('./features/pedidos/pedidos.component').then((m) => m.PedidosComponent),
      },
      {
        path: 'recebiveis',
        title: 'Recebíveis | Rende',
        loadComponent: () => import('./features/recebiveis/recebiveis.component').then((m) => m.RecebiveisComponent),
      },
      {
        path: 'cobrancas/nova',
        title: 'Nova cobrança | Rende',
        loadComponent: () => import('./features/cobranca/nova-cobranca.component').then((m) => m.NovaCobrancaComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
