import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { ClientStrategy, ApiClientStrategy, CLIENT_STRATEGY } from './repositories/client-strategy';
import { ConfigGeralRepository } from './repositories/config-geral-repository';
import { CategoriasRepository } from './repositories/categorias-repository';
import { EscalaRepository } from './repositories/escala-repository';
import { OrcamentosOficiaisRepository } from './repositories/orcamentos-oficiais-repository';
import { CriptografiaRepository } from './repositories/criptografia-repository';
import { ICategoriasRepository, IConfigGeralRepository, IEscalaRepository, IOrcamentosOficiaisRepository, ICriptografiaRepository } from './repositories/repository-interfaces';

/**
 * Factory que fornece as instâncias corretas dos repositórios.
 * Sempre usa ApiClientStrategy (via proxy /api/* em dev, direto em prod).
 * DirectClientStrategy (Supabase JS SDK direto) NÃO funciona localmente devido a RLS policies.
 */
@Injectable({ providedIn: 'root' })
export class RepositoryFactory {
  public readonly categorias: ICategoriasRepository;
  public readonly configGeral: IConfigGeralRepository;
  public readonly escala: IEscalaRepository;
  public readonly orcamentosOficiais: IOrcamentosOficiaisRepository;
  public readonly criptografia: ICriptografiaRepository;
  public readonly strategy: ClientStrategy;

  constructor() {
    // Em desenvolvimento local: usa ApiClientStrategy que acessa /api/* via proxy (localhost:3001)
    // Em produção (Vercel): usa ApiClientStrategy que acessa /api/* diretamente
    // DirectClientStrategy (Supabase JS SDK direto) NÃO funciona localmente devido a RLS policies
    this.strategy = inject(ApiClientStrategy);

    // Instancia repositórios únicos injetando a strategy
    this.categorias = new CategoriasRepository(this.strategy);
    this.configGeral = new ConfigGeralRepository(this.strategy);
    this.escala = new EscalaRepository(this.strategy);
    this.orcamentosOficiais = new OrcamentosOficiaisRepository(this.strategy);
    this.criptografia = new CriptografiaRepository(this.strategy);
  }

  // Getter methods for backward compatibility with services
  getCategoriasRepo(): ICategoriasRepository { return this.categorias; }
  getConfigGeralRepo(): IConfigGeralRepository { return this.configGeral; }
  getEscalaRepo(): IEscalaRepository { return this.escala; }
  getOrcamentosOficiaisRepo(): IOrcamentosOficiaisRepository { return this.orcamentosOficiais; }
  getCriptografiaRepo(): ICriptografiaRepository { return this.criptografia; }

  getBackend(): string {
    return 'supabase-api'; // Sempre usa API layer (/api/*) via proxy em dev
  }
}

// Provider para sempre usar ApiClientStrategy (via proxy /api/* em dev, direto em prod)
export function provideClientStrategy() {
  return {
    provide: CLIENT_STRATEGY,
    useClass: ApiClientStrategy
  };
}