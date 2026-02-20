import { CategoriaQuarto } from './categoria-quarto.model';
import { Temporada } from './temporada.model';

export interface Tarifa {
  id: string;
  categoriaId: string;
  temporadaId?: string; // Se null, usa os preços padrão da categoria
  valorDiaria: number;
  dataInicio?: Date;
  dataFim?: Date;
  ativo: boolean;
}

export interface TarifaCompleta extends Tarifa {
  categoria?: CategoriaQuarto;
  temporada?: Temporada;
}

export interface ConfiguracaoGeral {
  horarioCafe?: string;
  horarioAlmoco?: string;
  horarioJantar?: string;
  senhaMaster?: string;
  impostos?: {
    nome: string;
    percentual: number;
  }[];
  moeda: 'BRL' | 'USD' | 'EUR';
}
