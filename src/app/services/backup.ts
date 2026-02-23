import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { TarifaService } from './tarifa';
import { BackupData } from '../models/backup.model';
import { OrcamentoOficialService } from './orcamento-oficial';
import { OrcamentoRapidoService } from './orcamento-rapido';
import { EscalaService } from './escala';

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly VERSAO = '2.0.0';

  constructor(
    private storage: StorageService,
    private tarifaService: TarifaService,
    private orcamentoOficialService: OrcamentoOficialService,
    private orcamentoRapidoService: OrcamentoRapidoService,
    private escalaService: EscalaService,
  ) {}

  // Exportar todos os dados
  exportarDados(): BackupData {
    const backup: BackupData = {
      versao: this.VERSAO,
      dataExportacao: new Date(),
      configuracaoGeral: this.tarifaService.getConfiguracao(),
      categorias: this.tarifaService.getCategorias(),
      promocoes: this.tarifaService.getPromocoes(),
      orcamentosOficiais: this.orcamentoOficialService.listarOrcamentos(),
      orcamentosRapidos: this.orcamentoRapidoService.getHistorico(),
      escalaConfig: this.escalaService.getConfiguracao(),
      // Campos legados mantidos vazios para compatibilidade de interface se necessário
      comodidades: this.tarifaService.getComodidades(),
      temporadas: [],
      tarifas: [],
    };

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

      // 1. Restaurar Configurações e Tarifas
      if (backup.configuracaoGeral) {
        this.tarifaService.salvarConfiguracao(backup.configuracaoGeral);
      }
      // Suporte a backups que usam a chave 'config' (formato interno do TarifaService)
      if ((backup as any).config) {
        this.tarifaService.salvarConfiguracao((backup as any).config);
      }

      if (backup.categorias) {
        // Limpa e re-salva para garantir integridade ou substituição total
        // Aqui optamos por iterar para usar a lógica de salvamento do serviço,
        // mas poderíamos ter um método setCategorias no serviço para ser mais rápido.
        backup.categorias.forEach((cat) => this.tarifaService.salvarCategoria(cat));
      }

      if (backup.promocoes) {
        backup.promocoes.forEach((p) => this.tarifaService.salvarPromocao(p));
      }

      // 2. Restaurar Outros Módulos
      if (backup.orcamentosOficiais)
        this.orcamentoOficialService.importarDados(backup.orcamentosOficiais);
      if (backup.orcamentosRapidos)
        this.orcamentoRapidoService.importarDados(backup.orcamentosRapidos);
      if (backup.escalaConfig) this.escalaService.importarDados(backup.escalaConfig);

      return true;
    } catch (error) {
      console.error('Erro na importação:', error);
      return false;
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
        } catch (error) {
          reject('Arquivo inválido');
        }
      };

      reader.onerror = () => reject('Erro ao ler arquivo');
      reader.readAsText(arquivo);
    });
  }

  private gerarAssinatura(dados: any): string {
    // Cria uma cópia para não modificar o objeto original durante a geração
    const copia = { ...dados };
    delete copia.assinatura; // Remove a assinatura se existir para o cálculo

    // Usa btoa simples para verificação básica de integridade (não é segurança criptográfica forte)
    return btoa(JSON.stringify(copia) + this.VERSAO);
  }

  private validarAssinatura(backup: BackupData): boolean {
    const assinatura = backup.assinatura;
    backup.assinatura = undefined;
    const assinaturaCalculada = this.gerarAssinatura(backup);
    backup.assinatura = assinatura;

    return assinatura === assinaturaCalculada;
  }
}
