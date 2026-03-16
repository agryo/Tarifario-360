import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: Dashboard,
    children: [
      {
        path: '', // Rota padrão exibe o grid de módulos
        loadComponent: () =>
          import('./pages/modulos-grid/modulos-grid').then((m) => m.ModulosGridComponent),
      },
      {
        path: 'orcamento-rapido',
        loadComponent: () =>
          import('./pages/orcamento-rapido/orcamento-rapido').then(
            (m) => m.OrcamentoRapidoComponent,
          ),
      },
      {
        path: 'tabela-precos',
        loadComponent: () =>
          import('./pages/tabela-precos/tabela-precos').then((m) => m.TabelaPrecosComponent),
      },
      {
        path: 'tabela-opcoes',
        loadComponent: () =>
          import('./pages/tabela-opcoes/tabela-opcoes').then((m) => m.TabelaOpcoesComponent),
      },
      {
        path: 'orcamento-oficial',
        loadComponent: () =>
          import('./pages/orcamento-oficial/orcamento-oficial').then(
            (m) => m.OrcamentoOficialComponent,
          ),
      },
      {
        path: 'wallbox',
        loadComponent: () => import('./pages/wallbox/wallbox').then((m) => m.WallboxComponent),
      },
      {
        path: 'escala-noturna',
        loadComponent: () =>
          import('./pages/escala-noturna/escala-noturna').then((m) => m.EscalaNoturnaComponent),
      },
    ],
  },
];
