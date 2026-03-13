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

// Services
import { ConfirmationService } from 'primeng/api';
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';
import { EscalaService, EscalaConfig } from '../../services/escala';
import { BackupService } from '../../services/backup';
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { ConfiguracaoGeral, Promocao } from '../../models/tarifa.model';
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
  ],
  providers: [ConfirmationService, { provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './painel-master.html',
  styleUrls: ['./painel-master.scss'],
})
export class PainelMasterComponent implements OnInit {
  @Output() onFechar = new EventEmitter<void>();
  @Output() onSalvo = new EventEmitter<void>();
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();

  config!: ConfiguracaoGeral; // Agora tipado

  diasSemana = [
    { nome: 'DOM', valor: 0 },
    { nome: 'SEG', valor: 1 },
    { nome: 'TER', valor: 2 },
    { nome: 'QUA', valor: 3 },
    { nome: 'QUI', valor: 4 },
    { nome: 'SEX', valor: 5 },
    { nome: 'SÁB', valor: 6 },
  ];

  escalaConfig!: EscalaConfig;

  categorias: CategoriaQuarto[] = [];
  categoriaDialog: boolean = false;
  categoriaEdit: CategoriaQuarto = {} as CategoriaQuarto;

  promocoes: Promocao[] = [];
  promocaoDialog: boolean = false;
  promocaoEdit: Promocao = {} as Promocao;

  mostrarSenhaAtual: boolean = false;
  mostrarNovaSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;
  senhaAtualInput: string = '';
  novaSenhaInput: string = '';
  confirmarSenhaInput: string = '';

