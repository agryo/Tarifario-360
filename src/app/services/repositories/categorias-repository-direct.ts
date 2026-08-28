import { Injectable } from '@angular/core';
import { getSupabaseClient } from '../../services/supabase-client';
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { CategoriasRepository } from './repository-interfaces';

@Injectable({ providedIn: 'root' })
export class SupabaseDirectCategoriasRepository implements CategoriasRepository {
  private getClient() {
    return getSupabaseClient();
  }

  private mapRow(row: any): CategoriaQuarto {
    return {
      id: row.id,
      nome: row.nome,
      capacidadeMaxima: row.capacidade_maxima,
      precoAltaCafe: Number(row.preco_alta_cafe),
      precoAltaSemCafe: Number(row.preco_alta_sem_cafe),
      precoBaixaCafe: Number(row.preco_baixa_cafe),
      precoBaixaSemCafe: Number(row.preco_baixa_sem_cafe),
      ativo: row.ativo,
      descricao: row.descricao,
      camasCasal: row.camas_casal,
      camasSolteiro: row.camas_solteiro,
      tipoOcupacaoPadrao: row.tipo_ocupacao_padrao,
      numeros: row.numeros,
      comodidadesSelecionadas: row.comodidades_selecionadas,
    };
  }

  private unmapCategoria(cat: Partial<CategoriaQuarto>): any {
    const result: any = {};
    if (cat.nome !== undefined) result.nome = cat.nome;
    if (cat.capacidadeMaxima !== undefined) result.capacidade_maxima = cat.capacidadeMaxima;
    if (cat.precoAltaCafe !== undefined) result.preco_alta_cafe = cat.precoAltaCafe;
    if (cat.precoAltaSemCafe !== undefined) result.preco_alta_sem_cafe = cat.precoAltaSemCafe;
    if (cat.precoBaixaCafe !== undefined) result.preco_baixa_cafe = cat.precoBaixaCafe;
    if (cat.precoBaixaSemCafe !== undefined) result.preco_baixa_sem_cafe = cat.precoBaixaSemCafe;
    if (cat.ativo !== undefined) result.ativo = cat.ativo;
    if (cat.descricao !== undefined) result.descricao = cat.descricao;
    if (cat.camasCasal !== undefined) result.camas_casal = cat.camasCasal;
    if (cat.camasSolteiro !== undefined) result.camas_solteiro = cat.camasSolteiro;
    if (cat.tipoOcupacaoPadrao !== undefined) result.tipo_ocupacao_padrao = cat.tipoOcupacaoPadrao;
    if (cat.numeros !== undefined) result.numeros = cat.numeros;
    if (cat.comodidadesSelecionadas !== undefined) result.comodidades_selecionadas = cat.comodidadesSelecionadas;
    return result;
  }

  async getAll(): Promise<CategoriaQuarto[]> {
    const { data, error } = await this.getClient()
      .from('categorias')
      .select('*')
      .order('nome');
    if (error) throw error;
    return (data ?? []).map(this.mapRow);
  }

  async getById(id: string): Promise<CategoriaQuarto | null> {
    const { data, error } = await this.getClient()
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapRow(data) : null;
  }

  async create(categoria: Omit<CategoriaQuarto, 'id' | 'criado_em' | 'atualizado_em'>): Promise<CategoriaQuarto> {
    const { id, ...categoriaSemId } = categoria as any;
    const { data, error } = await this.getClient()
      .from('categorias')
      .insert([this.unmapCategoria(categoriaSemId)])
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async update(id: string, categoria: Partial<CategoriaQuarto>): Promise<CategoriaQuarto> {
    const { data, error } = await this.getClient()
      .from('categorias')
      .update({ ...this.unmapCategoria(categoria), atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('categorias')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}