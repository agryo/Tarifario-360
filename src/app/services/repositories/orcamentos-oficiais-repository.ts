import { Injectable, Inject } from '@angular/core';
import { ClientStrategy, CLIENT_STRATEGY } from './client-strategy';
import { IOrcamentosOficiaisRepository } from './repository-interfaces';
import { OrcamentoOficial } from '../../models/orcamento-oficial.model';

@Injectable({ providedIn: 'root' })
export class OrcamentosOficiaisRepository implements IOrcamentosOficiaisRepository {
  constructor(@Inject(CLIENT_STRATEGY) private strategy: ClientStrategy) {}

  private mapRow(row: any): OrcamentoOficial {
    return {
      ...row,
      dataGeracao: new Date(row.data_geracao),
      dataValidade: new Date(row.data_validade),
      dataCheckin: new Date(row.data_checkin),
      dataCheckout: new Date(row.data_checkout),
      itens: row.itens,
    };
  }

  private unmapOrcamento(orc: Partial<OrcamentoOficial>): any {
    const result: any = {};
    if (orc.titulo !== undefined) result.titulo = orc.titulo;
    if (orc.cliente !== undefined) result.cliente = orc.cliente;
    if (orc.evento !== undefined) result.evento = orc.evento;
    if (orc.dataGeracao !== undefined) result.data_geracao = orc.dataGeracao.toISOString();
    if (orc.dataValidade !== undefined) result.data_validade = orc.dataValidade.toISOString();
    if (orc.dataCheckin !== undefined) result.data_checkin = orc.dataCheckin.toISOString();
    if (orc.dataCheckout !== undefined) result.data_checkout = orc.dataCheckout.toISOString();
    if (orc.horaEntrada !== undefined) result.hora_entrada = orc.horaEntrada;
    if (orc.horaSaida !== undefined) result.hora_saida = orc.horaSaida;
    if (orc.temporada !== undefined) result.temporada = orc.temporada;
    if (orc.itens !== undefined) result.itens = orc.itens;
    if (orc.observacoes !== undefined) result.observacoes = orc.observacoes;
    if (orc.status !== undefined) result.status = orc.status;
    if (orc.assinatura !== undefined) result.assinatura = orc.assinatura;
    return result;
  }

  async getAll(): Promise<OrcamentoOficial[]> {
    const rows = await this.strategy.getOrcamentosOficiais();
    return rows.map(r => this.mapRow(r));
  }

  async getById(id: string): Promise<OrcamentoOficial | null> {
    const row = await this.strategy.getOrcamentoOficial(id);
    return row ? this.mapRow(row) : null;
  }

  async create(orcamento: Omit<OrcamentoOficial, 'id' | 'criado_em' | 'atualizado_em'>): Promise<OrcamentoOficial> {
    const data = this.unmapOrcamento(orcamento);
    const row = await this.strategy.createOrcamentoOficial(data);
    return this.mapRow(row);
  }

  async update(id: string, orcamento: Partial<OrcamentoOficial>): Promise<OrcamentoOficial> {
    const data = this.unmapOrcamento(orcamento);
    const row = await this.strategy.updateOrcamentoOficial(id, data);
    return this.mapRow(row);
  }

  async delete(id: string): Promise<void> {
    return this.strategy.deleteOrcamentoOficial(id);
  }
}