  hoje: string = DateUtils.formatarDataISO(DateUtils.hoje()); // Para o atributo min dos inputs

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
    this.promocoes = this.tarifaService.getPromocoes();
  }

  // ===== CATEGORIAS =====
  adicionarUH() {
    this.abrirDialogCategoria();
  }

  editarUH(categoria: CategoriaQuarto) {
    this.abrirDialogCategoria(categoria);
  }

  abrirDialogCategoria(categoria?: CategoriaQuarto) {
    this.categoriaEdit = categoria
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
    if (!this.categoriaEdit.nome) {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'O nome da UH é obrigatório',
      });
      return;
    }

    this.tarifaService.salvarCategoria(this.categoriaEdit);
    this.carregarDados();
    this.categoriaDialog = false;
    this.onMensagem.emit({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Categoria salva com sucesso',
    });
  }

  excluirUH(categoria: any) {
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
        this.onMensagem.emit({
          severity: 'success',
          summary: 'Excluído',
          detail: `UH "${categoria.nome}" removida com sucesso`,
        });
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

  // ===== PROMOÇÕES =====
  abrirDialogPromocao(promocao?: Promocao) {
    this.promocaoEdit = promocao
      ? { ...promocao }
      : {
          id: '',
          nome: '',
          desconto: 0,
          diasMinimos: 0,
          aplicaAlta: true,
          mensagemBaixa: '',
        };
    this.promocaoDialog = true;
  }

  salvarPromocao() {
    if (!this.promocaoEdit.nome || !this.promocaoEdit.desconto) {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'O nome e o desconto da promoção são obrigatórios.',
      });
      return;
    }
    this.tarifaService.salvarPromocao(this.promocaoEdit);
    this.carregarDados();
    this.onMensagem.emit({ severity: 'success', summary: 'Sucesso', detail: 'Promoção salva' });
    this.promocaoDialog = false;
  }

  excluirPromocao(promocao: Promocao) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir a promoção "${promocao.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.tarifaService.excluirPromocao(promocao.id);
        this.carregarDados();
        this.onMensagem.emit({
          severity: 'info',
          summary: 'Excluído',
          detail: `Promoção "${promocao.nome}" removida com sucesso`,
        });
      },
    });
  }

  onPromocaoSomenteAltaChange() {
    if (!this.config.promocaoSomenteAlta) {
      this.config.promocaoMsgBaixa = false;
    }
  }

  // ===== SEGURANÇA =====
  alterarSenha() {
    if (this.novaSenhaInput !== this.confirmarSenhaInput) {
      this.onMensagem.emit({
        severity: 'error',
        summary: 'Erro',
        detail: 'As senhas não conferem',
      });
      return;
    }

    if (this.novaSenhaInput.length < 3 && this.novaSenhaInput.length > 0) {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A senha deve ter pelo menos 3 caracteres',
      });
      return;
    }

    // Verifica a senha atual se uma já estiver configurada
    if (this.config.senhaHash) {
      const senhaAtualCorreta = this.criptografia.verificarSenha(
        this.senhaAtualInput,
        this.config.senhaHash,
        this.config.senhaSalt, // Passa o salt; o serviço lida se for undefined
      );
      if (!senhaAtualCorreta) {
        this.onMensagem.emit({
          severity: 'error',
          summary: 'Erro',
          detail: 'Senha atual incorreta',
        });
        return;
      }
    }

    if (this.novaSenhaInput) {
      // Gera um novo salt e hash para a nova senha
      const salt = this.criptografia.gerarSalt();
      this.config.senhaSalt = salt;
      this.config.senhaHash = this.criptografia.hashSenha(this.novaSenhaInput, salt);
    } else {
      // Remove a senha
      this.config.senhaHash = '';
      this.config.senhaSalt = '';
    }

    this.tarifaService.salvarConfiguracao(this.config);

    this.onMensagem.emit({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.novaSenhaInput ? 'Senha alterada com sucesso' : 'Senha removida com sucesso',
    });

    // Limpa os campos de senha
    this.senhaAtualInput = '';
    this.novaSenhaInput = '';
    this.confirmarSenhaInput = '';
  }

  removerSenha() {
    if (this.config.senhaHash) {
      this.confirmationService.confirm({
        message: 'Tem certeza que deseja remover a senha de acesso? O painel ficará sem proteção!',
        header: 'Confirmar Remoção',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, Remover',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.config.senhaHash = ''; // em vez de delete
          this.config.senhaSalt = '';
          this.tarifaService.salvarConfiguracao(this.config);
          this.onMensagem.emit({
            severity: 'success',
            summary: 'Senha removida',
            detail: 'Acesso ao painel agora é livre',
          });
        },
      });
    } else {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Não há senha configurada',
      });
    }
  }

  // ===== BACKUP =====
  exportarBackup() {
    const backup = this.backupService.exportarDados();
    this.backupService.downloadBackup(backup);
    this.onMensagem.emit({
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
        const resultado = this.backupService.importarDados(backup);
        if (resultado.sucesso) {
          this.onMensagem.emit({
            severity: 'success',
            summary: 'Sucesso',
            detail: resultado.mensagem,
          });
          this.carregarDados(); // recarrega todos os dados
        } else {
          this.onMensagem.emit({ severity: 'error', summary: 'Erro', detail: resultado.mensagem });
        }
      } catch (error) {
        console.error('Erro ao importar backup:', error);
        this.onMensagem.emit({
          severity: 'error',
          summary: 'Erro',
          detail: 'Arquivo de backup inválido ou corrompido',
        });
      } finally {
        // Limpa o valor do input para permitir que o evento (change) seja disparado
        // novamente se o mesmo arquivo for selecionado.
        event.target.value = null;
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
        this.onMensagem.emit({
          severity: 'success',
          summary: 'Cache Limpo',
          detail: 'Todos os dados foram restaurados para as configurações padrão.',
        });
      },
    });
  }

  // ===== AÇÕES GLOBAIS =====
  salvarConfiguracoes() {
    this.tarifaService.salvarConfiguracao(this.config);
    this.escalaService.salvarConfiguracao(this.escalaConfig);
    this.onMensagem.emit({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Configurações salvas com sucesso',
    });
    this.onSalvo.emit();
    this.onFechar.emit();
  }

  // ===== CONTROLE DE DATAS DA ALTA TEMPORADA =====
  onAltaInicioChange() {
    // Impede datas passadas
    if (this.config.altaInicio < this.hoje) {
      this.config.altaInicio = this.hoje;
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A data de início não pode ser anterior a hoje. Ajustada para hoje.',
      });
    }
    const ajustadas = DateUtils.ajustarDatasAltaTemporada(
      this.config.altaInicio,
      this.config.altaFim,
    );
    this.config.altaInicio = ajustadas.inicio;
    this.config.altaFim = ajustadas.fim;
  }

  onAltaFimChange() {
    const ajustadas = DateUtils.ajustarDatasAltaTemporada(
      this.config.altaInicio,
      this.config.altaFim,
    );
    this.config.altaInicio = ajustadas.inicio;
    this.config.altaFim = ajustadas.fim;
  }

  fechar() {
    this.onFechar.emit();
  }
}
