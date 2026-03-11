export interface BackupData {
  versao: string;
  dataExportacao: Date;
  configuracaoGeral: any;
  categorias: any[];
  escalaConfig?: any;
}

export interface BackupMetadata {
  nome: string;
  dataCriacao: Date;
  tamanho: number;
  versao: string;
}
