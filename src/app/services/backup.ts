import { Injectable } from '@angular/core';
import { TarifaService } from './tarifa';
import { EscalaService } from './escala';
import { CriptografiaService } from './criptografia';
import { supabaseApi } from './supabase-client';
import { getSupabaseClient, environment } from './supabase-client';
import { BackupData } from '../models/backup.model';
import { OrcamentoOficial } from '../models/orcamento-oficial.model';
import { ChaveCriptografia } from '../models/chave-criptografia.model';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly VERSAO = '2.0.0';

  constructor(
    private tarifaService: TarifaService,
    private escalaService: EscalaService,
    private criptografia: CriptografiaService,
  ) {}

  // Verifica se está em desenvolvimento local
  private isLocalDev(): boolean {
    return !environment.production;
  }

  // Exportar todos os dados do Supabase (completo)
  async exportarDados(): Promise<BackupData> {
    if (this.isLocalDev()) {
      // Desenvolvimento local: usa cliente direto do Supabase
      return this.exportarDadosLocal();
    }
    // Produção: usa API Vercel
    return this.exportarDadosAPI();
  }

  private async exportarDadosLocal(): Promise<BackupData> {
    const client = getSupabaseClient();

    const [categorias, configGeral, escalaConfig, orcamentosOficiais, chaves] = await Promise.all([
      client.from('categorias').select('*'),
      client.from('config_geral').select('*').limit(1).single(),
      client.from('escala_config').select('configuracao').limit(1).single(),
      client.from('orcamentos_oficiais').select('*'),
      client.from('chaves_criptografia').select('*'),
    ]);

    const dados: Omit<BackupData, 'assinatura'> = {
      tipo: 'backup',
      versao: this.VERSAO,
      dataExportacao: new Date(),
      configuracaoGeral: configGeral.data ?? null,
      categorias: categorias.data ?? [],
      escalaConfig: escalaConfig.data?.configuracao ?? null,
      orcamentosOficiais: orcamentosOficiais.data ?? [],
      chavesCriptografia: chaves.data ?? [],
    };

    return {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };
  }

  private async exportarDadosAPI(): Promise<BackupData> {
    const response = await supabaseApi.exportBackup();

    const dados: Omit<BackupData, 'assinatura'> = {
      tipo: 'backup',
      versao: this.VERSAO,
      dataExportacao: new Date(response.data_exportacao || new Date()),
      configuracaoGeral: response.config_geral,
      categorias: response.categorias ?? [],
      escalaConfig: response.escala_config ?? undefined,
      orcamentosOficiais: response.orcamentos_oficiais ?? [],
      chavesCriptografia: response.chaves_criptografia ?? [],
    };

    return {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };
  }

  // Importar dados (substitui tudo no Supabase)
  async importarDados(backup: BackupData): Promise<{ sucesso: boolean; mensagem: string }> {
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

      // 2. Importa tudo (desenvolvimento local ou produção)
      if (this.isLocalDev()) {
        await this.importarDadosLocal(backup);
      } else {
        await this.importarDadosAPI(backup);
      }

      // 3. Atualiza cache local (recarrega serviços)
      await this.tarifaService.recarregarDoSupabase();
      await this.escalaService.recarregarDoSupabase();

      return { sucesso: true, mensagem: 'Backup importado com sucesso! Todas as tabelas foram restauradas.' };
    } catch (error) {
      console.error('Erro na importação:', error);
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      return { sucesso: false, mensagem: `Erro ao processar o arquivo: ${errorMsg}` };
    }
  }

  private async importarDadosLocal(backup: BackupData): Promise<void> {
    const client = getSupabaseClient();

    // PRIMEIRO: Limpar todas as tabelas (ordem inversa de dependência)
    const tablesToClear = [
      'orcamentos_oficiais',
      'chaves_criptografia',
      'escala_config',
      'config_geral',
      'categorias',
    ];
    for (const table of tablesToClear) {
      const { error } = await client.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn(`Aviso ao limpar ${table}:`, error);
    }

    // Import in order: categorias first (referenced by orcamentos_oficiais)
    if (backup.categorias?.length) {
      const { error } = await client.from('categorias').upsert(backup.categorias, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.configuracaoGeral) {
      const { error } = await client.from('config_geral').upsert(backup.configuracaoGeral, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.escalaConfig) {
      // escala_config has UUID primary key - delete existing row first, then insert new
      const { error: deleteError } = await client.from('escala_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) console.warn('Warning clearing escala_config:', deleteError);

      const { error } = await client.from('escala_config').insert({ configuracao: backup.escalaConfig });
      if (error) throw error;
    }

    if (backup.orcamentosOficiais?.length) {
      const { error } = await client.from('orcamentos_oficiais').upsert(backup.orcamentosOficiais, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.chavesCriptografia?.length) {
      const { error } = await client.from('chaves_criptografia').upsert(backup.chavesCriptografia, { onConflict: 'nome' });
      if (error) throw error;
    }
  }

  private async importarDadosAPI(backup: BackupData): Promise<void> {
    const backupParaApi = {
      versao: backup.versao,
      data_exportacao: backup.dataExportacao,
      categorias: backup.categorias,
      config_geral: backup.configuracaoGeral,
      escala_config: backup.escalaConfig,
      orcamentos_oficiais: backup.orcamentosOficiais,
      chaves_criptografia: backup.chavesCriptografia,
    };

    await supabaseApi.importBackup(backupParaApi);
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