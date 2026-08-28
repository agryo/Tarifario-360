import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../../models/tarifa.model';
import { EscalaConfig } from '../../models/escala-config.model';
import { OrcamentoOficial } from '../../models/orcamento-oficial.model';

/**
 * Interfaces comuns de repositório.
 * Compartilhadas entre as implementações via API (supabaseApi) e via cliente direto
 * (getSupabaseClient), evitando duplicação e deriva de assinaturas.
 */
export interface CategoriasRepository {
  getAll(): Promise<CategoriaQuarto[]>;
  getById(id: string): Promise<CategoriaQuarto | null>;
  create(categoria: Omit<CategoriaQuarto, 'id' | 'criado_em' | 'atualizado_em'>): Promise<CategoriaQuarto>;
  update(id: string, categoria: Partial<CategoriaQuarto>): Promise<CategoriaQuarto>;
  delete(id: string): Promise<void>;
}

export interface ConfigGeralRepository {
  get(): Promise<ConfiguracaoGeral | null>;
  update(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral>;
}

export interface CriptografiaRepository {
  getKey(nome: string): Promise<{ nome: string; chave: string; iv?: string; salt?: string } | null>;
  setKey(nome: string, chave: string, iv?: string, salt?: string): Promise<void>;
}

export interface EscalaRepository {
  get(): Promise<EscalaConfig | null>;
  update(config: Partial<EscalaConfig>): Promise<EscalaConfig>;
}

export interface OrcamentosOficiaisRepository {
  getAll(): Promise<OrcamentoOficial[]>;
  getById(id: string): Promise<OrcamentoOficial | null>;
  create(orcamento: Omit<OrcamentoOficial, 'id' | 'criado_em' | 'atualizado_em'>): Promise<OrcamentoOficial>;
  update(id: string, orcamento: Partial<OrcamentoOficial>): Promise<OrcamentoOficial>;
  delete(id: string): Promise<void>;
}
