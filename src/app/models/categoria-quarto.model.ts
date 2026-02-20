export interface CategoriaQuarto {
  id: string;
  nome: string;
  descricao?: string; // Descrição / diferencial
  capacidadeMaxima: number;
  camasCasal: number; // Quantidade de camas de casal
  camasSolteiro: number; // Quantidade de camas de solteiro
  tipoOcupacaoPadrao?: '' | 'casal' | 'solteiro'; // '' = automático
  numeros?: string[]; // Números das unidades (ex: ['01','02'])
  comodidadesSelecionadas?: string[]; // IDs das comodidades específicas desta UH
  precoAltaCafe: number; // Preço alta temporada com café
  precoAltaSemCafe: number; // Preço alta temporada sem café
  precoBaixaCafe: number; // Preço baixa temporada com café
  precoBaixaSemCafe: number; // Preço baixa temporada sem café
  ativo: boolean;
  icone?: string; // Ícone opcional (para exibição)
}

// Interface para uso em componentes que calculam preço final
export interface CategoriaComPreco extends CategoriaQuarto {
  precoFinal: number;
  tipoTemporada?: 'alta' | 'baixa' | 'misto';
}
