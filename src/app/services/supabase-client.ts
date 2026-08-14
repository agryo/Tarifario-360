import { environment } from '../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export { environment };

const API_BASE = environment.apiUrl || '/api';

class SupabaseApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
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

  // Config Geral endpoints
  async getConfigGeral(): Promise<any> {
    return this.request<any>('/config-geral');
  }

  async updateConfigGeral(config: any): Promise<any> {
    return this.request<any>('/config-geral', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Config endpoints (generic)
  async getConfig<T>(categoria: string, chave: string): Promise<T | null> {
    return this.request<T>(`/config?categoria=${encodeURIComponent(categoria)}&chave=${encodeURIComponent(chave)}`);
  }

  async setConfig<T>(categoria: string, chave: string, dados: T): Promise<T> {
    return this.request<T>('/config', {
      method: 'POST',
      body: JSON.stringify({ categoria, chave, dados }),
    });
  }

  async listConfig<T>(categoria: string): Promise<Record<string, T>> {
    return this.request<Record<string, T>>(`/config?categoria=${encodeURIComponent(categoria)}`);
  }

  async deleteConfig(categoria: string, chave: string): Promise<void> {
    return this.request(`/config?categoria=${encodeURIComponent(categoria)}&chave=${encodeURIComponent(chave)}`, {
      method: 'DELETE',
    });
  }

  async clearConfig(categoria: string): Promise<void> {
    return this.request(`/config?categoria=${encodeURIComponent(categoria)}`, {
      method: 'DELETE',
    });
  }

  // Categorias endpoints
  async getCategorias(): Promise<any[]> {
    return this.request<any[]>('/categorias');
  }

  async getCategoria(id: string): Promise<any> {
    return this.request<any>(`/categorias?id=${encodeURIComponent(id)}`);
  }

  async createCategoria(categoria: any): Promise<any> {
    return this.request<any>('/categorias', {
      method: 'POST',
      body: JSON.stringify(categoria),
    });
  }

  async updateCategoria(id: string, categoria: any): Promise<any> {
    return this.request<any>(`/categorias?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(categoria),
    });
  }

  async deleteCategoria(id: string): Promise<void> {
    return this.request(`/categorias?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Escala endpoints
  async getEscala(): Promise<any> {
    return this.request<any>('/escala');
  }

  async updateEscala(escala: any): Promise<any> {
    return this.request<any>('/escala', {
      method: 'PUT',
      body: JSON.stringify(escala),
    });
  }

  async clearEscala(): Promise<void> {
    return this.request('/escala', {
      method: 'DELETE',
    });
  }

  // Orçamentos Oficiais endpoints
  async getOrcamentosOficiais(): Promise<any[]> {
    return this.request<any[]>('/orcamentos-oficiais');
  }

  async getOrcamentoOficial(id: string): Promise<any> {
    return this.request<any>(`/orcamentos-oficiais?id=${encodeURIComponent(id)}`);
  }

  async createOrcamentoOficial(orcamento: any): Promise<any> {
    return this.request<any>('/orcamentos-oficiais', {
      method: 'POST',
      body: JSON.stringify(orcamento),
    });
  }

  async updateOrcamentoOficial(id: string, orcamento: any): Promise<any> {
    return this.request<any>(`/orcamentos-oficiais?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(orcamento),
    });
  }

  async deleteOrcamentoOficial(id: string): Promise<void> {
    return this.request(`/orcamentos-oficiais?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Criptografia endpoints
  async getChaveCriptografia(nome: string): Promise<any> {
    return this.request<any>(`/criptografia?nome=${encodeURIComponent(nome)}`);
  }

  async setChaveCriptografia(nome: string, chave: string, iv?: string, salt?: string): Promise<any> {
    return this.request<any>('/criptografia', {
      method: 'POST',
      body: JSON.stringify({ nome, chave, iv, salt }),
    });
  }

  // Backup endpoints
  async exportBackup(): Promise<any> {
    return this.request<any>('/backup');
  }

  async importBackup(backup: any): Promise<any> {
    return this.request<any>('/backup', {
      method: 'POST',
      body: JSON.stringify(backup),
    });
  }

  // Limpar banco de dados
  async clearDatabase(): Promise<any> {
    return this.request<any>('/database', {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<any> {
    return this.request<any>('/health');
  }
}

export const supabaseApi = new SupabaseApiClient();

let _supabaseClient: SupabaseClient | null = null;

/**
 * Cria ou retorna instância singleton do cliente Supabase.
 * Usado apenas em desenvolvimento (supabase-direct).
 * Em produção, usa API Routes via Vercel.
 */
export function getSupabaseClient(): SupabaseClient {
  if (environment.production) {
    throw new Error('Cliente Supabase direto não disponível em produção. Use API Routes.');
  }

  if (!_supabaseClient) {
    const url = environment.supabaseUrl;
    const key = environment.supabaseAnonKey;

    if (!url || !key) {
      throw new Error('supabaseUrl e supabaseAnonKey são obrigatórios no environment');
    }

    _supabaseClient = createClient(url, key);
  }

  return _supabaseClient;
}

/**
 * Limpa instância (útil para testes)
 */
export function resetSupabaseClient(): void {
  _supabaseClient = null;
}