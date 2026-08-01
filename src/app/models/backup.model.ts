import { EscalaConfig } from './escala-config.model';
import { CategoriaQuarto } from './categoria-quarto.model';
import { ConfiguracaoGeral } from './tarifa.model';
import { OrcamentoOficial } from './orcamento-oficial.model';
import { ChaveCriptografia } from './chave-criptografia.model';

export interface BackupData {
  tipo: 'backup';
  versao: string;
  dataExportacao: Date;
  configuracaoGeral: ConfiguracaoGeral;
  categorias: CategoriaQuarto[];
  escalaConfig?: EscalaConfig;
  orcamentosOficiais?: OrcamentoOficial[];
  chavesCriptografia?: ChaveCriptografia[];
  assinatura?: string;
}

export interface BackupMetadata {
  nome: string;
  dataCriacao: Date;
  tamanho: number;
  versao: string;
}
