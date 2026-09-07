// src/app/services/escala.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { IEscalaRepository } from './repositories/repository-interfaces';
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
    private repoFactory: RepositoryFactory,
  ) {}

  private get escalaRepo(): IEscalaRepository {
    return this.repoFactory.escala;
  }

  async getConfiguracao(): Promise<EscalaConfig> {
    const padrao: EscalaConfig = {
      p1: 'P1',
      p2: 'P2',
      folgas: [0, 6],
      quemFolgaPrimeiro: 'p1',
      dataInicioFolgas: new Date().toISOString().split('T')[0],
    };

    try {
      const config = await this.escalaRepo.get();
      if (config) return config;
    } catch (error) {
      console.warn('Falha ao buscar escala do Supabase, usando localStorage:', error);
    }

    return this.storage.get<EscalaConfig>(this.STORAGE_KEY) || padrao;
  }

  async salvarConfiguracao(config: EscalaConfig): Promise<void> {
    try {
      await this.escalaRepo.update(config);
    } catch (error) {
      console.warn('Falha ao salvar escala no Supabase, usando apenas localStorage:', error);
    }
    this.storage.set(this.STORAGE_KEY, config);
  }

  // Recarrega dados do Supabase para atualizar o cache local
  async recarregarDoSupabase(): Promise<void> {
    try {
      this.storage.remove(this.STORAGE_KEY);
      await this.getConfiguracao();
    } catch (error) {
      console.warn('Falha ao recarregar escala do Supabase:', error);
    }
  }
}