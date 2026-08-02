import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';
import { EscalaService, EscalaConfig } from '../../services/escala';
import { BackupService } from '../../services/backup';
import { ProgressService } from '../../services/progress';
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../../models/tarifa.model';
import { DateUtils } from '../../utils/date-utils';

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
  providers: [ConfirmationService],
  templateUrl: './painel-master.html',
  styleUrls: ['./painel-master.scss'],
})
export class PainelMasterComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Output() onFechar = new EventEmitter<void>();
  @Output() onSalvo = new EventEmitter<void>();
  @Output() onAutenticadoChange = new EventEmitter<boolean>();

  config: ConfiguracaoGeral = PainelMasterComponent.getConfiguracaoPadraoStatic();

  private static getConfiguracaoPadraoStatic(): ConfiguracaoGeral {
    // Data padrão: uma semana à frente de hoje
    const hoje = new Date();
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);
    const altaInicio = umaSemana.toISOString().split('T')[0];

    const altaFim = new Date(umaSemana);
    altaFim.setDate(umaSemana.getDate() + 90); // 90 dias de alta temporada
    const altaFimStr = altaFim.toISOString().split('T')[0];

    return {
      festividade: '🎊 Evento Especial',
      totalUhs: 50,
      comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
      precos: {
        refeicoes: { almoco: 45, janta: 55, lanche: 25 },
        kwh: 0.89,
      },
      temporada: { altaInicio, altaFim: altaFimStr },
      horarios: {
        cafe: { inicio: '07:00', fim: '10:00', ativo: true },
        almoco: { inicio: '12:00', fim: '14:00', ativo: true },
        lanche: { inicio: '15:00', fim: '17:00', ativo: true },
        jantar: { inicio: '19:00', fim: '21:00', ativo: true },
      },
      promocao: {
        ativa: false,
        desconto: 15,
        minDiarias: 3,
        texto: 'Pagamento integral via Pix ou Dinheiro',
        somenteAlta: true,
        msgBaixa: false,
      },
      seguranca: { senhaHash: '', senhaSalt: '' },
      orcamento: {
        textos: {
          titulo: 'Orçamento de Hospedagem',
          configTitulo: '1. Configuração de Acomodação e Valores',
          configDescricao: 'A proposta contempla a estadia com café da manhã incluso...',
          notaRefeicoes: 'Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...',
          cronograma: 'Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}',
          pagamento: 'Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...',
          observacoes: 'Refeições: O café da manhã é cortesia da casa e já está incluso...',
          rodape: 'Setor de Reservas - Hotel Plaza',
        },
        sinalPercentual: 50,
      },
    };
  }

  // Propriedades para os datepickers do PrimeNG
  altaInicioDate: Date | null = null;
  altaFimDate: Date | null = null;

  // Disponibiliza a constante para ser usada no template HTML
  diasSemana = DateUtils.DIAS_SEMANA;
  escalaConfig!: EscalaConfig;

  categorias: CategoriaQuarto[] = [];
  categoriaDialog: boolean = false;
  categoriaEdit: CategoriaQuarto | null = null;

  // Controle de autenticação interno
  autenticado: boolean = false;
  senhaInputPainel: string = '';

  mostrarSenhaAtual: boolean = false;
  mostrarNovaSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;
  senhaAtualInput: string = '';
  novaSenhaInput: string = '';
  confirmarSenhaInput: string = '';

  hoje: Date = DateUtils.hoje(); // Para o atributo min dos datepickers

  constructor(
    private tarifaService: TarifaService,
    private backupService: BackupService,
    private confirmationService: ConfirmationService,
    private criptografia: CriptografiaService,
    private escalaService: EscalaService,
    private messageService: MessageService,
    private progressService: ProgressService,
  ) {}

  async ngOnInit() {
    await this.carregarDados();
    this.escalaConfig = await this.escalaService.getConfiguracao();
    this.resetarAutenticacao();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Garante que o estado de autenticação seja resetado sempre que o dialog for reaberto.
    if (changes['isVisible'] && !changes['isVisible'].firstChange && this.isVisible) {
      this.carregarDados().then(() => this.resetarAutenticacao());
    }
  }

  private resetarAutenticacao() {
    // Lógica de autenticação
    if (!this.config?.seguranca?.senhaHash) {
      this.autenticado = true;
    } else {
      this.autenticado = false;
    }
    this.onAutenticadoChange.emit(this.autenticado);
  }

  async carregarDados() {
    const loadedConfig = await this.tarifaService.getConfiguracao();
    const defaults = this.getConfiguracaoPadrao();
    // Deep merge para garantir que objetos aninhados existam, mas preserva senhaHash/senhaSalt vazios
    const dbSeguranca = loadedConfig.seguranca ?? {};
    const seguranca = {
      ...defaults.seguranca,
      ...dbSeguranca,
      // Usa verificação explícita de undefined/null pois string vazia "" é falsy
      senhaHash: dbSeguranca.senhaHash !== undefined && dbSeguranca.senhaHash !== null ? dbSeguranca.senhaHash : defaults.seguranca.senhaHash,
      senhaSalt: dbSeguranca.senhaSalt !== undefined && dbSeguranca.senhaSalt !== null ? dbSeguranca.senhaSalt : defaults.seguranca.senhaSalt,
    };
    this.config = {
      ...defaults,
      ...loadedConfig,
      precos: { ...defaults.precos, ...loadedConfig.precos, refeicoes: { ...defaults.precos.refeicoes, ...(loadedConfig.precos?.refeicoes || {}) } },
      temporada: { ...defaults.temporada, ...loadedConfig.temporada },
      horarios: { ...defaults.horarios, ...loadedConfig.horarios },
      promocao: { ...defaults.promocao, ...loadedConfig.promocao },
      seguranca,
      orcamento: { ...defaults.orcamento, ...loadedConfig.orcamento, textos: { ...defaults.orcamento.textos, ...(loadedConfig.orcamento?.textos || {}) } },
    };
    this.categorias = await this.tarifaService.getCategorias();

    // Converte as datas de string para Date para os p-datepicker
    if (this.config.temporada.altaInicio) {
      this.altaInicioDate = new Date(this.config.temporada.altaInicio + 'T00:00:00');
    }
    if (this.config.temporada.altaFim) {
      this.altaFimDate = new Date(this.config.temporada.altaFim + 'T00:00:00');
    }
  }

  verificarSenhaPainel() {
    if (
      this.criptografia.verificarSenha(
        this.senhaInputPainel,
        this.config.seguranca.senhaHash,
        this.config.seguranca.senhaSalt,
      )
    ) {
      this.autenticado = true;
      this.senhaInputPainel = '';
      this.onAutenticadoChange.emit(true);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Senha incorreta!',
      });
      this.senhaInputPainel = '';
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

  async salvarCategoria() {
    if (!this.categoriaEdit || !this.categoriaEdit.nome) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'O nome da UH é obrigatório',
      });
      return;
    }

    await this.tarifaService.salvarCategoria(this.categoriaEdit);
    await this.carregarDados();
    this.categoriaDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Categoria salva com sucesso',
    });
  }

  async excluirUH(categoria: CategoriaQuarto) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir a UH "${categoria.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.tarifaService.excluirCategoria(categoria.id);
        await this.carregarDados();
        this.messageService.add({
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

  onPromocaoSomenteAltaChange() {
    if (!this.config.promocao.somenteAlta) {
      this.config.promocao.msgBaixa = false;
    }
  }

  // ===== SEGURANÇA =====
  async alterarSenha() {
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

    // Verifica a senha atual se uma já estiver configurada
    if (this.config.seguranca.senhaHash) {
      const senhaAtualCorreta = this.criptografia.verificarSenha(
        this.senhaAtualInput,
        this.config.seguranca.senhaHash,
        this.config.seguranca.senhaSalt, // Passa o salt; o serviço lida se for undefined
      );
      if (!senhaAtualCorreta) {
        this.messageService.add({
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
      this.config.seguranca.senhaSalt = salt;
      this.config.seguranca.senhaHash = this.criptografia.hashSenha(this.novaSenhaInput, salt);
    } else {
      // Remove a senha
      this.config.seguranca.senhaHash = '';
      this.config.seguranca.senhaSalt = '';
    }

    try {
      await this.tarifaService.salvarConfiguracao(this.config);
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: this.novaSenhaInput ? 'Senha alterada com sucesso' : 'Senha removida com sucesso',
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro ao salvar',
        detail: error.message || 'Falha ao salvar no banco de dados. Verifique as permissões (RLS).',
      });
      return;
    }

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
        accept: async () => {
          this.config.seguranca.senhaHash = '';
          this.config.seguranca.senhaSalt = '';
          try {
            await this.tarifaService.salvarConfiguracao(this.config);
            this.messageService.add({
              severity: 'success',
              summary: 'Senha removida',
              detail: 'Acesso ao painel agora é livre',
            });
          } catch (error: any) {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro ao salvar',
              detail: error.message || 'Falha ao salvar no banco de dados. Verifique as permissões (RLS).',
            });
          }
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
  async exportarBackup() {
    this.progressService.show({
      titulo: 'Exportando Backup Completo',
      mensagem: 'Preparando todos os dados do sistema...',
      mostrarBarra: false,
    });

    try {
      this.progressService.updateMensagem('Criptografando backup (pode levar alguns segundos)...');
      this.progressService.updateProgress(50);
      await this.backupService.exportarArquivoCompleto();

      this.progressService.updateProgress(100);
      this.messageService.add({
        severity: 'success',
        summary: 'Backup exportado',
        detail: 'Arquivo gerado com sucesso',
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro no Backup',
        detail: error.message || 'Não foi possível exportar o backup.',
      });
    } finally {
      this.progressService.hide();
    }
  }

  async importarBackup(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.progressService.show({
      titulo: 'Importando Backup',
      mensagem: 'Lendo arquivo de backup...',
      mostrarBarra: false,
    });

    try {
      this.progressService.updateMensagem('Descriptografando e validando dados...');
      this.progressService.updateProgress(30);

      const resultado = await this.backupService.importarArquivo(file);

      this.progressService.updateMensagem('Restaurando configurações no sistema...');
      this.progressService.updateProgress(80);

      if (resultado.sucesso) {
        this.carregarDados(); // Recarrega os dados na tela
        this.progressService.updateProgress(100);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: resultado.mensagem,
        });
      } else {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: resultado.mensagem });
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro na Importação',
        detail: error.message || 'Arquivo inválido ou corrompido.',
      });
    } finally {
      this.progressService.hide();
      target.value = '';
    }
  }

  async limparCache() {
    this.confirmationService.confirm({
      message:
        'Tem certeza que deseja limpar todo o cache do sistema? Esta ação irá restaurar todas as configurações para os valores padrão e não pode ser desfeita!',
      header: 'Confirmar Limpeza Total',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Limpar Tudo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.tarifaService.limparCache();
        await this.carregarDados();
        this.messageService.add({
          severity: 'success',
          summary: 'Cache Limpo',
          detail: 'Todos os dados foram restaurados para as configurações padrão.',
        });
      },
    });
  }

  // ===== AÇÕES GLOBAIS =====
  async salvarConfiguracoes() {
    // Converte as datas de Date para string antes de salvar
    if (this.altaInicioDate) {
      this.config.temporada.altaInicio = DateUtils.formatarDataISO(this.altaInicioDate);
    }
    if (this.altaFimDate) {
      this.config.temporada.altaFim = DateUtils.formatarDataISO(this.altaFimDate);
    }
    try {
      await this.tarifaService.salvarConfiguracao(this.config);
      await this.escalaService.salvarConfiguracao(this.escalaConfig);
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Configurações salvas com sucesso',
      });
      this.onSalvo.emit();
      this.onFechar.emit();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro ao salvar',
        detail: error.message || 'Falha ao salvar no banco de dados. Verifique as permissões (RLS).',
      });
    }
  }

  // ===== CONTROLE DE DATAS DA ALTA TEMPORADA =====
  onAltaInicioChange() {
    // Se a data de início for alterada para depois da data de fim, ajusta a data de fim para ser igual à de início, mantendo um intervalo válido.
    if (this.altaInicioDate && this.altaFimDate && this.altaFimDate < this.altaInicioDate) {
      this.altaFimDate = new Date(this.altaInicioDate);
    }
  }

  fechar() {
    this.onFechar.emit();
  }

  private getConfiguracaoPadrao(): ConfiguracaoGeral {
    // Data padrão: uma semana à frente de hoje (igual ao service)
    const hoje = new Date();
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);
    const altaInicio = umaSemana.toISOString().split('T')[0];

    const altaFim = new Date(umaSemana);
    altaFim.setDate(umaSemana.getDate() + 90); // 90 dias de alta temporada
    const altaFimStr = altaFim.toISOString().split('T')[0];

    return {
      festividade: '🎊 Evento Especial',
      totalUhs: 50,
      comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
      precos: {
        refeicoes: { almoco: 45, janta: 55, lanche: 25 },
        kwh: 0.89,
      },
      temporada: { altaInicio, altaFim: altaFimStr },
      horarios: {
        cafe: { inicio: '07:00', fim: '10:00', ativo: true },
        almoco: { inicio: '12:00', fim: '14:00', ativo: true },
        lanche: { inicio: '15:00', fim: '17:00', ativo: true },
        jantar: { inicio: '19:00', fim: '21:00', ativo: true },
      },
      promocao: {
        ativa: false,
        desconto: 15,
        minDiarias: 3,
        texto: 'Pagamento integral via Pix ou Dinheiro',
        somenteAlta: true,
        msgBaixa: false,
      },
      seguranca: { senhaHash: '', senhaSalt: '' },
      orcamento: {
        textos: {
          titulo: 'Orçamento de Hospedagem',
          configTitulo: '1. Configuração de Acomodação e Valores',
          configDescricao: 'A proposta contempla a estadia com café da manhã incluido...',
          notaRefeicoes: 'Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...',
          cronograma: 'Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}',
          pagamento: 'Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...',
          observacoes: 'Refeições: O café da manhã é cortesia da casa e já está incluso...',
          rodape: 'Setor de Reservas - Hotel Plaza',
        },
        sinalPercentual: 50,
      },
    };
  }
}
