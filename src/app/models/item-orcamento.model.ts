export interface ItemOrcamento {
  id?: string;
  quantidade: number;
  categoriaId: string;
  categoriaNome?: string;
  camasDescricao?: string;
  descricao?: string; // nome dos hóspedes / cargo
  comCafe: boolean;
  comAlmoco: boolean;
  comJanta: boolean;
  comLanche: boolean;
  precoDiaria: number; // preço médio por diária (acomodação + refeições inclusas)
  total: number;
  // campos auxiliares para exibição (não persistidos)
  _subtotalSemExtra?: number;
  _extraCharge?: number;
  // contagens de refeições para exibição
  qtdAlmoco?: number;
  qtdJanta?: number;
  qtdLanche?: number;
}

export interface ItemDiaria extends ItemOrcamento {
  dataCheckin: Date;
  dataCheckout: Date;
  numeroNoites: number;
  adultos: number;
  criancas: number;
  tipoPensao?: 'sem' | 'cafe' | 'meia' | 'completa';
}
