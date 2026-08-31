import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';
import { CategoriasRepository } from './repositories/categorias-repository';
import { ConfigGeralRepository } from './repositories/config-geral-repository';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { RepositoryFactory } from './repository-factory';
import { supabaseApi } from './supabase-client';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../models/tarifa.model';

@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';
  private readonly STORAGE_CONFIG = 'config';

  // Estado temporário do backup carregado na UI (não persistido no banco)
  private backupState: {
    configuracaoGeral?: ConfiguracaoGeral;
    categorias?: CategoriaQuarto[];
    escalaConfig?: any;
    orcamentosOficiais?: any[];
  } | null = null;

  // Notifica quando a configuração geral é atualizada (salvo/importado/limpo)
  private configAtualizadaSource = new Subject<void>();
  configAtualizada$ = this.configAtualizadaSource.asObservable();

  constructor(
    private storage: StorageService,
    private criptografia: CriptografiaService,
    private configFactory: ConfigRepositoryFactory,
    private repoFactory: RepositoryFactory,
  ) {
    this.inicializarDadosPadrao();
  }

  getBackend(): string {
    return this.configFactory.getBackend();
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
    // Se há backup carregado na UI, retorna ele
    if (this.backupState?.categorias) {
      return this.backupState.categorias;
    }

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
    // Se há backup carregado na UI, retorna ele
    if (this.backupState?.configuracaoGeral) {
      return this.backupState.configuracaoGeral;
    }

    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        const config = await this.configGeralRepo.get();
        if (config) {
          // Deep merge com defaults, mas preserva senhaHash/senhaSalt vazios (sem senha)
          const defaults = this.getConfiguracaoPadrao();
          const dbSeguranca = config.seguranca ?? {};
          const seguranca = {
            ...defaults.seguranca,
            ...dbSeguranca,
            // Se veio vazio do banco (usuário removeu senha), mantém vazio
            // Usa verificação explícita de undefined/null pois string vazia "" é falsy
            senhaHash: dbSeguranca.senhaHash !== undefined && dbSeguranca.senhaHash !== null ? dbSeguranca.senhaHash : defaults.seguranca.senhaHash,
            senhaSalt: dbSeguranca.senhaSalt !== undefined && dbSeguranca.senhaSalt !== null ? dbSeguranca.senhaSalt : defaults.seguranca.senhaSalt,
          };
          return {
            ...defaults,
            ...config,
            precos: { ...defaults.precos, ...config.precos, refeicoes: { ...defaults.precos.refeicoes, ...(config.precos?.refeicoes || {}) } },
            temporada: { ...defaults.temporada, ...config.temporada },
            horarios: { ...defaults.horarios, ...config.horarios },
            promocao: { ...defaults.promocao, ...config.promocao },
            seguranca,
            orcamento: { ...defaults.orcamento, ...config.orcamento, textos: { ...defaults.orcamento.textos, ...(config.orcamento?.textos || {}) } },
          };
        }
        // No config in Supabase (empty table) - return defaults, DON'T fall back to localStorage
        return this.getConfiguracaoPadrao();
      }
    } catch (error) {
      console.error('Falha ao buscar config do Supabase:', error);
      throw error;
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

    // Merge com nullish coalescing para seguranca - preserva strings vazias explícitas
    const storedSeguranca = stored.seguranca ?? {};
    const mergedSeguranca = {
      ...defaults.seguranca,
      ...storedSeguranca,
      // Se o usuário removeu a senha (string vazia explícita), preserva vazio
      // Usa verificação explícita de undefined/null pois string vazia "" é falsy
      senhaHash: storedSeguranca.senhaHash !== undefined && storedSeguranca.senhaHash !== null ? storedSeguranca.senhaHash : defaults.seguranca.senhaHash,
      senhaSalt: storedSeguranca.senhaSalt !== undefined && storedSeguranca.senhaSalt !== null ? storedSeguranca.senhaSalt : defaults.seguranca.senhaSalt,
    };

    return {
      ...defaults,
      ...stored,
      seguranca: mergedSeguranca,
    } as ConfiguracaoGeral;
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
    if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
      await this.configGeralRepo.update(config);
    }
    this.storage.set(this.STORAGE_CONFIG, config);
    this.configAtualizadaSource.next();
  }

  // ===== LIMPAR CACHE =====
  async limparCache(): Promise<void> {
    if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
      // Limpa TUDO no Supabase via API (service_role no servidor, bypassa RLS)
      const { supabaseApi } = await import('./supabase-client');
      await supabaseApi.clearDatabase();
    }
    // Limpa localStorage
    this.storage.remove(this.STORAGE_CATEGORIAS);
    this.storage.remove(this.STORAGE_CONFIG);
    // Recria dados padrão
    await this.inicializarDadosPadrao();
    this.configAtualizadaSource.next();
  }

  // ===== DADOS INICIAIS =====
  private async inicializarDadosPadrao(): Promise<void> {
    // Se backup carregado na UI, não inicializa padrão
    if (this.backupState) {
      return;
    }

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

    // Só salva config padrão se NÃO existir nada no banco
    // getConfiguracao() retorna null se tabela vazia (PGRST116)
    const configExistente = await this.configGeralRepo.get();
    if (!configExistente) {
      await this.salvarConfiguracao(this.getConfiguracaoPadrao());
    }
  }

  private getConfiguracaoPadrao(): ConfiguracaoGeral {
    const salt = this.criptografia.gerarSalt();
    const hash = this.criptografia.hashSenha('1234', salt);

    // Data padrão: uma semana à frente de hoje
    const hoje = new Date();
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);
    const altaInicio = umaSemana.toISOString().split('T')[0];

    const altaFim = new Date(umaSemana);
    altaFim.setDate(umaSemana.getDate() + 90); // 90 dias de alta temporada
    const altaFimStr = altaFim.toISOString().split('T')[0];

    return {
      festividade: '🎊 Evento Especial',
      totalUhs: 50,
      comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
      precos: {
        refeicoes: { almoco: 45, janta: 55, lanche: 25 },
        kwh: 0.89,
      },
      temporada: { altaInicio, altaFim: altaFimStr },
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

  // Recarrega dados do Supabase para atualizar o cache local
  async recarregarDoSupabase(): Promise<void> {
    try {
      this.storage.remove(this.STORAGE_CATEGORIAS);
      this.storage.remove(this.STORAGE_CONFIG);
      this.backupState = null; // Limpa backup state ao recarregar
      await this.inicializarDadosPadrao();
      this.configAtualizadaSource.next();
    } catch (error) {
      console.warn('Falha ao recarregar do Supabase:', error);
    }
  }

  /**
   * Define o estado do backup carregado na UI (sem persistir no banco)
   * Usado quando o usuário importa um backup para preencher o Painel Master
   */
  setBackupState(backup: {
    configuracaoGeral?: ConfiguracaoGeral;
    categorias?: CategoriaQuarto[];
    escalaConfig?: any;
    orcamentosOficiais?: any[];
  }): void {
    this.backupState = backup;
  }

  /**
   * Limpa o estado do backup carregado na UI
   */
  clearBackupState(): void {
    this.backupState = null;
  }

  /**
   * Retorna o estado do backup carregado (para uso no Painel Master)
   */
  getBackupState() {
    return this.backupState;
  }
}