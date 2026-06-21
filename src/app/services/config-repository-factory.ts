import { Injectable } from '@angular/core';
import { ConfigRepository } from './config-repository';
import { LocalStorageConfigRepository } from './config-repository-local';
import { SupabaseConfigRepository } from './config-repository-supabase';

/**
 * Tipo de armazenamento ativo
 */
export type StorageBackend = 'local' | 'supabase';

/**
 * Factory para escolher implementação do ConfigRepository.
 * Troca via variável de ambiente ou configuração runtime.
 */
@Injectable({ providedIn: 'root' })
export class ConfigRepositoryFactory {
  private instance: ConfigRepository | null = null;
  private backend: StorageBackend = 'local'; // Padrão: localStorage

  constructor(
    private localRepo: LocalStorageConfigRepository,
    private supabaseRepo: SupabaseConfigRepository
  ) {}

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
      this.instance = this.backend === 'supabase'
        ? this.supabaseRepo
        : this.localRepo;
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