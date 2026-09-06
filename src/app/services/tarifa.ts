import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { CategoriaService } from './categoria.service';
import { BackupStateService } from './backup-state.service';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../models/tarifa.model';

@Injectable({ providedIn: 'root' })
export class TarifaService {
  // Expor o observable do ConfigService para compatibilidade
  get configAtualizada$(): Observable<void> {
    return this.configService.configAtualizada$;
  }

  constructor(
    private configService: ConfigService,
    private categoriaService: CategoriaService,
    private backupStateService: BackupStateService,
    private configFactory: ConfigRepositoryFactory,
  ) {}

  getBackend(): string {
    return this.configFactory.getBackend();
  }

  // ===== DELEGAÇÃO PARA ConfigService =====
  async getConfiguracao(): Promise<ConfiguracaoGeral> {
    if (this.backupStateService.hasBackupState()) {
      const backupConfig = this.backupStateService.getBackupConfig();
      if (backupConfig) return backupConfig;
    }
    return this.configService.getConfiguracao();
  }

  migrarConfiguracaoSeNecessario(config: any): ConfiguracaoGeral {
    return this.configService.migrarConfiguracaoSeNecessario(config);
  }

  async salvarConfiguracao(config: ConfiguracaoGeral): Promise<void> {
    await this.configService.salvarConfiguracao(config);
  }

  async limparCache(): Promise<void> {
    await this.configService.limparCache();
    this.backupStateService.clearBackupState();
  }

  async recarregarDoSupabase(): Promise<void> {
    await this.configService.recarregarDoSupabase();
    this.backupStateService.clearBackupState();
  }

  // ===== DELEGAÇÃO PARA CategoriaService =====
  async getCategorias(): Promise<CategoriaQuarto[]> {
    if (this.backupStateService.hasBackupState()) {
      const backupCats = this.backupStateService.getBackupCategorias();
      if (backupCats) return backupCats;
    }
    return this.categoriaService.getCategorias();
  }

  async getCategoria(id: string): Promise<CategoriaQuarto | null> {
    return this.categoriaService.getCategoria(id);
  }

  async salvarCategoria(categoria: CategoriaQuarto): Promise<void> {
    await this.categoriaService.salvarCategoria(categoria);
  }

  async excluirCategoria(id: string): Promise<void> {
    await this.categoriaService.excluirCategoria(id);
  }

  // ===== BACKUP STATE (Painel Master) =====
  setBackupState(backup: {
    configuracaoGeral?: ConfiguracaoGeral;
    categorias?: CategoriaQuarto[];
    escalaConfig?: any;
    orcamentosOficiais?: any[];
  }): void {
    this.backupStateService.setBackupState(backup);
  }

  clearBackupState(): void {
    this.backupStateService.clearBackupState();
  }

  getBackupState() {
    return this.backupStateService.getBackupState();
  }

  // ===== INICIALIZAÇÃO (delega para os services) =====
  async inicializarDadosPadrao(): Promise<void> {
    if (this.backupStateService.hasBackupState()) {
      return;
    }
    await Promise.all([
      this.categoriaService.inicializarCategoriasPadrao(),
      this.configService.inicializarDadosPadraoSeNecessario(),
    ]);
  }
}