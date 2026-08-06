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
    const rawSeguranca = row.seguranca;
    // Check if seguranca is null/undefined OR an empty object (which would cause merge to fallback to defaults)
    const hasSegurancaData = rawSeguranca && typeof rawSeguranca === 'object' && Object.keys(rawSeguranca).length > 0;
    return {
      festividade: row.festividade,
      totalUhs: row.total_uhs,
      comodidadesGlobais: row.comodidades_globais,
      precos: this.toCamelCase(row.precos),
      temporada: this.toCamelCase(row.temporada),
      horarios: this.toCamelCase(row.horarios),
      promocao: this.toCamelCase(row.promocao),
      // IMPORTANTE: Se seguranca vier null/undefined OU objeto vazio do banco, retorna objeto com strings vazias
      // para evitar que o merge posterior caia no default "1234"
      seguranca: hasSegurancaData ? this.toCamelCase(rawSeguranca) : { senhaHash: '', senhaSalt: '' },
      orcamento: this.toCamelCase(row.orcamento),
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
    if (config.precos !== undefined) result.precos = this.toSnakeCase(config.precos);
    if (config.temporada !== undefined) result.temporada = this.toSnakeCase(config.temporada);
    if (config.horarios !== undefined) result.horarios = this.toSnakeCase(config.horarios);
    if (config.promocao !== undefined) result.promocao = this.toSnakeCase(config.promocao);
    // SEMPRE incluir seguranca para evitar DEFAULT do banco sobrescrever
    result.seguranca = this.toSnakeCase(config.seguranca ?? { senhaHash: '', senhaSalt: '' });
    if (config.orcamento !== undefined) result.orcamento = this.toSnakeCase(config.orcamento);
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