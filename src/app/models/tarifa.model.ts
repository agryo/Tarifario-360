export interface Promocao {
  id: string;
  nome: string;
  desconto: number;
  diasMinimos: number;
  aplicaAlta: boolean;
  mensagemBaixa: string;
}

export interface ConfiguracaoGeral {
  festividade: string;
  valorAlmocoExtra: number;
  valorJantaExtra: number;
  valorLancheExtra: number;
  valorKwh: number;
  totalUhs: number;
  comodidadesGlobais: string;
  altaInicio: string;
  altaFim: string;
  cafeInicio: string;
  cafeFim: string;
  cafeAtivo: boolean;
  almocoInicio: string;
  almocoFim: string;
  almocoAtivo: boolean;
  lancheTardeInicio: string;
  lancheTardeFim: string;
  lancheTardeAtivo: boolean;
  jantarInicio: string;
  jantarFim: string;
  jantarAtivo: boolean;
  promocaoAtiva: boolean;
  promocaoDesconto: number;
  promocaoMinDiarias: number;
  promocaoTexto: string;
  promocaoSomenteAlta: boolean;
  promocaoMsgBaixa: boolean;
  senhaHash: string;
  senhaSalt?: string;
  orcTitulo: string;
  orcConfigTitulo: string;
  orcConfigDescricao: string;
  orcNotaRefeicoes: string;
  orcCronograma: string;
  orcPagamento: string;
  orcObservacoes: string;
  orcRodape: string;
  orcSinalPercentual: number;
}
