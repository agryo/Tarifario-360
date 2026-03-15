import { Injectable } from '@angular/core';
import { TarifaService } from './tarifa';
import { EscalaService } from './escala';
import { CriptografiaService } from './criptografia';
import { BackupData } from '../models/backup.model';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly VERSAO = '2.0.0';

  constructor(
    private tarifaService: TarifaService,
    private escalaService: EscalaService,
    private criptografia: CriptografiaService,
  ) {}

  // Exportar todos os dados
  exportarDados(): BackupData {
    const dados: Omit<BackupData, 'assinatura'> = {
      tipo: 'backup',
      versao: this.VERSAO,
      dataExportacao: new Date(),
      configuracaoGeral: this.tarifaService.getConfiguracao(),
      categorias: this.tarifaService.getCategorias(),
      escalaConfig: this.escalaService.getConfiguracao(),
    };

    const backup: BackupData = {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };

    return backup;
  }

  // Importar dados (substitui todos)
  importarDados(backup: BackupData): { sucesso: boolean; mensagem: string } {
    try {
      // 0. Verifica o tipo do arquivo
      if (backup.tipo !== 'backup') {
        return {
          sucesso: false,
          mensagem: 'Arquivo inválido. Este não é um arquivo de backup do sistema.',
        };
      }

      // 1. Verifica a assinatura de integridade
      const { assinatura, ...dadosParaVerificar } = backup;

      if (!assinatura) {
        return {
          sucesso: false,
          mensagem:
            'Arquivo de backup inválido ou de uma versão antiga (sem assinatura de segurança).',
        };
      }

      const hashCalculado = this.criptografia.gerarHash(JSON.stringify(dadosParaVerificar));

      if (hashCalculado !== assinatura) {
        return {
          sucesso: false,
          mensagem: 'Assinatura do backup inválida. O arquivo pode estar corrompido ou modificado.',
        };
      }

      // Substitui configurações gerais
      if (backup.configuracaoGeral) {
        const configMigrada = this.tarifaService.migrarConfiguracaoSeNecessario(
          backup.configuracaoGeral,
        );
        this.tarifaService.salvarConfiguracao(configMigrada);
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
