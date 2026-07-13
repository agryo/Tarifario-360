import { environment } from '../../environments/environment';

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

  // Config endpoints
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
    return this.request<Record<string, T>>(`/config/list?categoria=${encodeURIComponent(categoria)}`);
  }

  async deleteConfig(categoria: string, chave: string): Promise<void> {
    return this.request(`/config?categoria=${encodeURIComponent(categoria)}&chave=${encodeURIComponent(chave)}`, {
      method: 'DELETE',
    });
  }

  async clearConfig(categoria: string): Promise<void> {
    return this.request(`/config/clear?categoria=${encodeURIComponent(categoria)}`, {
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

  // Escala endpoints
  async getEscala(): Promise<any> {
    return this.request<any>('/escala');
  }

  async updateEscala(configuracao: any): Promise<any> {
    return this.request<any>('/escala', {
      method: 'PUT',
      body: JSON.stringify(configuracao),
    });
  }

  // Orcamentos Oficiais endpoints
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

  // Orcamentos Rapidos endpoints
  async getOrcamentosRapidos(): Promise<any[]> {
    return this.request<any[]>('/orcamentos-rapidos');
  }

  async getOrcamentoRapido(id: string): Promise<any> {
    return this.request<any>(`/orcamentos-rapidos?id=${encodeURIComponent(id)}`);
  }

  async createOrcamentoRapido(orcamento: any): Promise<any> {
    return this.request<any>('/orcamentos-rapidos', {
      method: 'POST',
      body: JSON.stringify(orcamento),
    });
  }

  async updateOrcamentoRapido(id: string, orcamento: any): Promise<any> {
    return this.request<any>(`/orcamentos-rapidos?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(orcamento),
    });
  }

  async deleteOrcamentoRapido(id: string): Promise<void> {
    return this.request(`/orcamentos-rapidos?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Backup endpoints
  async exportBackup(): Promise<any> {
    return this.request<any>('/backup/export');
  }

  async importBackup(backup: any): Promise<any> {
    return this.request<any>('/backup/import', {
      method: 'POST',
      body: JSON.stringify(backup),
    });
  }

  // Criptografia endpoints
  async getChaveCriptografia(nome: string): Promise<any> {
    return this.request<any>(`/criptografia/key?nome=${encodeURIComponent(nome)}`);
  }

  async setChaveCriptografia(nome: string, chave: string, iv?: string, salt?: string): Promise<any> {
    return this.request<any>('/criptografia/key', {
      method: 'POST',
      body: JSON.stringify({ nome, chave, iv, salt }),
    });
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request<any>('/health');
  }
}

export const supabaseApi = new SupabaseApiClient();
