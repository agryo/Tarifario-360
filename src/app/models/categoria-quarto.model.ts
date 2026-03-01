export interface CategoriaQuarto {
  id: string;
  nome: string;
  capacidadeMaxima: number;
  precoAltaCafe: number;
  precoAltaSemCafe: number;
  precoBaixaCafe: number;
  precoBaixaSemCafe: number;
  ativo: boolean;
  descricao?: string;
  camasCasal?: number;
  camasSolteiro?: number;
  tipoOcupacaoPadrao?: '' | 'casal' | 'solteiro';
  numeros?: string[];
  comodidadesSelecionadas?: string[];
}

export interface CategoriaComPreco extends CategoriaQuarto {
  precoFinal: number;
  tipoTemporada?: 'alta' | 'baixa' | 'misto';
}
