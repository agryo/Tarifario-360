import { OrcamentoRapidoRequest } from './orcamento-rapido.model';
import { ConfiguracaoGeral } from './tarifa.model';

export interface DadosGeracaoTexto {
  request: OrcamentoRapidoRequest;
  numeroNoites: number;
  diasAlta: number;
  diasBaixa: number;
  tipoTemporada: string;
  somaComCafe: number;
  somaSemCafe: number;
  valorTotalComCafe: number;
  valorTotalSemCafe: number;
  valorFinalComCafe: number;
  valorFinalSemCafe: number;
  textoPromocao: string;
  config: ConfiguracaoGeral;
}
