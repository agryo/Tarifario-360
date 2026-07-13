import { Injectable } from '@angular/core';
import { getSupabaseDirect } from '../supabase-direct-client';
import { OrcamentoRapido } from '../../models/orcamento-rapido.model';

export interface OrcamentosRapidosRepository {
  getAll(): Promise<OrcamentoRapido[]>;
  getById(id: string): Promise<OrcamentoRapido | null>;
  create(orcamento: Omit<OrcamentoRapido, 'id' | 'criado_em'>): Promise<OrcamentoRapido>;
  update(id: string, orcamento: Partial<OrcamentoRapido>): Promise<OrcamentoRapido>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseDirectOrcamentosRapidosRepository implements OrcamentosRapidosRepository {
  private getClient() {
    const client = getSupabaseDirect();
    if (!client) {
      throw new Error('Supabase Direct Client não disponível em produção');
    }
    return client['client'];
  }

  private mapRow(row: any): OrcamentoRapido {
    return {
      tipo: row.tipo,
      id: row.id,
      dataGeracao: row.data_geracao,
      categoriaId: row.categoria_id,
      dataCheckin: row.data_checkin,
      dataCheckout: row.data_checkout,
      numeroNoites: row.numero_noites,
      quantidade: row.quantidade,
      valorDiaria: Number(row.valor_diaria),
      tipoTemporada: row.tipo_temporada,
      valorTotal: Number(row.valor_total),
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapOrcamento(orcamento: Partial<OrcamentoRapido>): any {
    const result: any = {};
    if (orcamento.tipo !== undefined) result.tipo = orcamento.tipo;
    if (orcamento.dataGeracao !== undefined) result.data_geracao = orcamento.dataGeracao;
    if (orcamento.categoriaId !== undefined) result.categoria_id = orcamento.categoriaId;
    if (orcamento.dataCheckin !== undefined) result.data_checkin = orcamento.dataCheckin;
    if (orcamento.dataCheckout !== undefined) result.data_checkout = orcamento.dataCheckout;
    if (orcamento.numeroNoites !== undefined) result.numero_noites = orcamento.numeroNoites;
    if (orcamento.quantidade !== undefined) result.quantidade = orcamento.quantidade;
    if (orcamento.valorDiaria !== undefined) result.valor_diaria = orcamento.valorDiaria;
    if (orcamento.tipoTemporada !== undefined) result.tipo_temporada = orcamento.tipoTemporada;
    if (orcamento.valorTotal !== undefined) result.valor_total = orcamento.valorTotal;
    return result;
  }

  async getAll(): Promise<OrcamentoRapido[]> {
    const { data, error } = await this.getClient()
      .from('orcamentos_rapidos')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapRow);
  }

  async getById(id: string): Promise<OrcamentoRapido | null> {
    const { data, error } = await this.getClient()
      .from('orcamentos_rapidos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapRow(data) : null;
  }

  async create(orcamento: Omit<OrcamentoRapido, 'id' | 'criado_em'>): Promise<OrcamentoRapido> {
    // Não enviar ID - deixar o Supabase gerar UUID automaticamente
    const { id, ...orcamentoSemId } = orcamento as any;
    const { data, error } = await this.getClient()
      .from('orcamentos_rapidos')
      .insert([this.unmapOrcamento(orcamentoSemId)])
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async update(id: string, orcamento: Partial<OrcamentoRapido>): Promise<OrcamentoRapido> {
    const { data, error } = await this.getClient()
      .from('orcamentos_rapidos')
      .update(this.unmapOrcamento(orcamento))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('orcamentos_rapidos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}