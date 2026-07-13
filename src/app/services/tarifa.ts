import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';
import { CategoriasRepository } from './repositories/categorias-repository';
import { ConfigGeralRepository } from './repositories/config-geral-repository';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { RepositoryFactory } from './repository-factory';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../models/tarifa.model';

@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';
  private readonly STORAGE_CONFIG = 'config';

  constructor(
    private storage: StorageService,
    private criptografia: CriptografiaService,
    private configFactory: ConfigRepositoryFactory,
    private repoFactory: RepositoryFactory,
  ) {
    this.inicializarDadosPadrao();
  }

  private get categoriasRepo(): CategoriasRepository {
    return this.repoFactory.getCategoriasRepo();
  }

  private get configGeralRepo(): ConfigGeralRepository {
    return this.repoFactory.getConfigGeralRepo();
  }

  // ===== SUBSTITUIÇÃO TOTAL =====
  async setCategorias(categorias: CategoriaQuarto[]): Promise<void> {
    await this.categoriasRepo.create(categorias[0]); // First one
    // For bulk, we'd need a batch method - for now use local storage as fallback
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  // ===== CATEGORIAS =====
  /**
   * Retorna todas as categorias de quarto (UHs) salvas no storage.
   * Usado para listar todas as UHs disponíveis no painel de administração e para exportação de backups.
   * @returns Um array com todas as categorias de quarto. Retorna um array vazio se nenhuma for encontrada.
   */
  async getCategorias(): Promise<CategoriaQuarto[]> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        return await this.categoriasRepo.getAll();
      }
    } catch (error) {
      console.warn('Falha ao buscar categorias do Supabase, usando localStorage:', error);
    }
    return this.storage.get<CategoriaQuarto[]>(this.STORAGE_CATEGORIAS) || [];
  }

  /**
   * Busca e retorna uma categoria de quarto específica pelo seu ID.
   * Essencial para o Orçamento Rápido, onde apenas o ID é usado para buscar os detalhes completos da UH.
   * @param id O identificador único da categoria a ser encontrada.
   * @returns O objeto CategoriaQuarto correspondente ao ID, ou null se não for encontrado.
   */
  async getCategoria(id: string): Promise<CategoriaQuarto | null> {
    // Se ID não é UUID válido, não tentar Supabase (evita erro 400)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const categorias = await this.getCategorias();
      return categorias.find((c) => c.id === id) || null;
    }
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        return await this.categoriasRepo.getById(id);
      }
    } catch (error) {
      console.warn('Falha ao buscar categoria do Supabase, usando localStorage:', error);
    }
    const categorias = await this.getCategorias();
    return categorias.find((c) => c.id === id) || null;
  }

  async salvarCategoria(categoria: CategoriaQuarto): Promise<void> {
    // Validar se ID é UUID antes de consultar Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoria.id);
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        if (isUuid) {
          const existing = await this.categoriasRepo.getById(categoria.id);
          if (existing) {
            await this.categoriasRepo.update(categoria.id, categoria);
          } else {
            const { id, ...categoriaSemId } = categoria;
            const created = await this.categoriasRepo.create(categoriaSemId);
            categoria.id = created.id;
          }
        } else {
          // ID não é UUID - criar novo no Supabase
          const { id, ...categoriaSemId } = categoria;
          const created = await this.categoriasRepo.create(categoriaSemId);
          categoria.id = created.id;
        }
      }
    } catch (error) {
      console.warn('Falha ao salvar categoria no Supabase:', error);
    }
    // Fallback to localStorage
    const categorias = await this.getCategorias();
    const index = categorias.findIndex((c) => c.id === categoria.id);
    if (index >= 0) categorias[index] = categoria;
    else {
      categoria.id = this.storage.generateId();
      categorias.push(categoria);
    }
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  async excluirCategoria(id: string): Promise<void> {
    // Validar se ID é UUID antes de tentar excluir no Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        if (isUuid) {
          await this.categoriasRepo.delete(id);
        }
        // Se não é UUID, não tentar deletar no Supabase (não existe lá)
      }
    } catch (error) {
      console.warn('Falha ao excluir categoria do Supabase:', error);
    }
    const categorias = (await this.getCategorias()).filter((c) => c.id !== id);
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  // ===== CONFIGURAÇÃO GERAL =====
  async getConfiguracao(): Promise<ConfiguracaoGeral> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        const config = await this.configGeralRepo.get();
        if (config) {
          // Deep merge com defaults para garantir que objetos aninhados existam
          const defaults = this.getConfiguracaoPadrao();
          return {
            ...defaults,
            ...config,
            precos: { ...defaults.precos, ...config.precos, refeicoes: { ...defaults.precos.refeicoes, ...(config.precos?.refeicoes || {}) } },
            temporada: { ...defaults.temporada, ...config.temporada },
            horarios: { ...defaults.horarios, ...config.horarios },
            promocao: { ...defaults.promocao, ...config.promocao },
            seguranca: { ...defaults.seguranca, ...config.seguranca },
            orcamento: { ...defaults.orcamento, ...config.orcamento, textos: { ...defaults.orcamento.textos, ...(config.orcamento?.textos || {}) } },
          };
        }
      }
    } catch (error) {
      console.warn('Falha ao buscar config do Supabase, usando localStorage:', error);
    }

    let stored = this.storage.get<any>(this.STORAGE_CONFIG);
    const defaults = this.getConfiguracaoPadrao();

    if (!stored) {
      return defaults;
    }

    const migrated = this.migrarConfiguracaoSeNecessario(stored);
    if (migrated !== stored) {
      await this.salvarConfiguracao(migrated);
      stored = migrated;
    }

    return { ...defaults, ...stored } as ConfiguracaoGeral;
  }

  /**
   * Verifica se um objeto de configuração está no formato antigo (plano) e o converte
   * para a nova estrutura aninhada. Retorna a configuração no formato novo.
   * @param config A configuração a ser verificada e possivelmente migrada.
   * @returns A configuração no formato `ConfiguracaoGeral` atualizado.
   */
  migrarConfiguracaoSeNecessario(config: any): ConfiguracaoGeral {
    if (config && config.precos === undefined && config.valorAlmocoExtra !== undefined) {
      return {
        festividade: config.festividade,
        totalUhs: config.totalUhs,
        comodidadesGlobais: config.comodidadesGlobais,
        precos: {
          refeicoes: {
            almoco: config.valorAlmocoExtra,
            janta: config.valorJantaExtra,
            lanche: config.valorLancheExtra,
          },
          kwh: config.valorKwh,
        },
        temporada: { altaInicio: config.altaInicio, altaFim: config.altaFim },
        horarios: {
          cafe: { inicio: config.cafeInicio, fim: config.cafeFim, ativo: config.cafeAtivo },
          almoco: { inicio: config.almocoInicio, fim: config.almocoFim, ativo: config.almocoAtivo },
          lanche: {
            inicio: config.lancheTardeInicio,
            fim: config.lancheTardeFim,
            ativo: config.lancheTardeAtivo,
          },
          jantar: { inicio: config.jantarInicio, fim: config.jantarFim, ativo: config.jantarAtivo },
        },
        promocao: {
          ativa: config.promocaoAtiva,
          desconto: config.promocaoDesconto,
          minDiarias: config.promocaoMinDiarias,
          texto: config.promocaoTexto,
          somenteAlta: config.promocaoSomenteAlta,
          msgBaixa: config.promocaoMsgBaixa,
        },
        seguranca: { senhaHash: config.senhaHash, senhaSalt: config.senhaSalt },
        orcamento: {
          textos: {
            titulo: config.orcTitulo,
            configTitulo: config.orcConfigTitulo,
            configDescricao: config.orcConfigDescricao,
            notaRefeicoes: config.orcNotaRefeicoes,
            cronograma: config.orcCronograma,
            pagamento: config.orcPagamento,
            observacoes: config.orcObservacoes,
            rodape: config.orcRodape,
          },
          sinalPercentual: config.orcSinalPercentual,
        },
      };
    }
    return config as ConfiguracaoGeral;
  }

  async salvarConfiguracao(config: ConfiguracaoGeral): Promise<void> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        await this.configGeralRepo.update(config);
      }
    } catch (error) {
      console.warn('Falha ao salvar config no Supabase:', error);
    }
    this.storage.set(this.STORAGE_CONFIG, config);
  }

  // ===== LIMPAR CACHE =====
  async limparCache(): Promise<void> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        // Clear would need a bulk delete - for now just local
      }
    } catch (error) {
      console.warn('Falha ao limpar cache do Supabase:', error);
    }
    this.storage.remove(this.STORAGE_CATEGORIAS);
    this.storage.remove(this.STORAGE_CONFIG);
    await this.inicializarDadosPadrao();
  }

  // ===== DADOS INICIAIS =====
  private async inicializarDadosPadrao(): Promise<void> {
    const categorias = await this.getCategorias();
    if (categorias.length === 0) {
      const categoriasPadrao: CategoriaQuarto[] = [
        {
          id: this.storage.generateId(),
          nome: 'Standard',
          capacidadeMaxima: 2,
          precoAltaCafe: 380,
          precoAltaSemCafe: 350,
          precoBaixaCafe: 280,
          precoBaixaSemCafe: 250,
          ativo: true,
          descricao: 'Quarto confortável',
          camasCasal: 1,
          camasSolteiro: 0,
          tipoOcupacaoPadrao: '',
          numeros: ['01', '02'],
          comodidadesSelecionadas: ['Wi-Fi', 'TV'],
        },
        {
          id: this.storage.generateId(),
          nome: 'Luxo',
          capacidadeMaxima: 3,
          precoAltaCafe: 580,
          precoAltaSemCafe: 550,
          precoBaixaCafe: 430,
          precoBaixaSemCafe: 400,
          ativo: true,
          descricao: 'Quarto com vista para o mar',
          camasCasal: 1,
          camasSolteiro: 1,
          tipoOcupacaoPadrao: '',
          numeros: ['03', '04'],
          comodidadesSelecionadas: ['Wi-Fi', 'TV', 'Frigobar'],
        },
      ];
      for (const cat of categoriasPadrao) {
        await this.salvarCategoria(cat);
      }
    }

    const config = await this.getConfiguracao();
    if (!config || Object.keys(config).length === 0) {
      await this.salvarConfiguracao(this.getConfiguracaoPadrao());
    }
  }

  private getConfiguracaoPadrao(): ConfiguracaoGeral {
    const salt = this.criptografia.gerarSalt();
    const hash = this.criptografia.hashSenha('1234', salt);
    return {
      festividade: '🎊 Evento Especial',
      totalUhs: 50,
      comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
      precos: {
        refeicoes: { almoco: 45, janta: 55, lanche: 25 },
        kwh: 0.89,
      },
      temporada: { altaInicio: '2025-12-15', altaFim: '2026-03-15' },
      horarios: {
        cafe: { inicio: '07:00', fim: '10:00', ativo: true },
        almoco: { inicio: '12:00', fim: '14:00', ativo: true },
        lanche: { inicio: '15:00', fim: '17:00', ativo: true },
        jantar: { inicio: '19:00', fim: '21:00', ativo: true },
      },
      promocao: {
        ativa: false,
        desconto: 15,
        minDiarias: 3,
        texto: 'Pagamento integral via Pix ou Dinheiro',
        somenteAlta: true,
        msgBaixa: false,
      },
      seguranca: { senhaHash: hash, senhaSalt: salt },
      orcamento: {
        textos: {
          titulo: 'Orçamento de Hospedagem',
          configTitulo: '1. Configuração de Acomodação e Valores',
          configDescricao: 'A proposta contempla a estadia com café da manhã incluido...',
          notaRefeicoes: 'Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...',
          cronograma: 'Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}',
          pagamento: 'Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...',
          observacoes: 'Refeições: O café da manhã é cortesia da casa e já está incluso...',
          rodape: 'Setor de Reservas - Hotel Plaza',
        },
        sinalPercentual: 50,
      },
    };
  }
}