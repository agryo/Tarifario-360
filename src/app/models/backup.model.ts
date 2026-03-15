import { EscalaConfig } from '../services/escala';
import { CategoriaQuarto } from './categoria-quarto.model';
import { ConfiguracaoGeral } from './tarifa.model';

export interface BackupData {
  tipo: 'backup';
  versao: string;
  dataExportacao: Date;
  configuracaoGeral: ConfiguracaoGeral;
  categorias: CategoriaQuarto[];
  escalaConfig?: EscalaConfig;
  assinatura?: string;
}

export interface BackupMetadata {
  nome: string;
  dataCriacao: Date;
  tamanho: number;
  versao: string;
}
