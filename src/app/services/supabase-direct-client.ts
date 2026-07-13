import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../models/tarifa.model';
import { OrcamentoOficial } from '../models/orcamento-oficial.model';
import { OrcamentoRapido } from '../models/orcamento-rapido.model';
import { EscalaConfig } from '../models/escala-config.model';

export class SupabaseDirectClient {
  private client: SupabaseClient;

  constructor() {
    const url = environment.supabaseUrl;
    const key = environment.supabaseAnonKey;

    if (!url || !key) {
      throw new Error('Supabase URL e Anon Key são obrigatórios no environment');
    }

    this.client = createClient(url, key);
  }

  // Categorias
  async getCategorias(): Promise<CategoriaQuarto[]> {
    const { data, error } = await this.client
      .from('categorias')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapCategoria);
  }

  async getCategoria(id: string): Promise<CategoriaQuarto | null> {
    const { data, error } = await this.client
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapCategoria(data) : null;
  }

  async createCategoria(categoria: Omit<CategoriaQuarto, 'id' | 'criado_em' | 'atualizado_em'>): Promise<CategoriaQuarto> {
    // Não enviar ID - deixar o Supabase gerar UUID automaticamente
    const { id, ...categoriaSemId } = categoria as any;
    const { data, error } = await this.client
      .from('categorias')
      .insert(this.unmapCategoria(categoriaSemId))
      .select()
      .single();
    if (error) throw error;
    return this.mapCategoria(data);
  }

  async updateCategoria(id: string, categoria: Partial<CategoriaQuarto>): Promise<CategoriaQuarto> {
    const { data, error } = await this.client
      .from('categorias')
      .update(this.unmapCategoria(categoria))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapCategoria(data);
  }

  async deleteCategoria(id: string): Promise<void> {
    const { error } = await this.client
      .from('categorias')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Config Geral
  async getConfigGeral(): Promise<ConfiguracaoGeral | null> {
    const { data, error } = await this.client
      .from('config_geral')
      .select('*')
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapConfigGeral(data) : null;
  }

  async updateConfigGeral(config: Partial<ConfiguracaoGeral>): Promise<ConfiguracaoGeral> {
    // Delete any existing rows (table should have only one row)
    await this.client.from('config_geral').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new row with generated UUID
    const { data: result, error } = await this.client
      .from('config_geral')
      .insert({ ...this.unmapConfigGeral(config), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return this.mapConfigGeral(result);
  }

  // Escala
  async getEscala(): Promise<EscalaConfig | null> {
    const { data, error } = await this.client
      .from('escala_config')
      .select('configuracao')
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.configuracao ?? null;
  }

  async updateEscala(configuracao: EscalaConfig): Promise<EscalaConfig> {
    // Delete any existing rows (table should have only one row)
    await this.client.from('escala_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new row with generated UUID
    const { data: result, error } = await this.client
      .from('escala_config')
      .insert({ configuracao, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select('configuracao')
      .single();
    if (error) throw error;
    return result?.configuracao ?? null;
  }

  // Orçamentos Oficiais
  async getOrcamentosOficiais(): Promise<OrcamentoOficial[]> {
    const { data, error } = await this.client
      .from('orcamentos_oficiais')
      .select('*')
      .order('data_geracao', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapOrcamentoOficial);
  }

  async getOrcamentoOficial(id: string): Promise<OrcamentoOficial | null> {
    const { data, error } = await this.client
      .from('orcamentos_oficiais')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapOrcamentoOficial(data) : null;
  }

  async createOrcamentoOficial(orcamento: Omit<OrcamentoOficial, 'id' | 'criado_em' | 'atualizado_em'>): Promise<OrcamentoOficial> {
    // Não enviar ID - deixar o Supabase gerar UUID automaticamente
    const { id, ...orcamentoSemId } = orcamento as any;
    const { data, error } = await this.client
      .from('orcamentos_oficiais')
      .insert(this.unmapOrcamentoOficial(orcamentoSemId))
      .select()
      .single();
    if (error) throw error;
    return this.mapOrcamentoOficial(data);
  }

  async updateOrcamentoOficial(id: string, orcamento: Partial<OrcamentoOficial>): Promise<OrcamentoOficial> {
    const { data, error } = await this.client
      .from('orcamentos_oficiais')
      .update(this.unmapOrcamentoOficial(orcamento))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapOrcamentoOficial(data);
  }

  async deleteOrcamentoOficial(id: string): Promise<void> {
    const { error } = await this.client
      .from('orcamentos_oficiais')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Orçamentos Rápidos
  async getOrcamentosRapidos(): Promise<OrcamentoRapido[]> {
    const { data, error } = await this.client
      .from('orcamentos_rapidos')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapOrcamentoRapido);
  }

  async getOrcamentoRapido(id: string): Promise<OrcamentoRapido | null> {
    const { data, error } = await this.client
      .from('orcamentos_rapidos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapOrcamentoRapido(data) : null;
  }

  async createOrcamentoRapido(orcamento: Omit<OrcamentoRapido, 'id' | 'criado_em'>): Promise<OrcamentoRapido> {
    // Não enviar ID - deixar o Supabase gerar UUID automaticamente
    const { id, ...orcamentoSemId } = orcamento as any;
    const { data, error } = await this.client
      .from('orcamentos_rapidos')
      .insert(this.unmapOrcamentoRapido(orcamentoSemId))
      .select()
      .single();
    if (error) throw error;
    return this.mapOrcamentoRapido(data);
  }

  async updateOrcamentoRapido(id: string, orcamento: Partial<OrcamentoRapido>): Promise<OrcamentoRapido> {
    const { data, error } = await this.client
      .from('orcamentos_rapidos')
      .update(this.unmapOrcamentoRapido(orcamento))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapOrcamentoRapido(data);
  }

  async deleteOrcamentoRapido(id: string): Promise<void> {
    const { error } = await this.client
      .from('orcamentos_rapidos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Backup
  async exportBackup(): Promise<any> {
    const [categorias, configGeral, escalaConfig, orcamentosOficiais, orcamentosRapidos, chaves] = await Promise.all([
      this.client.from('categorias').select('*'),
      this.client.from('config_geral').select('*').limit(1).single(),
      this.client.from('escala_config').select('configuracao').limit(1).single(),
      this.client.from('orcamentos_oficiais').select('*'),
      this.client.from('orcamentos_rapidos').select('*'),
      this.client.from('chaves_criptografia').select('*'),
    ]);

    return {
      versao: '2.0',
      data_exportacao: new Date().toISOString(),
      categorias: categorias.data ?? [],
      config_geral: configGeral.data ?? null,
      escala_config: escalaConfig.data?.configuracao ?? null,
      orcamentos_oficiais: orcamentosOficiais.data ?? [],
      orcamentos_rapidos: orcamentosRapidos.data ?? [],
      chaves_criptografia: chaves.data ?? [],
    };
  }

  async importBackup(backup: any): Promise<any> {
    // Implementar se necessário
    throw new Error('Import backup não implementado no cliente direto');
  }

  // Criptografia
  async getChaveCriptografia(nome: string): Promise<any> {
    const { data, error } = await this.client
      .from('chaves_criptografia')
      .select('*')
      .eq('nome', nome)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async setChaveCriptografia(nome: string, chave: string, iv?: string, salt?: string): Promise<any> {
    const { data, error } = await this.client
      .from('chaves_criptografia')
      .upsert({ nome, chave, iv, salt, criado_em: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Health
  async healthCheck(): Promise<any> {
    const { data, error } = await this.client.from('config_geral').select('id').limit(1);
    if (error) throw error;
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Mappers DB -> Model
  private mapCategoria(row: any): CategoriaQuarto {
    return {
      id: row.id,
      nome: row.nome,
      capacidadeMaxima: row.capacidade_maxima,
      precoAltaCafe: Number(row.preco_alta_cafe),
      precoAltaSemCafe: Number(row.preco_alta_sem_cafe),
      precoBaixaCafe: Number(row.preco_baixa_cafe),
      precoBaixaSemCafe: Number(row.preco_baixa_sem_cafe),
      ativo: row.ativo,
      descricao: row.descricao,
      camasCasal: row.camas_casal,
      camasSolteiro: row.camas_solteiro,
      tipoOcupacaoPadrao: row.tipo_ocupacao_padrao,
      numeros: row.numeros,
      comodidadesSelecionadas: row.comodidades_selecionadas,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapCategoria(cat: Partial<CategoriaQuarto>): any {
    const result: any = {};
    if (cat.nome !== undefined) result.nome = cat.nome;
    if (cat.capacidadeMaxima !== undefined) result.capacidade_maxima = cat.capacidadeMaxima;
    if (cat.precoAltaCafe !== undefined) result.preco_alta_cafe = cat.precoAltaCafe;
    if (cat.precoAltaSemCafe !== undefined) result.preco_alta_sem_cafe = cat.precoAltaSemCafe;
    if (cat.precoBaixaCafe !== undefined) result.preco_baixa_cafe = cat.precoBaixaCafe;
    if (cat.precoBaixaSemCafe !== undefined) result.preco_baixa_baixa_sem_cafe = cat.precoBaixaSemCafe;
    if (cat.ativo !== undefined) result.ativo = cat.ativo;
    if (cat.descricao !== undefined) result.descricao = cat.descricao;
    if (cat.camasCasal !== undefined) result.camas_casal = cat.camasCasal;
    if (cat.camasSolteiro !== undefined) result.camas_solteiro = cat.camasSolteiro;
    if (cat.tipoOcupacaoPadrao !== undefined) result.tipo_ocupacao_padrao = cat.tipoOcupacaoPadrao;
    if (cat.numeros !== undefined) result.numeros = cat.numeros;
    if (cat.comodidadesSelecionadas !== undefined) result.comodidades_selecionadas = cat.comodidadesSelecionadas;
    return result;
  }

  private mapConfigGeral(row: any): ConfiguracaoGeral {
    return {
      festividade: row.festividade,
      totalUhs: row.total_uhs,
      comodidadesGlobais: row.comodidades_globais,
      precos: row.precos,
      temporada: row.temporada,
      horarios: row.horarios,
      promocao: row.promocao,
      seguranca: row.seguranca,
      orcamento: row.orcamento,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapConfigGeral(config: Partial<ConfiguracaoGeral>): any {
    const result: any = {};
    if (config.festividade !== undefined) result.festividade = config.festividade;
    if (config.totalUhs !== undefined) result.total_uhs = config.totalUhs;
    if (config.comodidadesGlobais !== undefined) result.comodidades_globais = config.comodidadesGlobais;
    if (config.precos !== undefined) result.precos = config.precos;
    if (config.temporada !== undefined) result.temporada = config.temporada;
    if (config.horarios !== undefined) result.horarios = config.horarios;
    if (config.promocao !== undefined) result.promocao = config.promocao;
    if (config.seguranca !== undefined) result.seguranca = config.seguranca;
    if (config.orcamento !== undefined) result.orcamento = config.orcamento;
    return result;
  }

  private mapOrcamentoOficial(row: any): OrcamentoOficial {
    return {
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      cliente: row.cliente,
      evento: row.evento,
      dataGeracao: row.data_geracao,
      dataValidade: row.data_validade,
      dataCheckin: row.data_checkin,
      dataCheckout: row.data_checkout,
      horaEntrada: row.hora_entrada,
      horaSaida: row.hora_saida,
      temporada: row.temporada,
      itens: row.itens,
      observacoes: row.observacoes,
      status: row.status,
      assinatura: row.assinatura,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapOrcamentoOficial(orc: Partial<OrcamentoOficial>): any {
    const result: any = {};
    if (orc.tipo !== undefined) result.tipo = orc.tipo;
    if (orc.titulo !== undefined) result.titulo = orc.titulo;
    if (orc.cliente !== undefined) result.cliente = orc.cliente;
    if (orc.evento !== undefined) result.evento = orc.evento;
    if (orc.dataGeracao !== undefined) result.data_geracao = orc.dataGeracao;
    if (orc.dataValidade !== undefined) result.data_validade = orc.dataValidade;
    if (orc.dataCheckin !== undefined) result.data_checkin = orc.dataCheckin;
    if (orc.dataCheckout !== undefined) result.data_checkout = orc.dataCheckout;
    if (orc.horaEntrada !== undefined) result.hora_entrada = orc.horaEntrada;
    if (orc.horaSaida !== undefined) result.hora_saida = orc.horaSaida;
    if (orc.temporada !== undefined) result.temporada = orc.temporada;
    if (orc.itens !== undefined) result.itens = orc.itens;
    if (orc.observacoes !== undefined) result.observacoes = orc.observacoes;
    if (orc.status !== undefined) result.status = orc.status;
    if (orc.assinatura !== undefined) result.assinatura = orc.assinatura;
    return result;
  }

  private mapOrcamentoRapido(row: any): OrcamentoRapido {
    return {
      id: row.id,
      tipo: row.tipo,
      dataGeracao: row.data_geracao,
      categoriaId: row.categoria_id,
      dataCheckin: row.data_checkin,
      dataCheckout: row.data_checkout,
      numeroNoites: row.numero_noites,
      quantidade: row.quantidade,
      valorDiaria: Number(row.valor_diaria),
      tipoTemporada: row.tipo_temporada,
      valorTotal: Number(row.valor_total),
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private unmapOrcamentoRapido(orc: Partial<OrcamentoRapido>): any {
    const result: any = {};
    if (orc.tipo !== undefined) result.tipo = orc.tipo;
    if (orc.dataGeracao !== undefined) result.data_geracao = orc.dataGeracao;
    if (orc.categoriaId !== undefined) result.categoria_id = orc.categoriaId;
    if (orc.dataCheckin !== undefined) result.data_checkin = orc.dataCheckin;
    if (orc.dataCheckout !== undefined) result.data_checkout = orc.dataCheckout;
    if (orc.numeroNoites !== undefined) result.numero_noites = orc.numeroNoites;
    if (orc.quantidade !== undefined) result.quantidade = orc.quantidade;
    if (orc.valorDiaria !== undefined) result.valor_diaria = orc.valorDiaria;
    if (orc.tipoTemporada !== undefined) result.tipo_temporada = orc.tipoTemporada;
    if (orc.valorTotal !== undefined) result.valor_total = orc.valorTotal;
    if (orc.atualizado_em !== undefined) result.atualizado_em = orc.atualizado_em;
    return result;
  }
}

// Instância singleton para desenvolvimento (lazy initialization)
let _supabaseDirect: SupabaseDirectClient | null = null;

export function getSupabaseDirect(): SupabaseDirectClient | null {
  if (environment.production) return null;
  if (!_supabaseDirect) {
    _supabaseDirect = new SupabaseDirectClient();
  }
  return _supabaseDirect;
}