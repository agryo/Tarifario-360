import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: Dashboard },
  // Comente as outras rotas por enquanto
  // { path: 'tarifas', loadComponent: () => import('./pages/tarifas/tarifas').then(m => m.TarifasComponent) },
];
