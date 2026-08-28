import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { ConfiguracaoGeral } from '../../models/tarifa.model';
import { toCamelCase, toSnakeCase } from '../../utils/case-converters';

export type { ConfigGeralRepository } from './repository-interfaces';
import { ConfigGeralRepository } from './repository-interfaces';

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
      precos: toCamelCase(row.precos),
      temporada: toCamelCase(row.temporada),
      horarios: toCamelCase(row.horarios),
      promocao: toCamelCase(row.promocao),
      // IMPORTANTE: Se seguranca vier null/undefined OU objeto vazio do banco, retorna objeto com strings vazias
      // para evitar que o merge posterior caia no default "1234"
      seguranca: hasSegurancaData ? toCamelCase(rawSeguranca) : { senhaHash: '', senhaSalt: '' },
      orcamento: toCamelCase(row.orcamento),
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapConfig(config: Partial<ConfiguracaoGeral>): any {
    const result: any = {};
    if (config.festividade !== undefined) result.festividade = config.festividade;
    if (config.totalUhs !== undefined) result.total_uhs = config.totalUhs;
    if (config.comodidadesGlobais !== undefined) result.comodidades_globais = config.comodidadesGlobais;
    if (config.precos !== undefined) result.precos = toSnakeCase(config.precos);
    if (config.temporada !== undefined) result.temporada = toSnakeCase(config.temporada);
    if (config.horarios !== undefined) result.horarios = toSnakeCase(config.horarios);
    if (config.promocao !== undefined) result.promocao = toSnakeCase(config.promocao);
    // SEMPRE incluir seguranca para evitar DEFAULT do banco sobrescrever
    result.seguranca = toSnakeCase(config.seguranca ?? { senhaHash: '', senhaSalt: '' });
    if (config.orcamento !== undefined) result.orcamento = toSnakeCase(config.orcamento);
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