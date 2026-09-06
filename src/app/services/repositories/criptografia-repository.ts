import { Injectable, Inject } from '@angular/core';
import { ClientStrategy, CLIENT_STRATEGY } from './client-strategy';
import { ICriptografiaRepository } from './repository-interfaces';

@Injectable({ providedIn: 'root' })
export class CriptografiaRepository implements ICriptografiaRepository {
  constructor(@Inject(CLIENT_STRATEGY) private strategy: ClientStrategy) {}

  private mapRow(row: any): { nome: string; chave: string; iv?: string; salt?: string } {
    return {
      nome: row.nome,
      chave: row.chave,
      iv: row.iv,
      salt: row.salt,
    };
  }

  async getKey(nome: string): Promise<{ nome: string; chave: string; iv?: string; salt?: string } | null> {
    const row = await this.strategy.getChaveCriptografia(nome);
    return row ? this.mapRow(row) : null;
  }

  async setKey(nome: string, chave: string, iv?: string, salt?: string): Promise<void> {
    return this.strategy.setChaveCriptografia(nome, chave, iv, salt);
  }
}