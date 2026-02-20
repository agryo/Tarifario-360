import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { TarifaService } from './tarifa';
import { BackupData } from '../models/backup.model';

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly VERSAO = '1.0.0';

  constructor(
    private storage: StorageService,
    private tarifaService: TarifaService,
  ) {}

  // Exportar todos os dados
  exportarDados(): BackupData {
    const backup: BackupData = {
      versao: this.VERSAO,
      dataExportacao: new Date(),
      configuracaoGeral: this.tarifaService.getConfiguracao(),
      categorias: this.tarifaService.getCategorias(),
      comodidades: this.tarifaService.getComodidades(),
      temporadas: this.tarifaService.getTemporadas(),
      tarifas: [], // Se tiver tarifas específicas
    };

    // Gerar assinatura simples (pode melhorar depois)
    backup.assinatura = this.gerarAssinatura(backup);

    return backup;
  }

  // Importar dados
  importarDados(backup: BackupData): boolean {
    try {
      // Validar assinatura
      if (!this.validarAssinatura(backup)) {
        console.error('Backup inválido ou corrompido');
        return false;
      }

      // Restaurar dados
      if (backup.configuracaoGeral) {
        this.tarifaService.salvarConfiguracao(backup.configuracaoGeral);
      }

      if (backup.categorias) {
        backup.categorias.forEach((cat) => this.tarifaService.salvarCategoria(cat));
      }

      if (backup.comodidades) {
        backup.comodidades.forEach((com) => this.tarifaService.salvarComodidade(com));
      }

      if (backup.temporadas) {
        backup.temporadas.forEach((temp) => this.tarifaService.salvarTemporada(temp));
      }

      return true;
    } catch (error) {
      console.error('Erro na importação:', error);
      return false;
    }
  }

  // Download do arquivo JSON
  downloadBackup(backup: BackupData, nomeArquivo: string = 'backup'): void {
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  // Upload do arquivo JSON
  uploadBackup(arquivo: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData;
          resolve(backup);
        } catch (error) {
          reject('Arquivo inválido');
        }
      };

      reader.onerror = () => reject('Erro ao ler arquivo');
      reader.readAsText(arquivo);
    });
  }

  private gerarAssinatura(dados: any): string {
    // Simplificado - em produção use algo mais robusto
    return btoa(JSON.stringify(dados) + this.VERSAO);
  }

  private validarAssinatura(backup: BackupData): boolean {
    const assinatura = backup.assinatura;
    backup.assinatura = undefined;
    const assinaturaCalculada = this.gerarAssinatura(backup);
    backup.assinatura = assinatura;

    return assinatura === assinaturaCalculada;
  }
}
