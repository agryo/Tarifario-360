import { Injectable } from '@angular/core';
import { TarifaService } from './tarifa';
import { EscalaService } from './escala';
import { CriptografiaService } from './criptografia';
import { supabaseApi } from './supabase-client';
import { BackupData } from '../models/backup.model';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly VERSAO = '2.0.0';

  constructor(
    private tarifaService: TarifaService,
    private escalaService: EscalaService,
    private criptografia: CriptografiaService,
  ) {}

  // Exportar todos os dados (local - uses services)
  async exportarDados(): Promise<BackupData> {
    const dados: Omit<BackupData, 'assinatura'> = {
      tipo: 'backup',
      versao: this.VERSAO,
      dataExportacao: new Date(),
      configuracaoGeral: await this.tarifaService.getConfiguracao(),
      categorias: await this.tarifaService.getCategorias(),
      escalaConfig: await this.escalaService.getConfiguracao(),
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

  async exportarArquivoCompleto(nomeArquivo: string = 'backup'): Promise<void> {
    const backup = await this.exportarDados();
    await this.downloadBackup(backup, nomeArquivo);
  }

  /**
   * Formata data local para YYYY-MM-DD (sem problema de fuso horário)
   */
  private formatarDataLocal(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async downloadBackup(backup: BackupData, nomeArquivo: string = 'backup'): Promise<void> {
    // Usa segredo de backup (portável) para permitir importação em outras máquinas
    const encryptedData = await this.criptografia.criptografarDados(backup, true);
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Usa data LOCAL (não UTC) para evitar data do dia seguinte à noite
    link.download = `${nomeArquivo}_${this.formatarDataLocal()}.btf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importarArquivo(arquivo: File): Promise<{ sucesso: boolean; mensagem: string }> {
    const rawContent = await arquivo.text();
    if (!rawContent) {
      return { sucesso: false, mensagem: 'O arquivo está vazio.' };
    }

    // Usa segredo de backup (portável) para descriptografar backups de outras máquinas
    const backup = (await this.criptografia.descriptografarDados(rawContent, true)) as BackupData | null;
    if (!backup) {
      return { sucesso: false, mensagem: 'Formato de arquivo inválido ou corrompido.' };
    }

    return this.importarDados(backup);
  }

  // ========== NOVOS MÉTODOS COM SENHA DO USUÁRIO (MAIS SEGURO) ==========

  async downloadBackupComSenha(backup: BackupData, senha: string, nomeArquivo: string = 'backup'): Promise<void> {
    const encryptedData = await this.criptografia.criptografarBackupComSenha(backup, senha);
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeArquivo}_${this.formatarDataLocal()}.btf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importarArquivoComSenha(arquivo: File, senha: string): Promise<{ sucesso: boolean; mensagem: string }> {
    const rawContent = await arquivo.text();
    if (!rawContent) {
      return { sucesso: false, mensagem: 'O arquivo está vazio.' };
    }

    const backup = (await this.criptografia.descriptografarBackupComSenha(rawContent, senha)) as BackupData | null;
    if (!backup) {
      return { sucesso: false, mensagem: 'Senha incorreta ou arquivo corrompido.' };
    }

    return this.importarDados(backup);
  }

  // ========== MÉTODOS SUPABASE (NOVO) ==========

  /**
   * Exporta backup completo do Supabase (inclui orçamentos, chaves, etc.)
   */
  async exportarSupabase(): Promise<BackupData> {
    const backup = await supabaseApi.exportBackup();
    return backup;
  }

  /**
   * Importa backup completo no Supabase
   */
  async importarSupabase(backup: BackupData): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      if (backup.tipo !== 'backup') {
        return { sucesso: false, mensagem: 'Arquivo inválido. Tipo de backup incorreto.' };
      }

      await supabaseApi.importBackup(backup);
      return { sucesso: true, mensagem: 'Backup importado no Supabase com sucesso!' };
    } catch (error: any) {
      console.error('Erro na importação Supabase:', error);
      return { sucesso: false, mensagem: error.message || 'Erro ao importar no Supabase' };
    }
  }

  /**
   * Download de backup do Supabase (versão completa)
   */
  async downloadBackupSupabase(nomeArquivo: string = 'backup_supabase'): Promise<void> {
    const backup = await this.exportarSupabase();
    const encryptedData = await this.criptografia.criptografarDados(backup, true);
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeArquivo}_${this.formatarDataLocal()}.btf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Importa arquivo .btf para o Supabase
   */
  async importarArquivoSupabase(arquivo: File): Promise<{ sucesso: boolean; mensagem: string }> {
    const rawContent = await arquivo.text();
    if (!rawContent) {
      return { sucesso: false, mensagem: 'O arquivo está vazio.' };
    }

    const backup = (await this.criptografia.descriptografarDados(rawContent, true)) as BackupData | null;
    if (!backup) {
      return { sucesso: false, mensagem: 'Formato de arquivo inválido ou corrompido.' };
    }

    return this.importarSupabase(backup);
  }
}