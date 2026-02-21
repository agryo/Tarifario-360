import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: Dashboard },
  {
    path: 'tabela-precos',
    loadComponent: () =>
      import('./pages/tabela-precos/tabela-precos').then((m) => m.TabelaPrecosComponent),
  },
  {
    path: 'wallbox',
    loadComponent: () => import('./pages/wallbox/wallbox').then((m) => m.WallboxComponent),
  },
];
