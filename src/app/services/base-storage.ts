import { Injectable } from '@angular/core';
import { StorageService } from './storage';

/**
 * Serviço base para armazenamento de entidades no localStorage.
 * Elimina duplicação entre OrcamentoOficialService, OrcamentoRapidoService, etc.
 */
@Injectable({
  providedIn: 'root',
})
export abstract class BaseStorageService<T extends { id: string }> {
  protected abstract readonly STORAGE_KEY: string;
  protected abstract readonly ENTITY_TYPE: string;

  constructor(protected storage: StorageService) {}

  /**
   * Cria uma nova entidade com ID gerado
   */
  protected criarEntidade(dados: Partial<T>): T {
    return {
      ...dados,
      id: this.storage.generateId(),
    } as T;
  }

  /**
   * Valida se a entidade tem os campos mínimos necessários
   */
  protected validarEntidade(entidade: unknown): entidade is T {
    return (
      entidade !== null &&
      typeof entidade === 'object' &&
      'id' in entidade &&
      'tipo' in entidade &&
      (entidade as Record<string, unknown>)['tipo'] === this.ENTITY_TYPE
    );
  }

  /**
   * Salva uma entidade (cria ou atualiza)
   */
  salvar(entidade: T): void {
    if (!this.validarEntidade(entidade)) {
      throw new Error(`Dados inválidos. O objeto não é um ${this.ENTITY_TYPE} válido.`);
    }

    const lista = this.listar();
    const index = lista.findIndex((e) => e.id === entidade.id);

    if (index >= 0) {
      lista[index] = entidade;
    } else {
      lista.push(entidade);
    }

    this.storage.set(this.STORAGE_KEY, lista);
  }

  /**
   * Lista todas as entidades
   */
  listar(): T[] {
    return this.storage.get<T[]>(this.STORAGE_KEY) || [];
  }

  /**
   * Busca uma entidade por ID
   */
  buscarPorId(id: string): T | null {
    const lista = this.listar();
    return lista.find((e) => e.id === id) || null;
  }

  /**
   * Exclui uma entidade por ID
   */
  excluir(id: string): void {
    const lista = this.listar().filter((e) => e.id !== id);
    this.storage.set(this.STORAGE_KEY, lista);
  }

  /**
   * Exporta uma entidade para JSON
   */
  exportarParaJSON(entidade: T): string {
    return JSON.stringify(entidade, null, 2);
  }

  /**
   * Importa entidades de um array (para backup/restore)
   */
  importar(entidades: T[]): void {
    this.storage.set(this.STORAGE_KEY, entidades || []);
  }

  /**
   * Limpa todas as entidades
   */
  limpar(): void {
    this.storage.remove(this.STORAGE_KEY);
  }
}