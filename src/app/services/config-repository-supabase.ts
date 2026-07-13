import { Injectable } from '@angular/core';
import { ConfigRepository } from './config-repository';
import { supabaseApi } from './supabase-client';

/**
 * Implementação usando Supabase via Vercel API Routes.
 *
 * Tabela necessária no Supabase (já criada via migration 001_initial_schema.sql):
 *
 * CREATE TABLE configuracoes (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   categoria TEXT NOT NULL,
 *   chave TEXT NOT NULL,
 *   dados JSONB NOT NULL,
 *   criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   UNIQUE(categoria, chave)
 * );
 *
 * CREATE INDEX idx_config_dados_gin ON configuracoes USING GIN (dados);
 * CREATE INDEX idx_config_categoria ON configuracoes (categoria);
 */
@Injectable({ providedIn: 'root' })
export class SupabaseConfigRepository implements ConfigRepository {
  async get<T>(categoria: string, chave: string): Promise<T | null> {
    try {
      return await supabaseApi.getConfig<T>(categoria, chave);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async set<T>(categoria: string, chave: string, dados: T): Promise<void> {
    await supabaseApi.setConfig(categoria, chave, dados);
  }

  async list(categoria: string): Promise<Array<{ chave: string; dados: any }>> {
    const result = await supabaseApi.listConfig(categoria);
    return Object.entries(result).map(([chave, dados]) => ({ chave, dados }));
  }

  async delete(categoria: string, chave: string): Promise<void> {
    await supabaseApi.deleteConfig(categoria, chave);
  }

  async clearCategoria(categoria: string): Promise<void> {
    await supabaseApi.clearConfig(categoria);
  }
}