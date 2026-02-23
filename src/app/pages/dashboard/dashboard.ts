import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';

// Services
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';

// Componentes
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle';
import { PainelMasterComponent } from '../painel-master/painel-master';
import { TabelaPrecosComponent } from '../tabela-precos/tabela-precos';
import { WallboxComponent } from '../wallbox/wallbox';
import { OrcamentoRapidoComponent } from '../orcamento-rapido/orcamento-rapido';
import { OrcamentoOficialComponent } from '../orcamento-oficial/orcamento-oficial';
import { TabelaOpcoesComponent } from '../tabela-opcoes/tabela-opcoes';
import { EscalaNoturnaComponent } from '../escala-noturna/escala-noturna';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    // PrimeNG
    ButtonModule,
    CardModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    // Meus componentes
    ThemeToggleComponent,
    PainelMasterComponent,
    TabelaPrecosComponent,
    WallboxComponent,
    OrcamentoRapidoComponent,
    OrcamentoOficialComponent,
    TabelaOpcoesComponent,
    EscalaNoturnaComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  // Controle dos diálogos
  configDialogVisible: boolean = false;
  senhaDialogVisible: boolean = false;
  senhaInput: string = '';

  // Controle do módulo ativo (quando não for null, mostra o módulo no lugar da grid)
  moduloAtivo: string | null = null;

  // Dados para os cards de resumo
  totalCategorias: number = 0;
  totalPromocoes: number = 0;
  config: any = {};

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private criptografia: CriptografiaService,
  ) {}

  ngOnInit() {
    this.carregarResumos();
  }

  carregarResumos() {
    this.totalCategorias = this.tarifaService.getCategorias().length;
    this.config = this.tarifaService.getConfiguracao();
    this.totalPromocoes = this.config.promocaoAtiva ? 1 : 0;
  }

  // ===== CONTROLE DE ACESSO =====
  abrirConfiguracoes() {
    if (this.config.senhaHash) {
      this.senhaInput = '';
      this.senhaDialogVisible = true;
    } else {
      this.abrirModalConfiguracoes();
    }
  }

  verificarSenha() {
    if (this.criptografia.verificarSenha(this.senhaInput, this.config.senhaHash)) {
      this.senhaDialogVisible = false;
      this.abrirModalConfiguracoes();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Senha incorreta!',
        life: 3000,
      });
      this.senhaInput = '';
    }
  }

  abrirModalConfiguracoes() {
    this.configDialogVisible = true;
  }

  fecharConfiguracoes() {
    this.configDialogVisible = false;
    this.carregarResumos();
  }

  get promocaoStatus(): string {
    return this.config.promocaoAtiva ? 'Ativa' : 'Inativa';
  }

  // ===== CONTROLE DOS MÓDULOS =====
  abrirModulo(modulo: string) {
    this.moduloAtivo = modulo;
  }

  fecharModulo() {
    this.moduloAtivo = null;
  }

  // ===== MENSAGENS VINDAS DO PAINEL MASTER =====
  mostrarMensagem(event: { severity: string; summary: string; detail: string }) {
    this.messageService.add({
      severity: event.severity,
      summary: event.summary,
      detail: event.detail,
      life: 3000,
    });
  }
}
