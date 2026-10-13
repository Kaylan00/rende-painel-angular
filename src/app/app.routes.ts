import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/auth/auth.guard';

// loadComponent = lazy loading: cada tela vira um "chunk" baixado só quando é aberta.
export const routes: Routes = [
  {
    // landing pública: só a raiz exata
    path: '',
    pathMatch: 'full',
    title: 'Rende | Delivery próprio, sem comissão por pedido',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'entrar',
    canActivate: [visitanteGuard],
    title: 'Entrar | Rende',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  // endereço antigo do login continua funcionando
  { path: 'login', redirectTo: 'entrar' },
  {
    // painel: tudo aqui dentro exige sessão
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        title: 'Resumo | Rende',
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
