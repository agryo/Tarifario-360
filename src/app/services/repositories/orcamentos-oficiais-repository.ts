import { Injectable, Inject } from '@angular/core';
import { ClientStrategy, CLIENT_STRATEGY } from './client-strategy';
import { IOrcamentosOficiaisRepository } from './repository-interfaces';
import { OrcamentoOficial } from '../../models/orcamento-oficial.model';

/**
 * Converte de forma defensiva um valor de data vindo do banco para um objeto Date válido.
 * Aceita: Date, timestamp numérico, ISO ("2026-09-16T22:50:24Z") e formato PT-BR
 * ("16/09/2026" ou "16/09/2026 14:00"). Nunca retorna "Invalid Date".
 */
function parseOrcamentoDate(valor: any): Date {
  if (valor instanceof Date) return isNaN(valor.getTime()) ? new Date() : valor;
  if (valor == null || valor === '') return new Date();
  if (typeof valor === 'number') {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const texto = String(valor).trim();
  const iso = new Date(texto);
  if (!isNaN(iso.getTime())) return iso;

  // Formato PT-BR: dd/mm/yyyy [HH:mm[:ss]]
  const m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    let ano = Number(m[3]);
    if (ano < 100) ano += 2000;
    return new Date(
      ano,
      Number(m[2]) - 1,
      Number(m[1]),
      m[4] ? Number(m[4]) : 0,
      m[5] ? Number(m[5]) : 0,
      m[6] ? Number(m[6]) : 0,
    );
  }
  // Fallback seguro: evita Invalid Date para não quebrar o date pipe
  return new Date();
}

@Injectable({ providedIn: 'root' })
export class OrcamentosOficiaisRepository implements IOrcamentosOficiaisRepository {
  constructor(@Inject(CLIENT_STRATEGY) private strategy: ClientStrategy) {}

  private mapRow(row: any): OrcamentoOficial {
    return {
      ...row,
      // Estratégia de dados retorna snake_case (direct) ou camelCase (api) - suporta ambas
      dataGeracao: parseOrcamentoDate(row.data_geracao ?? row.dataGeracao),
      dataValidade: parseOrcamentoDate(row.data_validade ?? row.dataValidade),
      dataCheckin: parseOrcamentoDate(row.data_checkin ?? row.dataCheckin),
      dataCheckout: parseOrcamentoDate(row.data_checkout ?? row.dataCheckout),
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