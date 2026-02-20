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

// Componentes
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle';
import { PainelMasterComponent } from '../painel-master/painel-master';

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

  // Dados para os cards de resumo
  totalCategorias: number = 0;
  totalPromocoes: number = 0; // Agora reflete a promoção global ativa/inativa
  config: any = {};

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.carregarResumos();
  }

  carregarResumos() {
    this.totalCategorias = this.tarifaService.getCategorias().length;
    this.config = this.tarifaService.getConfiguracao();
    // A promoção é global: se estiver ativa, mostramos 1, senão 0
    this.totalPromocoes = this.config.promocaoAtiva ? 1 : 0;
  }

  // ===== CONTROLE DE ACESSO =====
  abrirConfiguracoes() {
    if (this.config.senhaMaster) {
      this.senhaInput = '';
      this.senhaDialogVisible = true;
    } else {
      this.abrirModalConfiguracoes();
    }
  }

  verificarSenha() {
    if (this.senhaInput === this.config.senhaMaster) {
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
    this.carregarResumos(); // Atualiza os cards após fechar
  }

  get promocaoStatus(): string {
    return this.config.promocaoAtiva ? 'Ativa' : 'Inativa';
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
