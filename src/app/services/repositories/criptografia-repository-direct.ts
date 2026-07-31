import { Injectable } from '@angular/core';
import { getSupabaseClient } from '../../services/supabase-client';

export interface CriptografiaRepository {
  getKey(nome: string): Promise<{ nome: string; chave: string; iv?: string; salt?: string } | null>;
  setKey(nome: string, chave: string, iv?: string, salt?: string): Promise<void>;
  deleteKey(nome: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseDirectCriptografiaRepository implements CriptografiaRepository {
  private getClient() {
    return getSupabaseClient();
  }

  private mapRow(row: any): { nome: string; chave: string; iv?: string; salt?: string } {
    return {
      nome: row.nome,
      chave: row.chave,
      iv: row.iv,
      salt: row.salt,
    };
  }

  private unmapKey(key: { nome: string; chave: string; iv?: string; salt?: string }): any {
    const result: any = { nome: key.nome, chave: key.chave };
    if (key.iv !== undefined) result.iv = key.iv;
    if (key.salt !== undefined) result.salt = key.salt;
    return result;
  }

  async getKey(nome: string): Promise<{ nome: string; chave: string; iv?: string; salt?: string } | null> {
    const { data, error } = await this.getClient()
      .from('chaves_criptografia')
      .select('nome, chave, iv, salt')
      .eq('nome', nome)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapRow(data) : null;
  }

  async setKey(nome: string, chave: string, iv?: string, salt?: string): Promise<void> {
    const { error } = await this.getClient()
      .from('chaves_criptografia')
      .upsert(this.unmapKey({ nome, chave, iv, salt }), { onConflict: 'nome' });
    if (error) throw error;
  }

  async deleteKey(nome: string): Promise<void> {
    const { error } = await this.getClient()
      .from('chaves_criptografia')
      .delete()
      .eq('nome', nome);
    if (error) throw error;
  }
}