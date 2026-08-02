import { Injectable } from '@angular/core';
import { getSupabaseClient } from '../../services/supabase-client';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

export interface ConfigGeralRepository {
  get(): Promise<ConfiguracaoGeral | null>;
  update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseDirectConfigGeralRepository implements ConfigGeralRepository {
  private getClient() {
    return getSupabaseClient();
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

  private toCamelCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((v) => this.toCamelCase(v));
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = this.toCamelCase(value);
    }
    return result;
  }

  private toSnakeCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((v) => this.toSnakeCase(v));
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = this.toSnakeCase(value);
    }
    return result;
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
    // SEMPRE incluir seguranca para evitar DEFAULT do banco sobrescrever
    result.seguranca = config.seguranca ?? { senhaHash: '', senhaSalt: '' };
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