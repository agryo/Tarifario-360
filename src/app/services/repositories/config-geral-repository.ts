import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

export interface ConfigGeralRepository {
  get(): Promise<ConfiguracaoGeral | null>;
  update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseConfigGeralRepository implements ConfigGeralRepository {
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
    try {
      const data = await supabaseApi.getConfigGeral();
      return data ? this.mapRow(data) : null;
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral> {
    const result = await supabaseApi.updateConfigGeral(this.unmapConfig(config));
    return this.mapRow(result);
  }
}