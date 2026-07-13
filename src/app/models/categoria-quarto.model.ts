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
  tipoOcupacaoPadrao?: string;
  numeros?: string[];
  comodidadesSelecionadas?: string[];
  criado_em?: string;
  atualizado_em?: string;
}