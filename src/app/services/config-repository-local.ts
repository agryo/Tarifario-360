import { Injectable } from '@angular/core';
import { ConfigRepository, CONFIG_STORAGE_KEY } from './config-repository';

/**
 * Implementação usando localStorage (atual).
 * Estrutura no localStorage:
 * {
 *   "uhs": { "quarto-101": { numero: 101, tipo: "luxo", ... }, ... },
 *   "precos": { "temporada-alta": { diaria: 300, ... }, ... },
 *   ...
 * }
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageConfigRepository implements ConfigRepository {
  private cache: Map<string, Record<string, any>> = new Map();
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([categoria, dados]) => {
          this.cache.set(categoria, dados as Record<string, any>);
        });
      } catch {
        // Ignora erro de parse, começa vazio
      }
    }
    this.initialized = true;
  }

  private persist(): void {
    const obj: Record<string, Record<string, any>> = {};
    this.cache.forEach((dados, categoria) => {
      obj[categoria] = dados;
    });
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(obj));
  }

  async get<T>(categoria: string, chave: string): Promise<T | null> {
    await this.init();
    const cat = this.cache.get(categoria);
    return (cat?.[chave] as T) ?? null;
  }

  async set<T>(categoria: string, chave: string, dados: T): Promise<void> {
    await this.init();
    let cat = this.cache.get(categoria);
    if (!cat) {
      cat = {};
      this.cache.set(categoria, cat);
    }
    cat[chave] = dados;
    this.persist();
  }

  async list(categoria: string): Promise<Array<{ chave: string; dados: any }>> {
    await this.init();
    const cat = this.cache.get(categoria);
    if (!cat) return [];
    return Object.entries(cat).map(([chave, dados]) => ({ chave, dados }));
  }

  async delete(categoria: string, chave: string): Promise<void> {
    await this.init();
    const cat = this.cache.get(categoria);
    if (cat) {
      delete cat[chave];
      this.persist();
    }
  }

  async clearCategoria(categoria: string): Promise<void> {
    await this.init();
    this.cache.delete(categoria);
    this.persist();
  }
}