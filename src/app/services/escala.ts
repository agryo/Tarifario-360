// src/app/services/escala.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage';

export interface EscalaConfig {
  p1: string;
  p2: string;
  folgas: number[]; // dias da semana (0=domingo, 6=sábado)
  quemFolgaPrimeiro: 'p1' | 'p2';
  dataInicioFolgas: string; // Data de início das folgas (formato ISO)
}

@Injectable({
  providedIn: 'root',
})
export class EscalaService {
  private readonly STORAGE_KEY = 'escala_config';

  constructor(private storage: StorageService) {}

  getConfiguracao(): EscalaConfig {
    const padrao: EscalaConfig = {
      p1: 'Agryo',
      p2: 'Alex',
      folgas: [0, 6],
      quemFolgaPrimeiro: 'p1',
      dataInicioFolgas: new Date().toISOString().split('T')[0], // Hoje por padrão
    };
    return this.storage.get<EscalaConfig>(this.STORAGE_KEY) || padrao;
  }

  salvarConfiguracao(config: EscalaConfig): void {
    this.storage.set(this.STORAGE_KEY, config);
  }
}
