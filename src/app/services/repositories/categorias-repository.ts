import { Injectable, Inject } from '@angular/core';
import { ClientStrategy, CLIENT_STRATEGY } from './client-strategy';
import { ICategoriasRepository } from './repository-interfaces';
import { CategoriaQuarto } from '../../models/categoria-quarto.model';

@Injectable({ providedIn: 'root' })
export class CategoriasRepository implements ICategoriasRepository {
  constructor(@Inject(CLIENT_STRATEGY) private strategy: ClientStrategy) {}

  private mapRow(row: any): CategoriaQuarto {
    return {
      id: row.id,
      nome: row.nome,
      capacidadeMaxima: row.capacidadeMaxima,
      precoAltaCafe: Number(row.precoAltaCafe),
      precoAltaSemCafe: Number(row.precoAltaSemCafe),
      precoBaixaCafe: Number(row.precoBaixaCafe),
      precoBaixaSemCafe: Number(row.precoBaixaSemCafe),
      ativo: row.ativo,
      descricao: row.descricao,
      camasCasal: row.camasCasal,
      camasSolteiro: row.camasSolteiro,
      tipoOcupacaoPadrao: row.tipoOcupacaoPadrao,
      numeros: row.numeros,
      comodidadesSelecionadas: row.comodidadesSelecionadas,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapCategoria(cat: Partial<CategoriaQuarto>): any {
    const result: any = {};
    if (cat.nome !== undefined) result.nome = cat.nome;
    if (cat.capacidadeMaxima !== undefined) result.capacidadeMaxima = cat.capacidadeMaxima;
    if (cat.precoAltaCafe !== undefined) result.precoAltaCafe = cat.precoAltaCafe;
    if (cat.precoAltaSemCafe !== undefined) result.precoAltaSemCafe = cat.precoAltaSemCafe;
    if (cat.precoBaixaCafe !== undefined) result.precoBaixaCafe = cat.precoBaixaCafe;
    if (cat.precoBaixaSemCafe !== undefined) result.precoBaixaSemCafe = cat.precoBaixaSemCafe;
    if (cat.ativo !== undefined) result.ativo = cat.ativo;
    if (cat.descricao !== undefined) result.descricao = cat.descricao;
    if (cat.camasCasal !== undefined) result.camasCasal = cat.camasCasal;
    if (cat.camasSolteiro !== undefined) result.camasSolteiro = cat.camasSolteiro;
    if (cat.tipoOcupacaoPadrao !== undefined) result.tipoOcupacaoPadrao = cat.tipoOcupacaoPadrao;
    if (cat.numeros !== undefined) result.numeros = cat.numeros;
    if (cat.comodidadesSelecionadas !== undefined) result.comodidadesSelecionadas = cat.comodidadesSelecionadas;
    return result;
  }

  async getAll(): Promise<CategoriaQuarto[]> {
    const rows = await this.strategy.getCategorias();
    return rows.map(r => this.mapRow(r));
  }

  async getById(id: string): Promise<CategoriaQuarto | null> {
    const row = await this.strategy.getCategoria(id);
    return row ? this.mapRow(row) : null;
  }

  async create(categoria: Omit<CategoriaQuarto, 'id' | 'criado_em' | 'atualizado_em'>): Promise<CategoriaQuarto> {
    const data = this.unmapCategoria(categoria);
    const row = await this.strategy.createCategoria(data);
    return this.mapRow(row);
  }

  async update(id: string, categoria: Partial<CategoriaQuarto>): Promise<CategoriaQuarto> {
    const data = this.unmapCategoria(categoria);
    const row = await this.strategy.updateCategoria(id, data);
    return this.mapRow(row);
  }

  async delete(id: string): Promise<void> {
    return this.strategy.deleteCategoria(id);
  }
}