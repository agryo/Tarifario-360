import { Injectable } from '@angular/core';
import { getSupabaseDirect } from '../supabase-direct-client';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

export interface ConfigGeralRepository {
  get(): Promise<ConfiguracaoGeral | null>;
  update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseDirectConfigGeralRepository implements ConfigGeralRepository {
  private getClient() {
    const client = getSupabaseDirect();
    if (!client) {
      throw new Error('Supabase Direct Client não disponível em produção');
    }
    return client['client'];
  }

  private mapRow(row: any): ConfiguracaoGeral {
    return {
      festividade: row.festividade,
      totalUhs: row.total_uhs,
      comodidadesGlobais: row.comodidades_globais,
      precos: row.precos,
      temporada: row.temporada,
      horarios: row.horarios,
      promocao: row.promocao,
      seguranca: row.seguranca,
      orcamento: row.orcamento,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapConfig(config: Partial<ConfiguracaoGeral>): any {
    const result: any = {};
    if (config.festividade !== undefined) result.festividade = config.festividade;
    if (config.totalUhs !== undefined) result.total_uhs = config.totalUhs;
    if (config.comodidadesGlobais !== undefined) result.comodidades_globais = config.comodidadesGlobais;
    if (config.precos !== undefined) result.precos = config.precos;
    if (config.temporada !== undefined) result.temporada = config.temporada;
    if (config.horarios !== undefined) result.horarios = config.horarios;
    if (config.promocao !== undefined) result.promocao = config.promocao;
    if (config.seguranca !== undefined) result.seguranca = config.seguranca;
    if (config.orcamento !== undefined) result.orcamento = config.orcamento;
    if (config.criado_em !== undefined) result.criado_em = config.criado_em;
    if (config.atualizado_em !== undefined) result.atualizado_em = config.atualizado_em;
    return result;
  }

  async get(): Promise<ConfiguracaoGeral | null> {
    const { data, error } = await this.getClient()
      .from('config_geral')
      .select('*')
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapRow(data) : null;
  }

  async update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral> {
    const { data, error } = await this.getClient()
      .from('config_geral')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    const { data: result, error: insertError } = await this.getClient()
      .from('config_geral')
      .insert({ ...this.unmapConfig(config), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select()
      .single();
    if (insertError) throw insertError;
    return this.mapRow(result);
  }
}