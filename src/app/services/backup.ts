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
        this.escalaService.salvarConfiguracao(backup.escalaConfig);
      }

      return { sucesso: true, mensagem: 'Backup importado com sucesso!' };
    } catch (error) {
      console.error('Erro na importação:', error);
      return { sucesso: false, mensagem: 'Erro ao processar o arquivo.' };
    }
  }

  exportarArquivoCompleto(nomeArquivo: string = 'backup'): void {
    const backup = this.exportarDados();
    this.downloadBackup(backup, nomeArquivo);
  }

  downloadBackup(backup: BackupData, nomeArquivo: string = 'backup'): void {
    const encryptedData = this.criptografia.criptografarDados(backup);
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.btf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importarArquivo(arquivo: File): Promise<{ sucesso: boolean; mensagem: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawContent = e.target?.result as string;
          if (!rawContent) {
            return resolve({ sucesso: false, mensagem: 'O arquivo está vazio.' });
          }

          const backup = this.criptografia.descriptografarDados(rawContent);
          if (!backup) {
            return resolve({
              sucesso: false,
              mensagem: 'Formato de arquivo inválido ou corrompido.',
            });
          }

          resolve(this.importarDados(backup));
        } catch (error) {
          resolve({ sucesso: false, mensagem: 'Erro inesperado ao processar o backup.' });
        }
      };
      reader.onerror = () =>
        resolve({ sucesso: false, mensagem: 'Erro na leitura física do arquivo.' });
      reader.readAsText(arquivo);
    });
  }
}
