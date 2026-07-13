import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { EscalaConfig } from '../../models/escala-config.model';

export interface EscalaRepository {
  get(): Promise<EscalaConfig | null>;
  update(configuracao: EscalaConfig): Promise<EscalaConfig>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseEscalaRepository implements EscalaRepository {
  async get(): Promise<EscalaConfig | null> {
    try {
      return await supabaseApi.getEscala();
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async update(configuracao: EscalaConfig): Promise<EscalaConfig> {
    return supabaseApi.updateEscala(configuracao);
  }
}
