import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { OrcamentoRapido } from '../../models/orcamento-rapido.model';

export interface OrcamentosRapidosRepository {
  getAll(): Promise<OrcamentoRapido[]>;
  getById(id: string): Promise<OrcamentoRapido | null>;
  create(orcamento: Omit<OrcamentoRapido, 'id' | 'criado_em'>): Promise<OrcamentoRapido>;
  update(id: string, orcamento: Partial<OrcamentoRapido>): Promise<OrcamentoRapido>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseOrcamentosRapidosRepository implements OrcamentosRapidosRepository {
  async getAll(): Promise<OrcamentoRapido[]> {
    return supabaseApi.getOrcamentosRapidos();
  }

  async getById(id: string): Promise<OrcamentoRapido | null> {
    try {
      return await supabaseApi.getOrcamentoRapido(id);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async create(orcamento: Omit<OrcamentoRapido, 'id' | 'criado_em'>): Promise<OrcamentoRapido> {
    return supabaseApi.createOrcamentoRapido(orcamento);
  }

  async update(id: string, orcamento: Partial<OrcamentoRapido>): Promise<OrcamentoRapido> {
    return supabaseApi.updateOrcamentoRapido(id, orcamento);
  }

  async delete(id: string): Promise<void> {
    return supabaseApi.deleteOrcamentoRapido(id);
  }
}
