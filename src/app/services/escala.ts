// src/app/services/escala.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { EscalaRepository } from './repositories/escala-repository';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { RepositoryFactory } from './repository-factory';
import { EscalaConfig } from '../models/escala-config.model';
import { environment, getSupabaseClient, supabaseApi } from './supabase-client';
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
      p1: 'P1',
      p2: 'P2',
      folgas: [0, 6],
      quemFolgaPrimeiro: 'p1',
      dataInicioFolgas: new Date().toISOString().split('T')[0],
    };

    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        let config: EscalaConfig | null = null;
        if (!environment.production) {
          // Desenvolvimento local: cliente direto
          const client = getSupabaseClient();
          const { data, error } = await client.from('escala_config').select('configuracao').limit(1).single();
          if (error && !error.message.includes('PGRST116')) throw error;
          config = data?.configuracao ?? null;
        } else {
          // Produção: API Vercel
          config = await supabaseApi.getEscala();
        }
        if (config) return config;
      }
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