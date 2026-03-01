import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';

// Interfaces baseadas no Sistema-HP original, agora com campos estendidos
export interface CategoriaQuarto {
  id: string;
  nome: string;
  capacidadeMaxima: number;
  precoAltaCafe: number;
  precoAltaSemCafe: number;
  precoBaixaCafe: number;
  precoBaixaSemCafe: number;
  ativo: boolean;
  // campos opcionais para detalhes
  descricao?: string;
  camasCasal?: number;
  camasSolteiro?: number;
  tipoOcupacaoPadrao?: '' | 'casal' | 'solteiro';
  numeros?: string[];
  comodidadesSelecionadas?: string[];
}

export interface Promocao {
  id: string;
  nome: string;
  desconto: number;
  diasMinimos: number;
  aplicaAlta: boolean;
  mensagemBaixa: string;
}

export interface ConfiguracaoGeral {
  // Dados gerais
  festividade: string;
  valorAlmocoExtra: number;
  valorJantaExtra: number;
  valorLancheExtra: number;
  valorKwh: number;
  totalUhs: number;
  comodidadesGlobais: string;

  // Datas alta temporada
  altaInicio: string; // formato YYYY-MM-DD
  altaFim: string;

  // Horários refeições
  cafeInicio: string;
  cafeFim: string;
  cafeAtivo: boolean;
  almocoInicio: string;
  almocoFim: string;
  almocoAtivo: boolean;
  lancheTardeInicio: string;
  lancheTardeFim: string;
  lancheTardeAtivo: boolean;
  jantarInicio: string;
  jantarFim: string;
  jantarAtivo: boolean;

  // Promoção geral
  promocaoAtiva: boolean;
  promocaoDesconto: number;
  promocaoMinDiarias: number;
  promocaoTexto: string;
  promocaoSomenteAlta: boolean;
  promocaoMsgBaixa: boolean;

  // Segurança - AGORA USANDO HASH
  senhaHash: string; // hash da senha (string vazia = sem senha)
  senhaSalt?: string;

  // ========== TEXTOS DO ORÇAMENTO ==========
  orcTitulo: string;
  orcConfigTitulo: string;
  orcConfigDescricao: string;
  orcNotaRefeicoes: string;
  orcCronograma: string;
  orcPagamento: string;
  orcObservacoes: string;
  orcRodape: string;
  orcSinalPercentual: number;
}

