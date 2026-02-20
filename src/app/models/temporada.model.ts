export type TemporadaTipo = 'alta' | 'baixa';

export interface Temporada {
  id?: string;
  nome: string;
  tipo: TemporadaTipo;
  dataInicio: Date;
  dataFim: Date;
  ativo: boolean;
  observacao?: string;
}

export interface PeriodoMisto {
  diasAlta: number;
  diasBaixa: number;
  valorTotal: number;
}
