// src/app/services/escala.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { EscalaRepository } from './repositories/escala-repository';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { RepositoryFactory } from './repository-factory';
import { EscalaConfig } from '../models/escala-config.model';
export type { EscalaConfig } from '../models/escala-config.model';

@Injectable({
  providedIn: 'root',
})
export class EscalaService {
  private readonly STORAGE_KEY = 'escala_config';

  constructor(
    private storage: StorageService,
    private configFactory: ConfigRepositoryFactory,
    private repoFactory: RepositoryFactory,
  ) {}

  private get escalaRepo(): EscalaRepository {
    return this.repoFactory.getEscalaRepo();
  }

  async getConfiguracao(): Promise<EscalaConfig> {
    const padrao: EscalaConfig = {
      p1: 'Agryo',
      p2: 'Alex',
      folgas: [0, 6],
      quemFolgaPrimeiro: 'p1',
      dataInicioFolgas: new Date().toISOString().split('T')[0],
    };

    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        const config = await this.escalaRepo.get();
        if (config) return config;
      }
    } catch (error) {
      console.warn('Falha ao buscar escala do Supabase, usando localStorage:', error);
    }

    return this.storage.get<EscalaConfig>(this.STORAGE_KEY) || padrao;
  }

  async salvarConfiguracao(config: EscalaConfig): Promise<void> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        await this.escalaRepo.update(config);
      }
    } catch (error) {
      console.warn('Falha ao salvar escala no Supabase:', error);
    }
    this.storage.set(this.STORAGE_KEY, config);
  }
}