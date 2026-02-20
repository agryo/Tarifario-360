import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly PREFIX = 'tarifario360_';

  constructor() {}

  // Salvar dados
  set<T>(key: string, value: T): void {
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(this.PREFIX + key, jsonValue);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  // Ler dados
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const value = localStorage.getItem(this.PREFIX + key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return defaultValue;
    }
  }

  // Remover dados
  remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  // Limpar todos os dados da app
  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  }

  // Gerar ID único
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
