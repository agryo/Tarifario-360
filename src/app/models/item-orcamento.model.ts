export interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  categoria?: 'diaria' | 'alimentacao' | 'taxa' | 'outros';
  observacao?: string;
}

export interface ItemDiaria extends ItemOrcamento {
  categoriaId: string;
  dataCheckin: Date;
  dataCheckout: Date;
  numeroNoites: number;
  adultos: number;
  criancas: number;
  tipoPensao?: 'sem' | 'cafe' | 'meia' | 'completa';
}
