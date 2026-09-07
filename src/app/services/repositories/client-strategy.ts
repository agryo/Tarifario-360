import { Injectable, InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase-client';

/**
 * Injection token para a estratégia de cliente
 */
export const CLIENT_STRATEGY = new InjectionToken<ClientStrategy>('CLIENT_STRATEGY');

/**
 * Estratégia de acesso a dados - encapsula a diferença entre
 * API Layer (Vercel: fetch /api/*) e Direct Client (Local: Supabase JS SDK)
 */
export abstract class ClientStrategy {
  abstract readonly name: 'api' | 'direct';

  // Categorias
  abstract getCategorias(): Promise<any[]>;
  abstract getCategoria(id: string): Promise<any | null>;
  abstract createCategoria(data: any): Promise<any>;
  abstract updateCategoria(id: string, data: any): Promise<any>;
  abstract deleteCategoria(id: string): Promise<void>;

  // Config Geral
  abstract getConfigGeral(): Promise<any | null>;
  abstract updateConfigGeral(config: any): Promise<any>;

  // Escala
  abstract getEscala(): Promise<any | null>;
  abstract updateEscala(config: any): Promise<any>;

  // Orçamentos Oficiais
  abstract getOrcamentosOficiais(): Promise<any[]>;
  abstract getOrcamentoOficial(id: string): Promise<any | null>;
  abstract createOrcamentoOficial(data: any): Promise<any>;
  abstract updateOrcamentoOficial(id: string, data: any): Promise<any>;
  abstract deleteOrcamentoOficial(id: string): Promise<void>;

  // Criptografia
  abstract getChaveCriptografia(nome: string): Promise<any | null>;
  abstract setChaveCriptografia(nome: string, chave: string, iv?: string, salt?: string): Promise<void>;

  // Limpar banco de dados completo
  abstract clearDatabase(): Promise<void>;
}

/**
 * Implementação via API Layer (Vercel) - usa fetch para /api/*
 */
@Injectable({ providedIn: 'root' })
export class ApiClientStrategy extends ClientStrategy {
  readonly name = 'api' as const;
  private baseUrl: string;

  constructor() {
    super();
    this.baseUrl = environment.apiUrl || '/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Categorias
  getCategorias(): Promise<any[]> {
    return this.request<any[]>('/categorias');
  }

  getCategoria(id: string): Promise<any | null> {
    return this.request<any>(`/categorias/${id}`);
  }

  createCategoria(data: any): Promise<any> {
    return this.request<any>('/categorias', { method: 'POST', body: JSON.stringify(data) });
  }

  updateCategoria(id: string, data: any): Promise<any> {
    return this.request<any>(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteCategoria(id: string): Promise<void> {
    return this.request<void>(`/categorias/${id}`, { method: 'DELETE' });
  }

  // Config Geral
  getConfigGeral(): Promise<any | null> {
    return this.request<any>('/config-geral');
  }

  updateConfigGeral(config: any): Promise<any> {
    return this.request<any>('/config-geral', { method: 'PUT', body: JSON.stringify(config) });
  }

  // Escala
  getEscala(): Promise<any | null> {
    return this.request<any>('/escala');
  }

  updateEscala(config: any): Promise<any> {
    return this.request<any>('/escala', { method: 'PUT', body: JSON.stringify(config) });
  }

  // Orçamentos Oficiais
  getOrcamentosOficiais(): Promise<any[]> {
    return this.request<any[]>('/orcamentos-oficiais');
  }

  getOrcamentoOficial(id: string): Promise<any | null> {
    return this.request<any>(`/orcamentos-oficiais/${id}`);
  }

  createOrcamentoOficial(data: any): Promise<any> {
    return this.request<any>('/orcamentos-oficiais', { method: 'POST', body: JSON.stringify(data) });
  }

  updateOrcamentoOficial(id: string, data: any): Promise<any> {
    return this.request<any>(`/orcamentos-oficiais/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteOrcamentoOficial(id: string): Promise<void> {
    return this.request<void>(`/orcamentos-oficiais/${id}`, { method: 'DELETE' });
  }

  // Criptografia
  getChaveCriptografia(nome: string): Promise<any | null> {
    return this.request<any>(`/criptografia?nome=${encodeURIComponent(nome)}`);
  }

  setChaveCriptografia(nome: string, chave: string, iv?: string, salt?: string): Promise<void> {
    return this.request<void>('/criptografia', {
      method: 'POST',
      body: JSON.stringify({ nome, chave, iv, salt }),
    });
  }

  async clearDatabase(): Promise<void> {
    return this.request<void>('/database', { method: 'DELETE' });
  }
}

/**
 * Implementação via Direct Client (Local) - usa Supabase JS SDK diretamente
 */
@Injectable({ providedIn: 'root' })
export class DirectClientStrategy extends ClientStrategy {
  readonly name = 'direct' as const;

  constructor() {
    super();
  }

  private getClient(): SupabaseClient {
    return getSupabaseClient();
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

  // Categorias
  async getCategorias(): Promise<any[]> {
    const { data, error } = await this.getClient().from('categorias').select('*').order('nome');
    if (error) throw error;
    return data ?? [];
  }

  async getCategoria(id: string): Promise<any | null> {
    const { data, error } = await this.getClient().from('categorias').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createCategoria(data: any): Promise<any> {
    const { data: result, error } = await this.getClient()
      .from('categorias')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async updateCategoria(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.getClient()
      .from('categorias')
      .update({ ...data, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async deleteCategoria(id: string): Promise<void> {
    const { error } = await this.getClient().from('categorias').delete().eq('id', id);
    if (error) throw error;
  }

  // Config Geral
  async getConfigGeral(): Promise<any | null> {
    const { data, error } = await this.getClient().from('config_geral').select('*').single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    if (!data) return null;

    // Converte snake_case para camelCase nos objetos aninhados (igual ao endpoint API)
    const rawSeguranca = data.seguranca;
    const hasSegurancaData = rawSeguranca && typeof rawSeguranca === 'object' && Object.keys(rawSeguranca).length > 0;
    return {
      festividade: data.festividade,
      totalUhs: data.total_uhs,
      comodidadesGlobais: data.comodidades_globais,
      precos: this.toCamelCase(data.precos),
      temporada: this.toCamelCase(data.temporada),
      horarios: this.toCamelCase(data.horarios),
      promocao: this.toCamelCase(data.promocao),
      seguranca: hasSegurancaData ? this.toCamelCase(rawSeguranca) : { senhaHash: '', senhaSalt: '' },
      orcamento: this.toCamelCase(data.orcamento),
      criado_em: data.criado_em,
      atualizado_em: data.atualizado_em,
    };
  }

  async updateConfigGeral(config: any): Promise<any> {
    const { error } = await this.getClient()
      .from('config_geral')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;

    // Converte camelCase para snake_case nos objetos aninhados (igual ao endpoint API)
    const mappedConfig = {
      festividade: config.festividade,
      total_uhs: config.totalUhs,
      comodidades_globais: config.comodidadesGlobais,
      precos: this.toSnakeCase(config.precos),
      temporada: this.toSnakeCase(config.temporada),
      horarios: this.toSnakeCase(config.horarios),
      promocao: this.toSnakeCase(config.promocao),
      seguranca: this.toSnakeCase(config.seguranca ?? { senhaHash: '', senhaSalt: '' }),
      orcamento: this.toSnakeCase(config.orcamento),
      criado_em: config.criado_em,
      atualizado_em: config.atualizado_em,
    };

    const { data, error: insertError } = await this.getClient()
      .from('config_geral')
      .insert({ ...mappedConfig, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select()
      .single();
    if (insertError) throw insertError;

    // Retorna no formato camelCase
    const rawSeguranca = data.seguranca;
    const hasSegurancaData = rawSeguranca && typeof rawSeguranca === 'object' && Object.keys(rawSeguranca).length > 0;
    return {
      festividade: data.festividade,
      totalUhs: data.total_uhs,
      comodidadesGlobais: data.comodidades_globais,
      precos: this.toCamelCase(data.precos),
      temporada: this.toCamelCase(data.temporada),
      horarios: this.toCamelCase(data.horarios),
      promocao: this.toCamelCase(data.promocao),
      seguranca: hasSegurancaData ? this.toCamelCase(rawSeguranca) : { senhaHash: '', senhaSalt: '' },
      orcamento: this.toCamelCase(data.orcamento),
      criado_em: data.criado_em,
      atualizado_em: data.atualizado_em,
    };
  }

  // Escala
  async getEscala(): Promise<any | null> {
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

  async updateEscala(config: any): Promise<any> {
    const current = await this.getEscala();
    const merged = { ...current, ...config };

    const { error } = await this.getClient()
      .from('escala_config')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;

    const { data, error: insertError } = await this.getClient()
      .from('escala_config')
      .insert({ configuracao: merged, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select('configuracao')
      .single();
    if (insertError) throw insertError;
    return data?.configuracao ?? null;
  }

  // Orçamentos Oficiais
  async getOrcamentosOficiais(): Promise<any[]> {
    const { data, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .select('*')
      .order('data_geracao', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getOrcamentoOficial(id: string): Promise<any | null> {
    const { data, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createOrcamentoOficial(data: any): Promise<any> {
    const { data: result, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async updateOrcamentoOficial(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .update({ ...data, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async deleteOrcamentoOficial(id: string): Promise<void> {
    const { error } = await this.getClient().from('orcamentos_oficiais').delete().eq('id', id);
    if (error) throw error;
  }

  // Criptografia
  async getChaveCriptografia(nome: string): Promise<any | null> {
    const { data, error } = await this.getClient()
      .from('chaves_criptografia')
      .select('nome, chave, iv, salt')
      .eq('nome', nome)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async setChaveCriptografia(nome: string, chave: string, iv?: string, salt?: string): Promise<void> {
    const { error } = await this.getClient()
      .from('chaves_criptografia')
      .upsert({ nome, chave, iv, salt }, { onConflict: 'nome' });
    if (error) throw error;
  }

  async clearDatabase(): Promise<void> {
    const tables = [
      'orcamentos_oficiais',
      'chaves_criptografia',
      'escala_config',
      'config_geral',
      'categorias',
    ];
    for (const table of tables) {
      const { error } = await this.getClient().from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    }
  }
}