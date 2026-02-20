import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PRIMENG - TODOS os módulos necessários
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // Para confirmação elegante

// Services
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

import { TarifaService } from '../../services/tarifa';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle';

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
    TabsModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    CheckboxModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule, // <-- Módulo no imports
    // Seus componentes
    ThemeToggleComponent,
  ],
  providers: [
    MessageService, // <-- Services no providers
    ConfirmationService, // <-- Services no providers
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  // Controle do modal de configurações
  configDialogVisible: boolean = false;

  // Controle do dialog de senha
  senhaDialogVisible: boolean = false;
  senhaInput: string = '';

  // Controles dos diálogos internos
  categoriaDialog: boolean = false;
  categoriaEdit: any = {};

  promocaoDialog: boolean = false;
  promocaoEdit: any = {};

  // Configurações
  config: any = {
    // Parâmetros Globais
    horarioCafe: '07:00 - 10:00',
    horarioAlmoco: '12:00 - 14:00',
    horarioJantar: '19:00 - 21:00',
    valorAlmocoExtra: 45,
    valorKwh: 0.89,
    senhaMaster: '1234',

    // Novos campos do modal antigo
    festividade: '🎊 Evento Especial',
    totalUhs: 50,
    comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
    altaInicio: '2025-12-15',
    altaFim: '2026-03-15',

    // Horários detalhados
    cafeInicio: '07:00',
    cafeFim: '10:00',
    cafeAtivo: true,
    almocoInicio: '12:00',
    almocoFim: '14:00',
    almocoAtivo: true,
    jantarInicio: '19:00',
    jantarFim: '21:00',
    jantarAtivo: true,

    // Promoções
    promocaoAtiva: false,
    promocaoDesconto: 15,
    promocaoMinDiarias: 3,
    promocaoTexto: 'Pagamento integral via Pix ou Dinheiro',
    promocaoSomenteAlta: true,
    promocaoMsgBaixa: false,
  };

  // Promoções
  promocoes: any[] = [];

  // Categorias
  categorias: any[] = [];
  totalCategorias: number = 0;
  totalPromocoes: number = 0;

  // Tema
  isDarkMode: boolean = false;

  // Controles de senha
  mostrarSenhaAtual: boolean = false;
  mostrarNovaSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;
  senhaAtualInput: string = '';
  novaSenhaInput: string = '';
  confirmarSenhaInput: string = '';

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.categorias = this.tarifaService.getCategorias();
    this.totalCategorias = this.categorias.length;

    // Dados mockados para exemplo
    this.promocoes = [
      {
        id: '1',
        nome: 'Early Bird',
        desconto: 15,
        diasMinimos: 3,
        aplicaAlta: true,
        mensagemBaixa: 'Consulte condições',
      },
      {
        id: '2',
        nome: 'Long Stay',
        desconto: 20,
        diasMinimos: 7,
        aplicaAlta: true,
        mensagemBaixa: 'Válido',
      },
    ];
    this.totalPromocoes = this.promocoes.length;
  }

  // ===== TEMA =====
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    const element = document.querySelector('body');
    if (this.isDarkMode) {
      element?.classList.add('my-app-dark');
      // Forçar atualização do modal se estiver aberto
      if (this.configDialogVisible) {
        this.configDialogVisible = false;
        setTimeout(() => (this.configDialogVisible = true));
      }
    } else {
      element?.classList.remove('my-app-dark');
    }
  }

  // ===== CONFIGURAÇÕES COM SENHA =====
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
      });
      this.senhaInput = '';
    }
  }

  abrirModalConfiguracoes() {
    this.config = this.tarifaService.getConfiguracao();
    this.configDialogVisible = true;
  }

  salvarConfiguracoes() {
    this.tarifaService.salvarConfiguracao(this.config);
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Configurações salvas com sucesso',
    });
    this.configDialogVisible = false;
  }

  // ===== CATEGORIAS =====
  abrirDialogCategoria(categoria?: any) {
    this.categoriaEdit = categoria
      ? { ...categoria }
      : {
          id: '',
          nome: '',
          capacidadeMaxima: 2,
          // Preços com e sem café para Alta Temporada
          precoAltaCafe: 0,
          precoAltaSemCafe: 0,
          // Preços com e sem café para Baixa Temporada
          precoBaixaCafe: 0,
          precoBaixaSemCafe: 0,
          ativo: true,
        };
    this.categoriaDialog = true;
  }

  salvarCategoria() {
    // Validação básica
    if (!this.categoriaEdit.nome) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'O nome da UH é obrigatório',
      });
      return;
    }

    // Garantir que os valores são números
    this.categoriaEdit.precoAltaCafe = this.categoriaEdit.precoAltaCafe || 0;
    this.categoriaEdit.precoAltaSemCafe = this.categoriaEdit.precoAltaSemCafe || 0;
    this.categoriaEdit.precoBaixaCafe = this.categoriaEdit.precoBaixaCafe || 0;
    this.categoriaEdit.precoBaixaSemCafe = this.categoriaEdit.precoBaixaSemCafe || 0;

    this.tarifaService.salvarCategoria(this.categoriaEdit);
    this.carregarDados();
    this.categoriaDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Categoria salva com sucesso',
    });
  }

  // ===== EXCLUSÃO DE CATEGORIA/UH =====
  excluirCategoria(categoria: any) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir a UH "${categoria.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Chama o serviço para excluir
        this.tarifaService.excluirCategoria(categoria.id);

        // Recarrega os dados
        this.carregarDados();

        this.messageService.add({
          severity: 'success',
          summary: 'Excluído',
          detail: `UH "${categoria.nome}" removida com sucesso`,
        });
      },
    });
  }

  // ===== UHs =====
  adicionarUH() {
    this.abrirDialogCategoria();
  }

  editarUH(categoria: any) {
    this.abrirDialogCategoria(categoria);
  }

  excluirUH(categoria: any) {
    this.excluirCategoria(categoria); // Agora chama o método corrigido
  }

  // ===== PROMOÇÕES =====
  abrirDialogPromocao(promocao?: any) {
    this.promocaoEdit = promocao
      ? { ...promocao }
      : {
          id: '',
          nome: '',
          desconto: 0,
          diasMinimos: 1,
          aplicaAlta: true,
          mensagemBaixa: '',
        };
    this.promocaoDialog = true;
  }

  salvarPromocao() {
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Promoção salva',
    });
    this.promocaoDialog = false;
  }

  excluirPromocao(promocao: any) {
    this.messageService.add({
      severity: 'info',
      summary: 'Excluído',
      detail: 'Promoção removida',
    });
  }

  // ===== SEGURANÇA =====
  alterarSenha() {
    if (this.novaSenhaInput !== this.confirmarSenhaInput) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'As senhas não conferem',
      });
      return;
    }

    if (this.novaSenhaInput.length < 3 && this.novaSenhaInput.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A senha deve ter pelo menos 3 caracteres',
      });
      return;
    }

    if (this.config.senhaMaster && this.senhaAtualInput !== this.config.senhaMaster) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Senha atual incorreta',
      });
      return;
    }

    this.config.senhaMaster = this.novaSenhaInput;
    // Persiste no serviço
    this.tarifaService.salvarConfiguracao(this.config);

    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.novaSenhaInput ? 'Senha alterada com sucesso' : 'Senha removida',
    });

    // Limpar campos
    this.senhaAtualInput = '';
    this.novaSenhaInput = '';
    this.confirmarSenhaInput = '';
  }

  removerSenha() {
    if (this.config.senhaMaster) {
      this.confirmationService.confirm({
        message: 'Tem certeza que deseja remover a senha de acesso? O painel ficará sem proteção!',
        header: 'Confirmar Remoção',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, Remover',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.config.senhaMaster = '';
          this.tarifaService.salvarConfiguracao(this.config);

          this.messageService.add({
            severity: 'success',
            summary: 'Senha removida',
            detail: 'Acesso ao painel agora é livre',
          });
        },
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Não há senha configurada',
      });
    }
  }

  // ===== BACKUP =====
  exportarBackup() {
    const backup = this.tarifaService.exportarDados();
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Backup exportado',
      detail: 'Arquivo JSON gerado com sucesso',
    });
  }

  importarBackup(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        // Aqui você implementaria a lógica de importação
        this.messageService.add({
          severity: 'success',
          summary: 'Backup importado',
          detail: 'Dados restaurados com sucesso',
        });
      } catch {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Arquivo inválido',
        });
      }
    };
    reader.readAsText(file);
  }

  // ===== LIMPEZA =====
  limparCache() {
    // Implementar lógica de limpeza
    this.messageService.add({
      severity: 'warn',
      summary: 'Cache limpo',
      detail: 'Dados restaurados para configuração padrão',
    });
  }
}
