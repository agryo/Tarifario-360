import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { DatePickerModule } from 'primeng/datepicker';

// Services
import { ConfirmationService } from 'primeng/api';
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';
import { EscalaService, EscalaConfig } from '../../services/escala';
import { BackupService } from '../../services/backup';
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../../models/tarifa.model';
import { DateUtils } from '../../utils/date-utils';

registerLocaleData(localePt);

@Component({
  selector: 'app-painel-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    TabsModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ConfirmDialogModule,
    SelectModule,
    TooltipModule,
    AccordionModule,
    DividerModule,
    FieldsetModule,
    DatePickerModule,
  ],
  providers: [ConfirmationService, { provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './painel-master.html',
  styleUrls: ['./painel-master.scss'],
})
export class PainelMasterComponent implements OnInit {
  @Output() onFechar = new EventEmitter<void>();
  @Output() onSalvo = new EventEmitter<void>();
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();

  config!: ConfiguracaoGeral;
  // Propriedades para os datepickers do PrimeNG
  altaInicioDate: Date | null = null;
  altaFimDate: Date | null = null;

  // Disponibiliza a constante para ser usada no template HTML
  diasSemana = DateUtils.DIAS_SEMANA;
  escalaConfig!: EscalaConfig;

  categorias: CategoriaQuarto[] = [];
  categoriaDialog: boolean = false;
  categoriaEdit: CategoriaQuarto | null = null;

  mostrarSenhaAtual: boolean = false;
  mostrarNovaSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;
  senhaAtualInput: string = '';
  novaSenhaInput: string = '';
  confirmarSenhaInput: string = '';

  hoje: Date = new Date(); // Para o atributo min dos datepickers

  constructor(
    private tarifaService: TarifaService,
    private backupService: BackupService,
    private confirmationService: ConfirmationService,
    private criptografia: CriptografiaService,
    private escalaService: EscalaService,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.escalaConfig = this.escalaService.getConfiguracao();
  }

  carregarDados() {
    this.config = this.tarifaService.getConfiguracao();
    this.categorias = this.tarifaService.getCategorias();

    // Converte as datas de string para Date para os p-datepicker
    if (this.config.temporada.altaInicio) {
      this.altaInicioDate = new Date(this.config.temporada.altaInicio + 'T00:00:00');
    }
    if (this.config.temporada.altaFim) {
      this.altaFimDate = new Date(this.config.temporada.altaFim + 'T00:00:00');
    }
  }

  // ===== CATEGORIAS =====
  adicionarUH() {
    this.abrirDialogCategoria();
  }

  editarUH(categoria: CategoriaQuarto) {
    this.abrirDialogCategoria(categoria);
  }

  abrirDialogCategoria(categoria?: CategoriaQuarto) {
    this.categoriaEdit = categoria // Clona para edição
      ? { ...categoria }
      : {
          id: '',
          nome: '',
          capacidadeMaxima: 2,
          precoAltaCafe: 0,
          precoAltaSemCafe: 0,
          precoBaixaCafe: 0,
          precoBaixaSemCafe: 0,
          ativo: true,
          descricao: '',
          camasCasal: 1,
          camasSolteiro: 0,
          tipoOcupacaoPadrao: '',
          numeros: [],
          comodidadesSelecionadas: [],
        };
    this.categoriaDialog = true;
  }

  salvarCategoria() {
    if (!this.categoriaEdit || !this.categoriaEdit.nome) {
      this._exibirMensagem('warn', 'Atenção', 'O nome da UH é obrigatório');
      return;
    }

    this.tarifaService.salvarCategoria(this.categoriaEdit);
    this.carregarDados();
    this.categoriaDialog = false;
    this._exibirMensagem('success', 'Sucesso', 'Categoria salva com sucesso');
  }

  excluirUH(categoria: CategoriaQuarto) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir a UH "${categoria.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.tarifaService.excluirCategoria(categoria.id);
        this.carregarDados();
        this._exibirMensagem('success', 'Excluído', `UH "${categoria.nome}" removida com sucesso`);
      },
    });
  }

  getListaNumeros(): string[] {
    const total = this.config.totalUhs || 50;
    const numeros: string[] = [];
    for (let i = 1; i <= total; i++) {
      numeros.push(i.toString().padStart(2, '0'));
    }
    return numeros;
  }

  getComodidadesGlobaisArray(): string[] {
    if (!this.config.comodidadesGlobais) return [];
    return this.config.comodidadesGlobais
      .split(',')
      .map((item: string) => item.trim())
      .filter((item: string) => item);
  }

  onPromocaoSomenteAltaChange() {
    if (!this.config.promocao.somenteAlta) {
      this.config.promocao.msgBaixa = false;
    }
  }

  // ===== SEGURANÇA =====
  alterarSenha() {
    if (this.novaSenhaInput !== this.confirmarSenhaInput) {
      this._exibirMensagem('error', 'Erro', 'As senhas não conferem');
      return;
    }

    if (this.novaSenhaInput.length < 3 && this.novaSenhaInput.length > 0) {
      this._exibirMensagem('warn', 'Atenção', 'A senha deve ter pelo menos 3 caracteres');
      return;
    }

    // Verifica a senha atual se uma já estiver configurada
    if (this.config.seguranca.senhaHash) {
      const senhaAtualCorreta = this.criptografia.verificarSenha(
        this.senhaAtualInput,
        this.config.seguranca.senhaHash,
        this.config.seguranca.senhaSalt, // Passa o salt; o serviço lida se for undefined
      );
      if (!senhaAtualCorreta) {
        this._exibirMensagem('error', 'Erro', 'Senha atual incorreta');
        return;
      }
    }

    if (this.novaSenhaInput) {
      // Gera um novo salt e hash para a nova senha
      const salt = this.criptografia.gerarSalt();
      this.config.seguranca.senhaSalt = salt;
      this.config.seguranca.senhaHash = this.criptografia.hashSenha(this.novaSenhaInput, salt);
    } else {
      // Remove a senha
      this.config.seguranca.senhaHash = '';
      this.config.seguranca.senhaSalt = '';
    }

    this.tarifaService.salvarConfiguracao(this.config);

    this._exibirMensagem(
      'success',
      'Sucesso',
      this.novaSenhaInput ? 'Senha alterada com sucesso' : 'Senha removida com sucesso',
    );

    // Limpa os campos de senha
    this.senhaAtualInput = '';
    this.novaSenhaInput = '';
    this.confirmarSenhaInput = '';
  }

  removerSenha() {
    if (this.config.seguranca.senhaHash) {
      this.confirmationService.confirm({
        message: 'Tem certeza que deseja remover a senha de acesso? O painel ficará sem proteção!',
        header: 'Confirmar Remoção',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, Remover',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.config.seguranca.senhaHash = ''; // em vez de delete
          this.config.seguranca.senhaSalt = '';
          this.tarifaService.salvarConfiguracao(this.config);
          this._exibirMensagem('success', 'Senha removida', 'Acesso ao painel agora é livre');
        },
      });
    } else {
      this._exibirMensagem('warn', 'Atenção', 'Não há senha configurada');
    }
  }

  // ===== BACKUP =====
  exportarBackup() {
    const backup = this.backupService.exportarDados();
    this.backupService.downloadBackup(backup);
    this._exibirMensagem('success', 'Backup exportado', 'Arquivo JSON gerado com sucesso');
  }

  importarBackup(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        const resultado = this.backupService.importarDados(backup);
        if (resultado.sucesso) {
          this._exibirMensagem('success', 'Sucesso', resultado.mensagem);
          this.carregarDados(); // recarrega todos os dados
        } else {
          this._exibirMensagem('error', 'Erro', resultado.mensagem);
        }
      } catch (error) {
        console.error('Erro ao importar backup:', error);
        this._exibirMensagem('error', 'Erro', 'Arquivo de backup inválido ou corrompido');
      } finally {
        // Limpa o valor do input para permitir que o evento (change) seja disparado
        // novamente se o mesmo arquivo for selecionado.
        target.value = '';
      }
    };
    reader.readAsText(file);
  }

  limparCache() {
    this.confirmationService.confirm({
      message:
        'Tem certeza que deseja limpar todo o cache do sistema? Esta ação irá restaurar todas as configurações para os valores padrão e não pode ser desfeita!',
      header: 'Confirmar Limpeza Total',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Limpar Tudo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.tarifaService.limparCache();
        this.carregarDados();
        this._exibirMensagem(
          'success',
          'Cache Limpo',
          'Todos os dados foram restaurados para as configurações padrão.',
        );
      },
    });
  }

  // ===== AÇÕES GLOBAIS =====
  salvarConfiguracoes() {
    // Converte as datas de Date para string antes de salvar
    if (this.altaInicioDate) {
      this.config.temporada.altaInicio = DateUtils.formatarDataISO(this.altaInicioDate);
    }
    if (this.altaFimDate) {
      this.config.temporada.altaFim = DateUtils.formatarDataISO(this.altaFimDate);
    }
    this.tarifaService.salvarConfiguracao(this.config);
    this.escalaService.salvarConfiguracao(this.escalaConfig);
    this._exibirMensagem('success', 'Sucesso', 'Configurações salvas com sucesso');
    this.onSalvo.emit();
    this.onFechar.emit();
  }

  // ===== CONTROLE DE DATAS DA ALTA TEMPORADA =====
  onAltaInicioChange() {
    // Se a data de início for alterada para depois da data de fim, ajusta a data de fim para ser igual à de início, mantendo um intervalo válido.
    if (this.altaInicioDate && this.altaFimDate && this.altaFimDate < this.altaInicioDate) {
      this.altaFimDate = new Date(this.altaInicioDate);
    }
  }

  private _exibirMensagem(severity: string, summary: string, detail: string) {
    this.onMensagem.emit({ severity, summary, detail });
  }

  fechar() {
    this.onFechar.emit();
  }
}
