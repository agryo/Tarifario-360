import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';
import { routes } from './app.routes';
import { SupabaseDirectConfigRepository } from './services/config-repository-supabase-direct';
import { SupabaseConfigRepository } from './services/config-repository-supabase';
import { LocalStorageConfigRepository } from './services/config-repository-local';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: '.my-app-dark',
        },
      },
    }),
    LocalStorageConfigRepository,
    SupabaseConfigRepository,
    SupabaseDirectConfigRepository,
  ],
};
