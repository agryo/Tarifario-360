import { Injectable } from '@angular/core';
import { TarifaService } from './tarifa';
import { EscalaService, EscalaConfig } from './escala';
import { OrcamentoOficialService } from './orcamento-oficial';
import { OrcamentoRapidoService } from './orcamento-rapido';
import { BackupData } from '../models/backup.model';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly VERSAO = '2.0.0';

  constructor(
    private tarifaService: TarifaService,
    private escalaService: EscalaService,
    private orcamentoOficialService: OrcamentoOficialService,
    private orcamentoRapidoService: OrcamentoRapidoService,
  ) {}

  // Exportar todos os dados
  exportarDados(): BackupData {
    return {
      versao: this.VERSAO,
      dataExportacao: new Date(),
      configuracaoGeral: this.tarifaService.getConfiguracao(),
      categorias: this.tarifaService.getCategorias(),
      promocoes: this.tarifaService.getPromocoes(),
      orcamentosOficiais: this.orcamentoOficialService.listarOrcamentos(),
      orcamentosRapidos: this.orcamentoRapidoService.getHistorico(),
      escalaConfig: this.escalaService.getConfiguracao(),
      comodidades: this.tarifaService.getComodidades(),
      temporadas: [],
      tarifas: [],
      assinatura: this.gerarAssinatura({}),
    };
  }

  // Importar dados (substitui todos)
  importarDados(backup: BackupData): { sucesso: boolean; mensagem: string } {
    try {
      if (!this.validarAssinatura(backup)) {
        return { sucesso: false, mensagem: 'Backup inválido ou corrompido.' };
      }
      if (backup.configuracaoGeral) {
        this.tarifaService.salvarConfiguracao(backup.configuracaoGeral);
      }
      if (backup.categorias) {
        backup.categorias.forEach((cat) => this.tarifaService.salvarCategoria(cat));
      }
      if (backup.promocoes) {
        backup.promocoes.forEach((p) => this.tarifaService.salvarPromocao(p));
      }
      if (backup.orcamentosOficiais) {
        this.orcamentoOficialService.importarDados(backup.orcamentosOficiais);
      }
      if (backup.orcamentosRapidos) {
        this.orcamentoRapidoService.importarDados(backup.orcamentosRapidos);
      }
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

  private gerarAssinatura(dados: any): string {
    return btoa(JSON.stringify(dados) + this.VERSAO);
  }

  private validarAssinatura(backup: BackupData): boolean {
    const assinatura = backup.assinatura;
    backup.assinatura = undefined;
    const calculada = this.gerarAssinatura(backup);
    backup.assinatura = assinatura;
    return assinatura === calculada;
  }
}