@Injectable({
  providedIn: 'root',
})
export class TarifaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';
  private readonly STORAGE_PROMOCOES = 'promocoes';
  private readonly STORAGE_CONFIG = 'config';

  private criptografia: CriptografiaService;

  constructor(private storage: StorageService) {
    this.criptografia = new CriptografiaService();
    this.inicializarDadosPadrao();
  }

  // ===== CATEGORIAS (UHs) =====
  getCategorias(): CategoriaQuarto[] {
    return this.storage.get<CategoriaQuarto[]>(this.STORAGE_CATEGORIAS) || [];
  }

  getCategoria(id: string): CategoriaQuarto | null {
    const categorias = this.getCategorias();
    return categorias.find((c) => c.id === id) || null;
  }

  salvarCategoria(categoria: CategoriaQuarto): void {
    const categorias = this.getCategorias();
    const index = categorias.findIndex((c) => c.id === categoria.id);

    if (index >= 0) {
      categorias[index] = categoria;
    } else {
      categoria.id = this.storage.generateId();
      categorias.push(categoria);
    }

    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  excluirCategoria(id: string): void {
    const categorias = this.getCategorias().filter((c) => c.id !== id);
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  // ===== PROMOÇÕES =====
  getPromocoes(): Promocao[] {
    return this.storage.get<Promocao[]>(this.STORAGE_PROMOCOES) || [];
  }

  salvarPromocao(promocao: Promocao): void {
    const promocoes = this.getPromocoes();
    const index = promocoes.findIndex((p) => p.id === promocao.id);

    if (index >= 0) {
      promocoes[index] = promocao;
    } else {
      promocao.id = this.storage.generateId();
      promocoes.push(promocao);
    }

    this.storage.set(this.STORAGE_PROMOCOES, promocoes);
  }

  excluirPromocao(id: string): void {
    const promocoes = this.getPromocoes().filter((p) => p.id !== id);
    this.storage.set(this.STORAGE_PROMOCOES, promocoes);
  }

  // ===== CONFIGURAÇÃO GERAL =====
  getConfiguracao(): ConfiguracaoGeral {
    const stored = this.storage.get<ConfiguracaoGeral>(this.STORAGE_CONFIG);
    if (stored) {
      const defaults = this.getConfiguracaoPadrao();
      const result = { ...stored };
      // Preenche apenas campos que estão totalmente ausentes (undefined)
      Object.keys(defaults).forEach((key) => {
        if (result[key as keyof ConfiguracaoGeral] === undefined) {
          (result as any)[key] = defaults[key as keyof ConfiguracaoGeral];
        }
      });
      return result;
    }

    // Se não existir configuração, retorna a padrão
    return this.getConfiguracaoPadrao();
  }

  private getConfiguracaoPadrao(): ConfiguracaoGeral {
    return {
      festividade: '🎊 Evento Especial',
      valorAlmocoExtra: 45,
      valorJantaExtra: 55,
      valorLancheExtra: 25,
      valorKwh: 0.89,
      totalUhs: 50,
      comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
      altaInicio: '2025-12-15',
      altaFim: '2026-03-15',
      cafeInicio: '07:00',
      cafeFim: '10:00',
      cafeAtivo: true,
      almocoInicio: '12:00',
      almocoFim: '14:00',
      almocoAtivo: true,
      lancheTardeInicio: '15:00',
      lancheTardeFim: '17:00',
      lancheTardeAtivo: true,
      jantarInicio: '19:00',
      jantarFim: '21:00',
      jantarAtivo: true,
      promocaoAtiva: false,
      promocaoDesconto: 15,
      promocaoMinDiarias: 3,
      promocaoTexto: 'Pagamento integral via Pix ou Dinheiro',
      promocaoSomenteAlta: true,
      promocaoMsgBaixa: false,
      senhaHash: this.criptografia.hashSenha('1234'), // HASH da senha padrão
      senhaSalt: '',

      // ========== VALORES PADRÃO PARA TEXTOS DO ORÇAMENTO ==========
      orcTitulo: 'Orçamento de Hospedagem',
      orcConfigTitulo: '1. Configuração de Acomodação e Valores',
      orcConfigDescricao:
        'A proposta contempla a estadia com café da manhã incluso, além de estrutura de alimentação completa e horas extras de permanência.',
      orcNotaRefeicoes:
        'Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo por integrante da acomodação para o período total da estadia.',
      orcCronograma:
        'Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}',
      orcPagamento:
        'Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral}) no ato da reserva para garantia do bloqueio dos quartos.\nSaldo Restante: Deve ser quitado no momento do check-in ou conforme acordado previamente.\nValidade do Orçamento: Válido apenas para as datas especificadas.\nPrazo de Confirmação: A reserva deve ser confirmada e o sinal pago com no mínimo 10 dias de antecedência ao check-in.',
      orcObservacoes:
        'Refeições: O café da manhã é cortesia da casa e já está incluso no valor das diárias.\nAlimentação: Os almoços, lanches da tarde e jantares foram calculados para atender toda a delegação durante o período de permanência.\nValores das refeições: Almoço {valorAlmoco}, Janta {valorJanta}, Lanche {valorLanche} por pessoa.',
      orcRodape: 'Setor de Reservas - Hotel Plaza',
      orcSinalPercentual: 50,
    };
  }

  salvarConfiguracao(config: ConfiguracaoGeral): void {
    this.storage.set(this.STORAGE_CONFIG, config);
  }

  // ===== LIMPAR CACHE (RESET PARA PADRÃO) =====
  limparCache(): void {
    this.storage.remove(this.STORAGE_CATEGORIAS);
    this.storage.remove(this.STORAGE_PROMOCOES);
    this.storage.remove(this.STORAGE_CONFIG);
    this.inicializarDadosPadrao();
  }

  getComodidades(): any[] {
    return this.storage.get<any[]>('comodidades') || [];
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

  // ===== BACKUP =====
  exportarDados(): any {
    return {
      versao: '2.0',
      dataExportacao: new Date(),
      categorias: this.getCategorias(),
      promocoes: this.getPromocoes(),
      config: this.getConfiguracao(),
    };
  }

  importarDados(dados: any): { sucesso: boolean; mensagem: string } {
    try {
      if (!dados.versao || dados.versao !== '2.0') {
        return { sucesso: false, mensagem: 'Formato de backup incompatível.' };
      }
      if (dados.categorias) this.storage.set(this.STORAGE_CATEGORIAS, dados.categorias);
      if (dados.promocoes) this.storage.set(this.STORAGE_PROMOCOES, dados.promocoes);
      if (dados.config) this.storage.set(this.STORAGE_CONFIG, dados.config);
      return { sucesso: true, mensagem: 'Backup importado com sucesso!' };
    } catch (error) {
      console.error('Erro na importação:', error);
      return { sucesso: false, mensagem: 'Erro ao processar o arquivo.' };
    }
  }

  importarBackupAntigo(dados: any): { sucesso: boolean; mensagem: string } {
    try {
      if (!dados.cabecalho || !dados.t) {
        return { sucesso: false, mensagem: 'Arquivo não é um backup antigo válido.' };
      }

      const config = this.getConfiguracao();

      if (dados.f !== undefined) config.festividade = dados.f;
      if (dados.a !== undefined) config.valorAlmocoExtra = Number(dados.a);
      if (dados.j !== undefined) config.valorJantaExtra = Number(dados.j);
      if (dados.l !== undefined) config.valorLancheExtra = Number(dados.l);
      if (dados.k !== undefined) config.valorKwh = Number(dados.k);
      if (dados.u !== undefined) config.totalUhs = Number(dados.u);
      if (dados.ai) config.altaInicio = dados.ai;
      if (dados.af) config.altaFim = dados.af;

      if (dados.c && Array.isArray(dados.c)) {
        config.comodidadesGlobais = dados.c.map((item: string) => item.trim()).join(', ');
      }

      if (dados.h) {
        if (dados.h.cafe) {
          config.cafeInicio = dados.h.cafe[0] || '07:00';
          config.cafeFim = dados.h.cafe[1] || '10:00';
          config.cafeAtivo = dados.h.cafe[2] === true;
        }
        if (dados.h.almoco) {
          config.almocoInicio = dados.h.almoco[0] || '12:00';
          config.almocoFim = dados.h.almoco[1] || '14:00';
          config.almocoAtivo = dados.h.almoco[2] === true;
        }
        if (dados.h.lanche) {
          config.lancheTardeInicio = dados.h.lanche[0] || '15:00';
          config.lancheTardeFim = dados.h.lanche[1] || '17:00';
          config.lancheTardeAtivo = dados.h.lanche[2] === true;
        }
        if (dados.h.janta) {
          config.jantarInicio = dados.h.janta[0] || '19:00';
          config.jantarFim = dados.h.janta[1] || '21:00';
          config.jantarAtivo = dados.h.janta[2] === true;
        }
      }

      if (dados.p) {
        config.promocaoAtiva = dados.p.ativo === true;
        config.promocaoDesconto = Number(dados.p.pct) || 0;
        config.promocaoMinDiarias = Number(dados.p.min) || 0;
        config.promocaoTexto = dados.p.txt || '';
        config.promocaoSomenteAlta = dados.p.somenteAlta === true;
        config.promocaoMsgBaixa = dados.p.msgBaixa === true;
      }

      // ===== CAMPOS DE TEXTO =====
      if (dados.orc_titulo) config.orcTitulo = dados.orc_titulo;
      if (dados.orc_config_titulo) config.orcConfigTitulo = dados.orc_config_titulo;
      if (dados.orc_config_descricao) config.orcConfigDescricao = dados.orc_config_descricao;
      if (dados.orc_nota_refeicoes) config.orcNotaRefeicoes = dados.orc_nota_refeicoes;
      if (dados.orc_cronograma) config.orcCronograma = dados.orc_cronograma;
      if (dados.orc_pagamento) config.orcPagamento = dados.orc_pagamento;
      if (dados.orc_observacoes) config.orcObservacoes = dados.orc_observacoes;
      if (dados.orc_rodape) config.orcRodape = dados.orc_rodape;
      if (dados.orc_sinal_percentual)
        config.orcSinalPercentual = Number(dados.orc_sinal_percentual);

      this.salvarConfiguracao(config);

      const novasCategorias: CategoriaQuarto[] = [];
      dados.t.forEach((uh: any) => {
        let tipoOcupacao: '' | 'casal' | 'solteiro' = '';
        if (uh.grupo === 'solteiro') tipoOcupacao = 'solteiro';
        else if (uh.grupo === 'casal') tipoOcupacao = 'casal';

        const novaCategoria: CategoriaQuarto = {
          id: this.storage.generateId(),
          nome: uh.nome || 'Sem nome',
          capacidadeMaxima: uh.cap || 2,
          precoAltaCafe: uh.alta?.[0] || 0,
          precoAltaSemCafe: uh.alta?.[1] || 0,
          precoBaixaCafe: uh.baixa?.[0] || 0,
          precoBaixaSemCafe: uh.baixa?.[1] || 0,
          ativo: true,
          descricao: uh.desc || '',
          camasCasal: uh.casal || 0,
          camasSolteiro: uh.solteiro || 0,
          tipoOcupacaoPadrao: tipoOcupacao,
          numeros: uh.numeros_uhs || [],
          comodidadesSelecionadas: uh.comodidades || [],
        };
        novasCategorias.push(novaCategoria);
      });

      this.storage.set(this.STORAGE_CATEGORIAS, novasCategorias);
      return { sucesso: true, mensagem: 'Backup antigo importado com sucesso!' };
    } catch (error) {
      console.error('Erro ao importar backup antigo:', error);
      return { sucesso: false, mensagem: 'Erro ao processar o arquivo.' };
    }
  }
}
