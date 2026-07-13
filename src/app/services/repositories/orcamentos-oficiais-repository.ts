import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { OrcamentoOficial } from '../../models/orcamento-oficial.model';

export interface OrcamentosOficiaisRepository {
  getAll(): Promise<OrcamentoOficial[]>;
  getById(id: string): Promise<OrcamentoOficial | null>;
  create(orcamento: Omit<OrcamentoOficial, 'id' | 'criado_em' | 'atualizado_em'>): Promise<OrcamentoOficial>;
  update(id: string, orcamento: Partial<OrcamentoOficial>): Promise<OrcamentoOficial>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseOrcamentosOficiaisRepository implements OrcamentosOficiaisRepository {
  async getAll(): Promise<OrcamentoOficial[]> {
    return supabaseApi.getOrcamentosOficiais();
  }

  async getById(id: string): Promise<OrcamentoOficial | null> {
    try {
      return await supabaseApi.getOrcamentoOficial(id);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async create(orcamento: Omit<OrcamentoOficial, 'id' | 'criado_em' | 'atualizado_em'>): Promise<OrcamentoOficial> {
    return supabaseApi.createOrcamentoOficial(orcamento);
  }

  async update(id: string, orcamento: Partial<OrcamentoOficial>): Promise<OrcamentoOficial> {
    return supabaseApi.updateOrcamentoOficial(id, orcamento);
  }

  async delete(id: string): Promise<void> {
    return supabaseApi.deleteOrcamentoOficial(id);
  }
}