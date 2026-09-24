import { Injectable, Inject } from '@angular/core';
import { ClientStrategy, CLIENT_STRATEGY } from './client-strategy';
import { IConfigGeralRepository } from './repository-interfaces';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

@Injectable({ providedIn: 'root' })
export class ConfigGeralRepository implements IConfigGeralRepository {
  constructor(@Inject(CLIENT_STRATEGY) private strategy: ClientStrategy) {}

  private mapRow(row: any): ConfiguracaoGeral {
    const rawSeguranca = row.seguranca;
    const hasSegurancaData = rawSeguranca && typeof rawSeguranca === 'object' && Object.keys(rawSeguranca).length > 0;
    return {
      festividade: row.festividade,
      totalUhs: row.totalUhs,
      comodidadesGlobais: row.comodidadesGlobais,
      precos: row.precos,
      temporada: row.temporada,
      horarios: row.horarios,
      promocao: row.promocao,
      seguranca: hasSegurancaData ? row.seguranca : { senhaHash: '', senhaSalt: '' },
      orcamento: row.orcamento,
      empresa: row.empresa,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapConfig(config: Partial<ConfiguracaoGeral>): any {
    const result: any = {};
    if (config.festividade !== undefined) result.festividade = config.festividade;
    if (config.totalUhs !== undefined) result.totalUhs = config.totalUhs;
    if (config.comodidadesGlobais !== undefined) result.comodidadesGlobais = config.comodidadesGlobais;
    if (config.precos !== undefined) result.precos = config.precos;
    if (config.temporada !== undefined) result.temporada = config.temporada;
    if (config.horarios !== undefined) result.horarios = config.horarios;
    if (config.promocao !== undefined) result.promocao = config.promocao;
    if (config.seguranca !== undefined) result.seguranca = config.seguranca;
    if (config.orcamento !== undefined) result.orcamento = config.orcamento;
    if (config.empresa !== undefined) result.empresa = config.empresa;
    return result;
  }

  async get(): Promise<ConfiguracaoGeral | null> {
    const row = await this.strategy.getConfigGeral();
    return row ? this.mapRow(row) : null;
  }

  async update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral> {
    const data = this.unmapConfig(config);
    const row = await this.strategy.updateConfigGeral(data);
    return this.mapRow(row);
  }
}