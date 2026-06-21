import { Injectable } from '@angular/core';
import { ConfigRepository } from './config-repository';

/**
 * Implementação usando Supabase (PostgreSQL + JSONB) - para uso futuro.
 *
 * Tabela necessária no Supabase:
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
 * -- Índice para busca rápida dentro do JSONB
 * CREATE INDEX idx_config_dados_gin ON configuracoes USING GIN (dados);
 *
 * -- Habilitar RLS (Row Level Security) se necessário
 * ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
 */
@Injectable({ providedIn: 'root' })
export class SupabaseConfigRepository implements ConfigRepository {
  // private supabase: SupabaseClient; // Injetar via construtor quando usar

  constructor() {
    // TODO: Injetar SupabaseClient quando migrar
    // this.supabase = inject(SupabaseClient);
  }

  async get<T>(categoria: string, chave: string): Promise<T | null> {
    // const { data, error } = await this.supabase
    //   .from('configuracoes')
    //   .select('dados')
    //   .eq('categoria', categoria)
    //   .eq('chave', chave)
    //   .single();
    //
    // if (error || !data) return null;
    // return data.dados as T;

    console.warn('SupabaseConfigRepository não implementado - usando fallback');
    return null;
  }

  async set<T>(categoria: string, chave: string, dados: T): Promise<void> {
    // const { error } = await this.supabase
    //   .from('configuracoes')
    //   .upsert({
    //     categoria,
    //     chave,
    //     dados,
    //     atualizado_em: new Date().toISOString()
    //   }, { onConflict: 'categoria,chave' });
    //
    // if (error) throw error;

    console.warn('SupabaseConfigRepository não implementado');
  }

  async list(categoria: string): Promise<Array<{ chave: string; dados: any }>> {
    // const { data, error } = await this.supabase
    //   .from('configuracoes')
    //   .select('chave, dados')
    //   .eq('categoria', categoria);
    //
    // if (error) throw error;
    // return data?.map(d => ({ chave: d.chave, dados: d.dados })) ?? [];

    console.warn('SupabaseConfigRepository não implementado');
    return [];
  }

  async delete(categoria: string, chave: string): Promise<void> {
    // const { error } = await this.supabase
    //   .from('configuracoes')
    //   .delete()
    //   .eq('categoria', categoria)
    //   .eq('chave', chave);
    //
    // if (error) throw error;

    console.warn('SupabaseConfigRepository não implementado');
  }

  async clearCategoria(categoria: string): Promise<void> {
    // const { error } = await this.supabase
    //   .from('configuracoes')
    //   .delete()
    //   .eq('categoria', categoria);
    //
    // if (error) throw error;

    console.warn('SupabaseConfigRepository não implementado');
  }
}