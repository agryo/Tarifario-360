import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';

// Componentes
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle';
import { PainelMasterComponent } from '../painel-master/painel-master';

// Registra a localização pt-BR
registerLocaleData(localePt);

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
  providers: [MessageService, ConfirmationService, { provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  // Controle dos diálogos
  configDialogVisible: boolean = false;
  isPainelAutenticado: boolean = false;

  // Dados para os cards de resumo
  totalCategorias: number = 0;
  totalPromocoes: number = 0;
  config: any = {};

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private criptografia: CriptografiaService,
    private primeng: PrimeNG,
  ) {}

  ngOnInit() {
    this.configurarIdiomaPrimeNG();
    this.carregarResumos();
  }

  configurarIdiomaPrimeNG() {
    this.primeng.setTranslation({
      firstDayOfWeek: 0,
      dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], // Usado em contextos com mais espaço.
      dayNamesMin: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], // Usado nos cabeçalhos do calendário.
      monthNames: [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ],
      monthNamesShort: [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ],
      today: 'Hoje',
      clear: 'Limpar',
      accept: 'Sim',
      reject: 'Não',
    });
  }

  carregarResumos() {
    this.totalCategorias = this.tarifaService.getCategorias().length;
    this.config = this.tarifaService.getConfiguracao();
    this.totalPromocoes = this.config.promocao?.ativa ? 1 : 0;
  }

  // ===== CONTROLE DE ACESSO =====
  abrirConfiguracoes() {
    this.configDialogVisible = true;
  }

  fecharConfiguracoes() {
    this.configDialogVisible = false;
    this.isPainelAutenticado = false; // Reseta o estado para a próxima abertura
    this.carregarResumos();
  }

  /**
   * Chamado pelo evento (onAutenticadoChange) do painel-master.
   * Atualiza o estado local para que o dialog possa se redimensionar.
   */
  handlePainelAuthState(autenticado: boolean) {
    this.isPainelAutenticado = autenticado;
  }
}
