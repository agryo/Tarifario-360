import { Injectable } from '@angular/core';
import { TarifaService } from './tarifa';
import { EscalaService } from './escala';
import { BackupData } from '../models/backup.model';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly VERSAO = '2.0.0';

  constructor(
    private tarifaService: TarifaService,
    private escalaService: EscalaService,
  ) {}

  // Exportar todos os dados
  exportarDados(): BackupData {
    const backup: BackupData = {
      versao: this.VERSAO,
      dataExportacao: new Date(),
      configuracaoGeral: this.tarifaService.getConfiguracao(),
      categorias: this.tarifaService.getCategorias(),
      escalaConfig: this.escalaService.getConfiguracao(),
    };

    return backup;
  }

  // Importar dados (substitui todos)
  importarDados(backup: BackupData): { sucesso: boolean; mensagem: string } {
    try {
      // Substitui configurações gerais
      if (backup.configuracaoGeral) {
        this.tarifaService.salvarConfiguracao(backup.configuracaoGeral);
      }

      // Substitui categorias completamente
      if (backup.categorias) {
        this.tarifaService.setCategorias(backup.categorias);
      }

      // Escala (substituição)
      if (backup.escalaConfig) {
        this.escalaService.importarDados(backup.escalaConfig);
      }

      return { sucesso: true, mensagem: 'Backup importado com sucesso!' };
    } catch (error) {
      console.error('Erro na importação:', error);
      return { sucesso: false, mensagem: 'Erro ao processar o arquivo.' };
    }
  }

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

  uploadBackup(arquivo: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData;
          resolve(backup);
        } catch {
          reject('Arquivo inválido');
        }
      };
      reader.onerror = () => reject('Erro ao ler arquivo');
      reader.readAsText(arquivo);
    });
  }
}
