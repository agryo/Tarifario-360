import { Injectable } from '@angular/core';
import { ConfigRepository } from './config-repository';
import { getSupabaseDirect } from './supabase-direct-client';
import { environment } from '../../environments/environment';

/**
 * Implementação usando Supabase direto (para desenvolvimento local).
 * Em produção, usa SupabaseConfigRepository via Vercel API Routes.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseDirectConfigRepository implements ConfigRepository {
  private getClient() {
    const client = getSupabaseDirect();
    if (!client) {
      throw new Error('Supabase Direct Client não disponível em produção');
    }
    return client['client'];
  }

  async get<T>(categoria: string, chave: string): Promise<T | null> {
    try {
      const { data, error } = await this.getClient()
        .from('configuracoes')
        .select('dados')
        .eq('categoria', categoria)
        .eq('chave', chave)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data?.dados as T ?? null;
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('Not found') || error.code === 'PGRST116') return null;
      throw error;
    }
  }

  async set<T>(categoria: string, chave: string, dados: T): Promise<void> {
    const { error } = await this.getClient()
      .from('configuracoes')
      .upsert({
        categoria,
        chave,
        dados,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'categoria,chave' });
    if (error) throw error;
  }

  async list(categoria: string): Promise<Array<{ chave: string; dados: any }>> {
    const { data, error } = await this.getClient()
      .from('configuracoes')
      .select('chave, dados')
      .eq('categoria', categoria);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ chave: row.chave, dados: row.dados }));
  }

  async delete(categoria: string, chave: string): Promise<void> {
    const { error } = await this.getClient()
      .from('configuracoes')
      .delete()
      .eq('categoria', categoria)
      .eq('chave', chave);
    if (error) throw error;
  }

  async clearCategoria(categoria: string): Promise<void> {
    const { error } = await this.getClient()
      .from('configuracoes')
      .delete()
      .eq('categoria', categoria);
    if (error) throw error;
  }
}

/**
 * Factory que escolhe a implementação baseada no ambiente
 */
export function getConfigRepositoryBackend(): 'local' | 'supabase' | 'supabase-direct' {
  if (environment.production) {
    return 'supabase'; // Vercel API Routes
  }
  // Em desenvolvimento, usa Supabase direto se configurado
  if (environment.supabaseUrl && environment.supabaseAnonKey) {
    return 'supabase-direct';
  }
  return 'local'; // Fallback para localStorage
}