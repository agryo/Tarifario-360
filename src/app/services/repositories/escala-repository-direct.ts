import { Injectable } from '@angular/core';
import { getSupabaseClient } from '../../services/supabase-client';
import { EscalaConfig } from '../../models/escala-config.model';
import { EscalaRepository } from './repository-interfaces';

@Injectable({ providedIn: 'root' })
export class SupabaseDirectEscalaRepository implements EscalaRepository {
  private getClient() {
    return getSupabaseClient();
  }

  async get(): Promise<EscalaConfig | null> {
    const { data, error } = await this.getClient()
      .from('escala_config')
      .select('configuracao')
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.configuracao ?? null;
  }

  async update(config: Partial<EscalaConfig>): Promise<EscalaConfig> {
    // First get the current config to merge with updates
    const current = await this.get();
    const merged = { ...current, ...config };

    const { data, error } = await this.getClient()
      .from('escala_config')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    const { data: result, error: insertError } = await this.getClient()
      .from('escala_config')
      .insert({ configuracao: merged, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select('configuracao')
      .single();
    if (insertError) throw insertError;
    return result?.configuracao ?? null;
  }
}