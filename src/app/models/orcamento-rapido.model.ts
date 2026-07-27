import { CategoriaQuarto } from './categoria-quarto.model';
import { ConfiguracaoGeral } from './tarifa.model';

export interface OrcamentoRapidoRequest {
  cliente: string;
  evento?: string;
  categoriaId: string;
  dataCheckin: Date;
  dataCheckout: Date;
  horaEntrada: string;
  horaSaida: string;
  quantidade: number;
  incluirCafe: boolean;
  observacoes?: string;
}

export interface ResultadoCategoriaOrcamento {
  categoriaId: string;
  categoriaNome: string;
  capacidadeMaxima: number;
  precoDiaria: number;
  precoComDesconto: number;
  desconto: number;
  valorTotal: number;
  camasCasal: number;
  camasSolteiro: number;
}

export interface OrcamentoRapidoResultado {
  resultados: ResultadoCategoriaOrcamento[];
  textoWhatsApp: string;
}

export interface DadosGeracaoTexto {
  cliente: string;
  evento?: string;
  dataCheckin: Date;
  dataCheckout: Date;
  horaEntrada: string;
  horaSaida: string;
  diarias: number;
  temporada: 'alta' | 'baixa' | 'misto';
  cafeManha: boolean;
  resultados: ResultadoCategoriaOrcamento[];
  promocao?: { nome: string; descontoPercentual: number; aplicada: boolean } | null;
  observacoes?: string;
  configuracao?: ConfiguracaoGeral;
}