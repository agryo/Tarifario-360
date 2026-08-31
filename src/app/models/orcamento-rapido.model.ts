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