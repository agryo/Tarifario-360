import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { ClientStrategy, ApiClientStrategy, DirectClientStrategy, CLIENT_STRATEGY } from './repositories/client-strategy';
import { CategoriasRepository } from './repositories/categorias-repository';
import { ConfigGeralRepository } from './repositories/config-geral-repository';
import { EscalaRepository } from './repositories/escala-repository';
import { OrcamentosOficiaisRepository } from './repositories/orcamentos-oficiais-repository';
import { CriptografiaRepository } from './repositories/criptografia-repository';
import { ICategoriasRepository, IConfigGeralRepository, IEscalaRepository, IOrcamentosOficiaisRepository, ICriptografiaRepository } from './repositories/repository-interfaces';

/**
 * Factory que fornece as instâncias corretas dos repositórios baseadas no ambiente.
 * Em desenvolvimento (local): usa DirectClientStrategy (Supabase JS SDK direto)
 * Em produção (Vercel): usa ApiClientStrategy (fetch /api/*)
 */
@Injectable({ providedIn: 'root' })
export class RepositoryFactory {
  public readonly categorias: ICategoriasRepository;
  public readonly configGeral: IConfigGeralRepository;
  public readonly escala: IEscalaRepository;
  public readonly orcamentosOficiais: IOrcamentosOficiaisRepository;
  public readonly criptografia: ICriptografiaRepository;

  constructor() {
    // Escolhe strategy baseada no environment
    const isLocal = !environment.production || environment.supabaseUrl?.includes('localhost');
    const strategy: ClientStrategy = isLocal
      ? inject(DirectClientStrategy)
      : inject(ApiClientStrategy);

    // Instancia repositórios únicos injetando a strategy
    this.categorias = new CategoriasRepository(strategy);
    this.configGeral = new ConfigGeralRepository(strategy);
    this.escala = new EscalaRepository(strategy);
    this.orcamentosOficiais = new OrcamentosOficiaisRepository(strategy);
    this.criptografia = new CriptografiaRepository(strategy);
  }

  // Getter methods for backward compatibility with services
  getCategoriasRepo(): ICategoriasRepository { return this.categorias; }
  getConfigGeralRepo(): IConfigGeralRepository { return this.configGeral; }
  getEscalaRepo(): IEscalaRepository { return this.escala; }
  getOrcamentosOficiaisRepo(): IOrcamentosOficiaisRepository { return this.orcamentosOficiais; }
  getCriptografiaRepo(): ICriptografiaRepository { return this.criptografia; }

  getBackend(): string {
    const isLocal = !environment.production || environment.supabaseUrl?.includes('localhost');
    return isLocal ? 'supabase-direct' : 'supabase';
  }
}

// Provider for the CLIENT_STRATEGY token
export function provideClientStrategy() {
  return {
    provide: CLIENT_STRATEGY,
    useFactory: () => {
      const isLocal = !environment.production || environment.supabaseUrl?.includes('localhost');
      return isLocal ? new DirectClientStrategy() : new ApiClientStrategy();
    }
  };
}