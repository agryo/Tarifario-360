import { Injectable } from '@angular/core';
import { ConfigRepository } from './config-repository';
import { SupabaseConfigRepository } from './config-repository-supabase';
import { SupabaseDirectConfigRepository } from './config-repository-supabase-direct';
import { environment } from '../../environments/environment';

/**
 * Tipo de armazenamento ativo
 */
export type StorageBackend = 'supabase' | 'supabase-direct';

/**
 * Factory para escolher implementação do ConfigRepository.
 * Troca via variável de ambiente ou configuração runtime.
 */
@Injectable({ providedIn: 'root' })
export class ConfigRepositoryFactory {
  private instance: ConfigRepository | null = null;
  private backend: StorageBackend = 'supabase-direct'; // Padrão: Supabase Direct (dev)

  constructor(
    private supabaseRepo: SupabaseConfigRepository,
    private supabaseDirectRepo: SupabaseDirectConfigRepository
  ) {
    // Auto-detect backend baseado no ambiente.
    // Tanto produção quanto dev usam 'supabase' (API Routes).
    // Em dev, o proxy.conf.json roteia /api/* -> localhost:3001 (api/server.ts),
    // que usa a service_role key APENAS no servidor (nunca no browser).
    if (environment.supabaseUrl && environment.supabaseAnonKey) {
      this.backend = 'supabase';
    }
  }

  /**
   * Define qual backend usar ('local' ou 'supabase')
   */
  setBackend(backend: StorageBackend): void {
    if (this.backend !== backend) {
      this.backend = backend;
      this.instance = null; // Força recriação
    }
  }

  /**
   * Retorna backend atual
   */
  getBackend(): StorageBackend {
    return this.backend;
  }

  /**
   * Obtém instância do repositório (singleton por backend)
   */
  getRepository(): ConfigRepository {
    if (!this.instance) {
      switch (this.backend) {
        case 'supabase':
          this.instance = this.supabaseRepo;
          break;
        case 'supabase-direct':
          this.instance = this.supabaseDirectRepo;
          break;
      }
    }
    return this.instance;
  }

  /**
   * Alterna backend e retorna nova instância
   */
  async switchBackend(backend: StorageBackend): Promise<ConfigRepository> {
    this.setBackend(backend);
    return this.getRepository();
  }

  }

/**
 * Token de injeção para usar o repositório ativo diretamente
 * Uso: constructor(@Inject(CONFIG_REPOSITORY) private repo: ConfigRepository)
 */
export const CONFIG_REPOSITORY = 'CONFIG_REPOSITORY';

/**
 * Provider para injetar o repositório ativo
 */
export function provideConfigRepository(factory: ConfigRepositoryFactory): ConfigRepository {
  return factory.getRepository();
}