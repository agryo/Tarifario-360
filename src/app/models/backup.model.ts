export interface BackupData {
  versao: string;
  dataExportacao: Date;
  configuracaoGeral: any;
  categorias: any[];
  comodidades: any[];
  temporadas: any[];
  tarifas: any[];
  assinatura?: string;
}

export interface BackupMetadata {
  nome: string;
  dataCriacao: Date;
  tamanho: number;
  versao: string;
}
