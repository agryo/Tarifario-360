import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { Promocao, ConfiguracaoGeral } from '../models/tarifa.model';

@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';
  private readonly STORAGE_PROMOCOES = 'promocoes';
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

  setPromocoes(promocoes: Promocao[]): void {
    this.storage.set(this.STORAGE_PROMOCOES, promocoes);
  }

  // ===== CATEGORIAS =====
  getCategorias(): CategoriaQuarto[] {
    return this.storage.get<CategoriaQuarto[]>(this.STORAGE_CATEGORIAS) || [];
  }

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

  // ===== PROMOÇÕES =====
  getPromocoes(): Promocao[] {
    return this.storage.get<Promocao[]>(this.STORAGE_PROMOCOES) || [];
  }

  salvarPromocao(promocao: Promocao): void {
    const promocoes = this.getPromocoes();
    const index = promocoes.findIndex((p) => p.id === promocao.id);
    if (index >= 0) promocoes[index] = promocao;
    else {
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
      Object.keys(defaults).forEach((key) => {
        if (result[key as keyof ConfiguracaoGeral] === undefined) {
          (result as any)[key] = defaults[key as keyof ConfiguracaoGeral];
        }
      });
      return result;
    }
    return this.getConfiguracaoPadrao();
  }

  salvarConfiguracao(config: ConfiguracaoGeral): void {
    this.storage.set(this.STORAGE_CONFIG, config);
  }

  // ===== LIMPAR CACHE =====
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

  private getConfiguracaoPadrao(): ConfiguracaoGeral {
    // Gera um salt e hash para a senha padrão inicial.
    const salt = this.criptografia.gerarSalt();
    const hash = this.criptografia.hashSenha('1234', salt);
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
      senhaHash: hash,
      senhaSalt: salt,
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
}
