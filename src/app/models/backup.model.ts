export interface BackupData {
  tipo: 'backup';
  versao: string;
  dataExportacao: Date;
  configuracaoGeral: any;
  categorias: any[];
  escalaConfig?: any;
  assinatura?: string;
}

export interface BackupMetadata {
  nome: string;
  dataCriacao: Date;
  tamanho: number;
  versao: string;
}
