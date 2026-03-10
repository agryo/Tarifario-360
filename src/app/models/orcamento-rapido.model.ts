export interface OrcamentoRapido {
  id?: string;
  dataGeracao: Date;
  categoriaId: string;
  dataCheckin: Date;
  dataCheckout: Date;
  numeroNoites: number;
  quantidade: number;
  valorDiaria: number;
  tipoTemporada: 'alta' | 'baixa' | 'misto';
  valorTotal: number;
}

export interface OrcamentoRapidoRequest {
  categoriaId: string;
  dataCheckin: Date;
  dataCheckout: Date;
  quantidade: number;
  incluirCafe?: boolean;
  incluirAlmoco?: boolean;
  incluirJantar?: boolean;
}

export interface OrcamentoRapidoResultado {
  orcamento: OrcamentoRapido;
  textoWhatsApp: string;
}
