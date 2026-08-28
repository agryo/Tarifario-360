import { Injectable } from '@angular/core';
import { getSupabaseClient } from '../../services/supabase-client';
import { OrcamentoOficial } from '../../models/orcamento-oficial.model';
import { toCamelCase, toSnakeCase } from '../../utils/case-converters';
import { OrcamentosOficiaisRepository } from './repository-interfaces';

@Injectable({ providedIn: 'root' })
export class SupabaseDirectOrcamentosOficiaisRepository implements OrcamentosOficiaisRepository {
  private getClient() {
    return getSupabaseClient();
  }

  private mapRow(row: any): OrcamentoOficial {
    return {
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      cliente: row.cliente,
      evento: row.evento,
      dataGeracao: row.data_geracao,
      dataValidade: row.data_validade,
      dataCheckin: row.data_checkin,
      dataCheckout: row.data_checkout,
      horaEntrada: row.hora_entrada,
      horaSaida: row.hora_saida,
      temporada: row.temporada,
      itens: toCamelCase(row.itens),
      observacoes: row.observacoes,
      status: row.status,
      assinatura: row.assinatura,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapOrcamento(orcamento: Partial<OrcamentoOficial>): any {
    const result: any = {};
    if (orcamento.tipo !== undefined) result.tipo = orcamento.tipo;
    if (orcamento.titulo !== undefined) result.titulo = orcamento.titulo;
    if (orcamento.cliente !== undefined) result.cliente = orcamento.cliente;
    if (orcamento.evento !== undefined) result.evento = orcamento.evento;
    if (orcamento.dataGeracao !== undefined) result.data_geracao = orcamento.dataGeracao instanceof Date ? orcamento.dataGeracao.toISOString() : orcamento.dataGeracao;
    if (orcamento.dataValidade !== undefined) result.data_validade = orcamento.dataValidade instanceof Date ? orcamento.dataValidade.toISOString() : orcamento.dataValidade;
    if (orcamento.dataCheckin !== undefined) result.data_checkin = orcamento.dataCheckin instanceof Date ? orcamento.dataCheckin.toISOString() : orcamento.dataCheckin;
    if (orcamento.dataCheckout !== undefined) result.data_checkout = orcamento.dataCheckout instanceof Date ? orcamento.dataCheckout.toISOString() : orcamento.dataCheckout;
    if (orcamento.horaEntrada !== undefined) result.hora_entrada = orcamento.horaEntrada;
    if (orcamento.horaSaida !== undefined) result.hora_saida = orcamento.horaSaida;
    if (orcamento.temporada !== undefined) result.temporada = orcamento.temporada;
    if (orcamento.itens !== undefined) result.itens = toSnakeCase(orcamento.itens);
    if (orcamento.observacoes !== undefined) result.observacoes = orcamento.observacoes;
    if (orcamento.status !== undefined) result.status = orcamento.status;
    if (orcamento.assinatura !== undefined) result.assinatura = orcamento.assinatura;
    return result;
  }

  async getAll(): Promise<OrcamentoOficial[]> {
    const { data, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapRow);
  }

  async getById(id: string): Promise<OrcamentoOficial | null> {
    const { data, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapRow(data) : null;
  }

  async create(orcamento: Omit<OrcamentoOficial, 'id' | 'criado_em' | 'atualizado_em'>): Promise<OrcamentoOficial> {
    // Não enviar ID - deixar o Supabase gerar UUID automaticamente
    const { id, ...orcamentoSemId } = orcamento as any;
    const { data, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .insert([this.unmapOrcamento(orcamentoSemId)])
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async update(id: string, orcamento: Partial<OrcamentoOficial>): Promise<OrcamentoOficial> {
    const { data, error } = await this.getClient()
      .from('orcamentos_oficiais')
      .update(this.unmapOrcamento(orcamento))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('orcamentos_oficiais')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}