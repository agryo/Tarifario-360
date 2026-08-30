import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

export type { ConfigGeralRepository } from './repository-interfaces';
import { ConfigGeralRepository } from './repository-interfaces';

@Injectable({ providedIn: 'root' })
export class SupabaseConfigGeralRepository implements ConfigGeralRepository {
  async get(): Promise<ConfiguracaoGeral | null> {
    try {
      // A API /api/config-geral já retorna camelCase (mapConfigGeral) e trata PGRST116 -> null
      return await supabaseApi.getConfigGeral();
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral> {
    // A API /api/config-geral já converte camelCase -> snake_case internamente (toSnakeCase)
    return supabaseApi.updateConfigGeral(config);
  }
}