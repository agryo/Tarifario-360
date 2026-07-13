import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

export interface ConfigGeralRepository {
  get(): Promise<ConfiguracaoGeral | null>;
  update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseConfigGeralRepository implements ConfigGeralRepository {
  async get(): Promise<ConfiguracaoGeral | null> {
    try {
      return await supabaseApi.getConfigGeral();
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral> {
    return supabaseApi.updateConfigGeral(config);
  }
}