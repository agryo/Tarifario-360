import { Injectable } from '@angular/core';
import { supabaseApi } from '../supabase-client';

export type { CriptografiaRepository } from './repository-interfaces';
import { CriptografiaRepository } from './repository-interfaces';

@Injectable({ providedIn: 'root' })
export class SupabaseCriptografiaRepository implements CriptografiaRepository {
  async getKey(nome: string): Promise<{ nome: string; chave: string; iv?: string; salt?: string } | null> {
    try {
      return await supabaseApi.getChaveCriptografia(nome);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not found')) return null;
      throw error;
    }
  }

  async setKey(nome: string, chave: string, iv?: string, salt?: string): Promise<any> {
    return supabaseApi.setChaveCriptografia(nome, chave, iv, salt);
  }
}
