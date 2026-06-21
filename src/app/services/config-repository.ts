import { Injectable } from '@angular/core';

/**
 * Interface comum para repositório de configurações.
 * Permite trocar implementação (localStorage ↔ Supabase) sem mudar componentes.
 */
export interface ConfigRepository {
  /**
   * Busca um item de configuração.
   * @param categoria Ex: 'uhs', 'precos', 'promocoes', 'horarios', 'backup'
   * @param chave Identificador único dentro da categoria
   */
  get<T>(categoria: string, chave: string): Promise<T | null>;

  /**
   * Salva/atualiza um item de configuração.
   */
  set<T>(categoria: string, chave: string, dados: T): Promise<void>;

  /**
   * Lista todos os itens de uma categoria.
   */
  list(categoria: string): Promise<Array<{ chave: string; dados: any }>>;

  /**
   * Remove um item de configuração.
   */
  delete(categoria: string, chave: string): Promise<void>;

  /**
   * Limpa toda a categoria (útil para reset).
   */
  clearCategoria(categoria: string): Promise<void>;
}

/**
 * Chave usada no localStorage para armazenar as configurações
 */
export const CONFIG_STORAGE_KEY = 'tarifario360_config';