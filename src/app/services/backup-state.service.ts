import { Injectable } from '@angular/core';
import { ConfiguracaoGeral } from '../models/tarifa.model';
import { CategoriaQuarto } from '../models/categoria-quarto.model';

/**
 * Serviço para gerenciar estado temporário de backup carregado na UI
 * (não persistido no banco - apenas para preencher o Painel Master durante importação)
 */
@Injectable({ providedIn: 'root' })
export class BackupStateService {
  private backupState: {
    configuracaoGeral?: ConfiguracaoGeral;
    categorias?: CategoriaQuarto[];
    escalaConfig?: any;
    orcamentosOficiais?: any[];
  } | null = null;

  /**
   * Define o estado do backup carregado na UI (sem persistir no banco)
   * Usado quando o usuário importa um backup para preencher o Painel Master
   */
  setBackupState(backup: {
    configuracaoGeral?: ConfiguracaoGeral;
    categorias?: CategoriaQuarto[];
    escalaConfig?: any;
    orcamentosOficiais?: any[];
  }): void {
    this.backupState = backup;
  }

  /**
   * Limpa o estado do backup carregado na UI
   */
  clearBackupState(): void {
    this.backupState = null;
  }

  /**
   * Retorna o estado do backup carregado (para uso no Painel Master)
   */
  getBackupState() {
    return this.backupState;
  }

  /**
   * Verifica se há backup carregado
   */
  hasBackupState(): boolean {
    return this.backupState !== null;
  }

  /**
   * Retorna categorias do backup se disponível, senão null
   */
  getBackupCategorias(): CategoriaQuarto[] | null {
    return this.backupState?.categorias ?? null;
  }

  /**
   * Retorna configuração do backup se disponível, senão null
   */
  getBackupConfig(): ConfiguracaoGeral | null {
    return this.backupState?.configuracaoGeral ?? null;
  }

  /**
   * Retorna escala config do backup se disponível, senão null
   */
  getBackupEscalaConfig(): any | null {
    return this.backupState?.escalaConfig ?? null;
  }

  /**
   * Retorna orçamentos oficiais do backup se disponível, senão null
   */
  getBackupOrcamentosOficiais(): any[] | null {
    return this.backupState?.orcamentosOficiais ?? null;
  }
}