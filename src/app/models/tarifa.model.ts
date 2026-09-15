export interface ConfigHorario {
  inicio: string;
  fim: string;
  ativo: boolean;
}

export interface ConfigPromocao {
  ativa: boolean;
  desconto: number;
  minDiarias: number;
  texto: string;
  somenteAlta: boolean;
  msgBaixa: boolean;
}

export interface ConfigSeguranca {
  senhaHash: string;
  senhaSalt?: string;
}

export interface Comodidade {
  id: string;
  nome: string;
}

export interface ConfigTextosOrcamento {
  titulo: string;
  configTitulo: string;
  configDescricao: string;
  notaRefeicoes: string;
  cronograma: string;
  pagamento: string;
  observacoes: string;
  rodape: string;
}

export interface ConfiguracaoGeral {
  // Configurações gerais de nível superior
  festividade: string;
  totalUhs: number;
  // Suporta dois formatos: Comodidade[] (novo) ou string CSV (legado).
  // O ComodidadeService normaliza ambos para Comodidade[] na leitura.
  comodidadesGlobais: Comodidade[] | string;

  // Seções aninhadas para melhor organização
  precos: {
    refeicoes: {
      almoco: number;
      janta: number;
      lanche: number;
    };
    kwh: number;
  };
  temporada: {
    altaInicio: string;
    altaFim: string;
  };
  horarios: {
    cafe: ConfigHorario;
    almoco: ConfigHorario;
    lanche: ConfigHorario;
    jantar: ConfigHorario;
  };
  promocao: ConfigPromocao;
  seguranca: ConfigSeguranca;
  orcamento: {
    textos: ConfigTextosOrcamento;
    sinalPercentual: number;
  };
  criado_em?: string;
  atualizado_em?: string;
}
