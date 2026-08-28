import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';
import { CategoriaQuarto } from '../../models/categoria-quarto.model';

export type { CategoriasRepository } from './repository-interfaces';
import { CategoriasRepository } from './repository-interfaces';

@Injectable({ providedIn: 'root' })
export class SupabaseCategoriasRepository implements CategoriasRepository {
  async getAll(): Promise<CategoriaQuarto[]> {
    return supabaseApi.getCategorias();
  }

  async getById(id: string): Promise<CategoriaQuarto | null> {
    try {
      return await supabaseApi.getCategoria(id);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async create(categoria: Omit<CategoriaQuarto, 'id' | 'criado_em' | 'atualizado_em'>): Promise<CategoriaQuarto> {
    return supabaseApi.createCategoria(categoria);
  }

  async update(id: string, categoria: Partial<CategoriaQuarto>): Promise<CategoriaQuarto> {
    return supabaseApi.updateCategoria(id, categoria);
  }

  async delete(id: string): Promise<void> {
    return supabaseApi.deleteCategoria(id);
  }
}