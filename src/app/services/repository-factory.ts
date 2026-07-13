import { Injectable } from '@angular/core';
import { ConfigRepositoryFactory, StorageBackend } from './config-repository-factory';
import { SupabaseCategoriasRepository, CategoriasRepository } from './repositories/categorias-repository';
import { SupabaseConfigGeralRepository, ConfigGeralRepository } from './repositories/config-geral-repository';
import { SupabaseEscalaRepository, EscalaRepository } from './repositories/escala-repository';
import { SupabaseOrcamentosOficiaisRepository, OrcamentosOficiaisRepository } from './repositories/orcamentos-oficiais-repository';
import { SupabaseOrcamentosRapidosRepository, OrcamentosRapidosRepository } from './repositories/orcamentos-rapidos-repository';
import { SupabaseCriptografiaRepository, CriptografiaRepository } from './repositories/criptografia-repository';
import { SupabaseDirectCategoriasRepository } from './repositories/categorias-repository-direct';
import { SupabaseDirectConfigGeralRepository } from './repositories/config-geral-repository-direct';
import { SupabaseDirectEscalaRepository } from './repositories/escala-repository-direct';
import { SupabaseDirectOrcamentosOficiaisRepository } from './repositories/orcamentos-oficiais-repository-direct';
import { SupabaseDirectOrcamentosRapidosRepository } from './repositories/orcamentos-rapidos-repository-direct';
import { SupabaseDirectCriptografiaRepository } from './repositories/criptografia-repository-direct';

@Injectable({ providedIn: 'root' })
export class RepositoryFactory {
  constructor(
    private configFactory: ConfigRepositoryFactory,
    private supabaseCategorias: SupabaseCategoriasRepository,
    private directCategorias: SupabaseDirectCategoriasRepository,
    private supabaseConfigGeral: SupabaseConfigGeralRepository,
    private directConfigGeral: SupabaseDirectConfigGeralRepository,
    private supabaseEscala: SupabaseEscalaRepository,
    private directEscala: SupabaseDirectEscalaRepository,
    private supabaseOrcamentosOficiais: SupabaseOrcamentosOficiaisRepository,
    private directOrcamentosOficiais: SupabaseDirectOrcamentosOficiaisRepository,
    private supabaseOrcamentosRapidos: SupabaseOrcamentosRapidosRepository,
    private directOrcamentosRapidos: SupabaseDirectOrcamentosRapidosRepository,
    private supabaseCriptografia: SupabaseCriptografiaRepository,
    private directCriptografia: SupabaseDirectCriptografiaRepository,
  ) {}

  private isSupabase(): boolean {
    const backend = this.configFactory.getBackend();
    return backend === 'supabase' || backend === 'supabase-direct';
  }

  private isDirect(): boolean {
    return this.configFactory.getBackend() === 'supabase-direct';
  }

  getCategoriasRepo(): CategoriasRepository {
    if (!this.isSupabase()) {
      throw new Error('Repositório Supabase não disponível no backend local');
    }
    return this.isDirect() ? this.directCategorias : this.supabaseCategorias;
  }

  getConfigGeralRepo(): ConfigGeralRepository {
    if (!this.isSupabase()) {
      throw new Error('Repositório Supabase não disponível no backend local');
    }
    return this.isDirect() ? this.directConfigGeral : this.supabaseConfigGeral;
  }

  getEscalaRepo(): EscalaRepository {
    if (!this.isSupabase()) {
      throw new Error('Repositório Supabase não disponível no backend local');
    }
    return this.isDirect() ? this.directEscala : this.supabaseEscala;
  }

  getOrcamentosOficiaisRepo(): OrcamentosOficiaisRepository {
    if (!this.isSupabase()) {
      throw new Error('Repositório Supabase não disponível no backend local');
    }
    return this.isDirect() ? this.directOrcamentosOficiais : this.supabaseOrcamentosOficiais;
  }

  getOrcamentosRapidosRepo(): OrcamentosRapidosRepository {
    if (!this.isSupabase()) {
      throw new Error('Repositório Supabase não disponível no backend local');
    }
    return this.isDirect() ? this.directOrcamentosRapidos : this.supabaseOrcamentosRapidos;
  }

  getCriptografiaRepo(): CriptografiaRepository {
    if (!this.isSupabase()) {
      throw new Error('Repositório Supabase não disponível no backend local');
    }
    return this.isDirect() ? this.directCriptografia : this.supabaseCriptografia;
  }
}