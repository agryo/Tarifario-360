import { Injectable } from '@angular/core';
import { StorageService } from './storage';

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
  jantarInicio: string;
  jantarFim: string;
  jantarAtivo: boolean;

  // Promoção geral (simplificada)
  promocaoAtiva: boolean;
  promocaoDesconto: number;
  promocaoMinDiarias: number;
  promocaoTexto: string;
  promocaoSomenteAlta: boolean;
  promocaoMsgBaixa: boolean;

  // Segurança
  senhaMaster: string;
}

@Injectable({
  providedIn: 'root',
})
export class TarifaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';
  private readonly STORAGE_PROMOCOES = 'promocoes'; // se for usar múltiplas promoções
  private readonly STORAGE_CONFIG = 'config';

  constructor(private storage: StorageService) {
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

  // ===== PROMOÇÕES (se quiser múltiplas, mas por enquanto usamos a config geral) =====
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
    const defaultConfig: ConfiguracaoGeral = {
      festividade: '🎊 Evento Especial',
      valorAlmocoExtra: 45,
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
      jantarInicio: '19:00',
      jantarFim: '21:00',
      jantarAtivo: true,
      promocaoAtiva: false,
      promocaoDesconto: 15,
      promocaoMinDiarias: 3,
      promocaoTexto: 'Pagamento integral via Pix ou Dinheiro',
      promocaoSomenteAlta: true,
      promocaoMsgBaixa: false,
      senhaMaster: '1234',
    };
    return this.storage.get<ConfiguracaoGeral>(this.STORAGE_CONFIG) || defaultConfig;
  }

  // Mantido para compatibilidade, mas não usado no momento
  getComodidades(): any[] {
    return this.storage.get<any[]>('comodidades') || [];
  }

  salvarConfiguracao(config: ConfiguracaoGeral): void {
    this.storage.set(this.STORAGE_CONFIG, config);
  }

  // ===== DADOS INICIAIS =====
  private inicializarDadosPadrao(): void {
    // Inicializa categorias se vazio
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

    // ===== COMENTADO PARA EVITAR PROMOÇÕES PADRÃO =====
    // Se desejar manter promoções de exemplo, descomente o bloco abaixo.
    /*
    if (this.getPromocoes().length === 0) {
      const promocoesPadrao: Promocao[] = [
        {
          id: this.storage.generateId(),
          nome: 'Early Bird',
          desconto: 15,
          diasMinimos: 3,
          aplicaAlta: true,
          mensagemBaixa: 'Consulte condições',
        },
        {
          id: this.storage.generateId(),
          nome: 'Long Stay',
          desconto: 20,
          diasMinimos: 7,
          aplicaAlta: true,
          mensagemBaixa: 'Válido',
        },
      ];
      this.storage.set(this.STORAGE_PROMOCOES, promocoesPadrao);
    }
    */
  }

  // ===== BACKUP NOVO FORMATO =====
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

  // ===== IMPORTAÇÃO DO BACKUP ANTIGO (Sistema-HP) =====
  importarBackupAntigo(dados: any): { sucesso: boolean; mensagem: string } {
    try {
      // Validar se é um backup antigo (presença de 'cabecalho' e 't')
      if (!dados.cabecalho || !dados.t) {
        return { sucesso: false, mensagem: 'Arquivo não é um backup antigo válido.' };
      }

      // Extrair configurações gerais
      const config = this.getConfiguracao(); // pega configurações atuais (para preservar senha, etc.)

      // Mapear campos do backup antigo para a nova config
      if (dados.f !== undefined) config.festividade = dados.f;
      if (dados.a !== undefined) config.valorAlmocoExtra = Number(dados.a);
      if (dados.k !== undefined) config.valorKwh = Number(dados.k);
      if (dados.u !== undefined) config.totalUhs = Number(dados.u);
      if (dados.ai) config.altaInicio = dados.ai;
      if (dados.af) config.altaFim = dados.af;

      // Comodidades globais: array -> string separada por vírgula
      if (dados.c && Array.isArray(dados.c)) {
        config.comodidadesGlobais = dados.c.map((item: string) => item.trim()).join(', ');
      }

      // Horários das refeições
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
        if (dados.h.janta) {
          config.jantarInicio = dados.h.janta[0] || '19:00';
          config.jantarFim = dados.h.janta[1] || '21:00';
          config.jantarAtivo = dados.h.janta[2] === true;
        }
      }

      // Promoções
      if (dados.p) {
        config.promocaoAtiva = dados.p.ativo === true;
        config.promocaoDesconto = Number(dados.p.pct) || 0;
        config.promocaoMinDiarias = Number(dados.p.min) || 0;
        config.promocaoTexto = dados.p.txt || '';
        config.promocaoSomenteAlta = dados.p.somenteAlta === true;
        config.promocaoMsgBaixa = dados.p.msgBaixa === true;
      }

      // Salvar configurações
      this.salvarConfiguracao(config);

      // Importar categorias (UHs)
      const novasCategorias: CategoriaQuarto[] = [];

      dados.t.forEach((uh: any) => {
        // Determinar tipo de ocupação baseado no campo 'grupo' se existir
        let tipoOcupacao: '' | 'casal' | 'solteiro' = '';
        if (uh.grupo === 'solteiro') tipoOcupacao = 'solteiro';
        else if (uh.grupo === 'casal') tipoOcupacao = 'casal';

        const novaCategoria: CategoriaQuarto = {
          id: this.storage.generateId(), // novo id
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

      // Substituir todas as categorias antigas pelas novas
      this.storage.set(this.STORAGE_CATEGORIAS, novasCategorias);

      return { sucesso: true, mensagem: 'Backup antigo importado com sucesso!' };
    } catch (error) {
      console.error('Erro ao importar backup antigo:', error);
      return { sucesso: false, mensagem: 'Erro ao processar o arquivo.' };
    }
  }
}
