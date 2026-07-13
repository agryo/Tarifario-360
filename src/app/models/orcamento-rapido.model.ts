export interface OrcamentoRapido {
  id: string;
  tipo: 'orcamento_rapido';
  dataGeracao: string;
  categoriaId: string;
  dataCheckin: string;
  dataCheckout: string;
  numeroNoites: number;
  quantidade: number;
  valorDiaria: number;
  tipoTemporada: 'alta' | 'baixa' | 'misto';
  valorTotal: number;
  criado_em: string;
  atualizado_em: string;
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
