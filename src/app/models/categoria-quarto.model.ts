import { Comodidade } from './comodidade.model';

export interface CategoriaQuarto {
  id: string;
  nome: string;
  descricao?: string;
  capacidadeMaxima: number;
  camaCasal: number;
  camaSolteiro: number;
  comodidades: string[]; // IDs das comodidades
  precoAltaTemporada: number;
  precoBaixaTemporada: number;
  ativo: boolean;
  ordem?: number;
  icone?: string;
}

export interface CategoriaComPreco extends CategoriaQuarto {
  precoFinal: number;
  tipoTemporada?: 'alta' | 'baixa' | 'misto';
}
