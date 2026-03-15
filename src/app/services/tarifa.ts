import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../models/tarifa.model';

@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';
  private readonly STORAGE_CONFIG = 'config';
  private criptografia: CriptografiaService;

  constructor(private storage: StorageService) {
    this.criptografia = new CriptografiaService();
    this.inicializarDadosPadrao();
  }
  // ===== SUBSTITUIÇÃO TOTAL =====
  setCategorias(categorias: CategoriaQuarto[]): void {
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  // ===== CATEGORIAS =====
  /**
   * Retorna todas as categorias de quarto (UHs) salvas no storage.
   * Usado para listar todas as UHs disponíveis no painel de administração e para exportação de backups.
   * @returns Um array com todas as categorias de quarto. Retorna um array vazio se nenhuma for encontrada.
   */
  getCategorias(): CategoriaQuarto[] {
    return this.storage.get<CategoriaQuarto[]>(this.STORAGE_CATEGORIAS) || [];
  }

  /**
   * Busca e retorna uma categoria de quarto específica pelo seu ID.
   * Essencial para o Orçamento Rápido, onde apenas o ID é usado para buscar os detalhes completos da UH.
   * @param id O identificador único da categoria a ser encontrada.
   * @returns O objeto CategoriaQuarto correspondente ao ID, ou null se não for encontrado.
   */
  getCategoria(id: string): CategoriaQuarto | null {
    return this.getCategorias().find((c) => c.id === id) || null;
  }

  salvarCategoria(categoria: CategoriaQuarto): void {
    const categorias = this.getCategorias();
    const index = categorias.findIndex((c) => c.id === categoria.id);
    if (index >= 0) categorias[index] = categoria;
    else {
      categoria.id = this.storage.generateId();
      categorias.push(categoria);
    }
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  excluirCategoria(id: string): void {
    const categorias = this.getCategorias().filter((c) => c.id !== id);
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  // ===== CONFIGURAÇÃO GERAL =====
  getConfiguracao(): ConfiguracaoGeral {
    let stored = this.storage.get<any>(this.STORAGE_CONFIG);
    const defaults = this.getConfiguracaoPadrao();

    if (!stored) {
      return defaults;
    }

    const migrated = this.migrarConfiguracaoSeNecessario(stored);
    if (migrated !== stored) {
      // Se a migração ocorreu, salva a nova estrutura de volta no storage.
      this.salvarConfiguracao(migrated);
      stored = migrated;
    }

    // Garante que novas propriedades adicionadas no futuro sejam incluídas
    return { ...defaults, ...stored } as ConfiguracaoGeral;
  }

  /**
   * Verifica se um objeto de configuração está no formato antigo (plano) e o converte
   * para a nova estrutura aninhada. Retorna a configuração no formato novo.
   * @param config A configuração a ser verificada e possivelmente migrada.
   * @returns A configuração no formato `ConfiguracaoGeral` atualizado.
   */
  migrarConfiguracaoSeNecessario(config: any): ConfiguracaoGeral {
    // A verificação `config.precos === undefined` identifica o formato antigo.
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

  salvarConfiguracao(config: ConfiguracaoGeral): void {
    this.storage.set(this.STORAGE_CONFIG, config);
  }

  // ===== LIMPAR CACHE =====
  limparCache(): void {
    this.storage.remove(this.STORAGE_CATEGORIAS);
    this.storage.remove(this.STORAGE_CONFIG);
    this.inicializarDadosPadrao();
  }

  // ===== DADOS INICIAIS =====
  private inicializarDadosPadrao(): void {
    if (this.getCategorias().length === 0) {
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
      this.storage.set(this.STORAGE_CATEGORIAS, categoriasPadrao);
    }
    if (!this.storage.get(this.STORAGE_CONFIG)) {
      this.storage.set(this.STORAGE_CONFIG, this.getConfiguracaoPadrao());
    }
  }

  private getConfiguracaoPadrao(): ConfiguracaoGeral {
    // Gera um salt e hash para a senha padrão inicial.
    const salt = this.criptografia.gerarSalt();
    const hash = this.criptografia.hashSenha('1234', salt);
    return {
      // Nível superior
      festividade: '🎊 Evento Especial',
      totalUhs: 50,
      comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',

      // Seção de Preços
      precos: {
        refeicoes: {
          almoco: 45,
          janta: 55,
          lanche: 25,
        },
        kwh: 0.89,
      },

      // Seção de Temporada
      temporada: {
        altaInicio: '2025-12-15',
        altaFim: '2026-03-15',
      },

      // Seção de Horários
      horarios: {
        cafe: { inicio: '07:00', fim: '10:00', ativo: true },
        almoco: { inicio: '12:00', fim: '14:00', ativo: true },
        lanche: { inicio: '15:00', fim: '17:00', ativo: true },
        jantar: { inicio: '19:00', fim: '21:00', ativo: true },
      },

      // Seção de Promoção
      promocao: {
        ativa: false,
        desconto: 15,
        minDiarias: 3,
        texto: 'Pagamento integral via Pix ou Dinheiro',
        somenteAlta: true,
        msgBaixa: false,
      },

      // Seção de Segurança
      seguranca: {
        senhaHash: hash,
        senhaSalt: salt,
      },

      // Seção de Orçamento
      orcamento: {
        textos: {
          titulo: 'Orçamento de Hospedagem',
          configTitulo: '1. Configuração de Acomodação e Valores',
          configDescricao: 'A proposta contempla a estadia com café da manhã incluido...',
          notaRefeicoes:
            'Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...',
          cronograma:
            'Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}',
          pagamento:
            'Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...',
          observacoes: 'Refeições: O café da manhã é cortesia da casa e já está incluso...',
          rodape: 'Setor de Reservas - Hotel Plaza',
        },
        sinalPercentual: 50,
      },
    };
  }
}
