import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'flags',
    loadComponent: () =>
      import('./features/flags/flags-list.component').then((m) => m.FlagsListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'flags/:id',
    loadComponent: () =>
      import('./features/flags/flag-detail.component').then((m) => m.FlagDetailComponent),
    canActivate: [authGuard],
  },
];
