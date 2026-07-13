import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';
import { OrcamentoOficialService } from '../../services/orcamento-oficial';
import { OrcamentoOficial } from '../../models/orcamento-oficial.model';
import { ItemOrcamento } from '../../models/item-orcamento.model';
import { ProgressService } from '../../services/progress';
import { DateUtils } from '../../utils/date-utils';
import { ImpressaoService } from '../../utils/impressao-service';
import { MensagemUtils } from '../../utils/mensagem-utils';

// Pipes
import { SubstituirPlaceholdersPipe } from '../../pipes/substituir-placeholders-pipe';

// Models
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../../models/tarifa.model';
import { IMPRESSAO_ORCAMENTO_CSS } from '../../utils/print-styles';

interface OrcamentoOficialImportado {
  tipo: string;
  cliente: string;
  temporada: string;
  dataCheckin: string | Date;
  dataCheckout: string | Date;
  horaEntrada?: string;
  horaSaida?: string;
  itens: ItemOrcamento[];
  assinatura?: string;
}

type Refeicao = 'comCafe' | 'comAlmoco' | 'comJanta' | 'comLanche';

@Component({
  selector: 'app-orcamento-oficial',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    CheckboxModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    SubstituirPlaceholdersPipe,
  ],
  providers: [],
  templateUrl: './orcamento-oficial.html',
  styleUrls: ['./orcamento-oficial.scss'],
})
export class OrcamentoOficialComponent implements OnInit {
  categorias = signal<CategoriaQuarto[]>([]);
  config = signal<ConfiguracaoGeral | null>(null);

  cliente: string = '';
  temporada: 'auto' | 'baixa' | 'alta' = 'auto';
  dataCheckin: Date = DateUtils.hoje();
  dataCheckout: Date = DateUtils.amanha();
  horaEntrada: string = DateUtils.HORA_CHECKIN;
  horaSaida: string = DateUtils.HORA_CHECKOUT;
  hoje: Date = DateUtils.hoje();

  // Dialog de orçamentos salvos
  orcamentosSalvosDialog: boolean = false;
  orcamentosSalvos: OrcamentoOficial[] = [];

  itens: ItemOrcamento[] = [];

  // Para o documento impresso
  totalGeral: number = 0;
  horasExtras: number = 0;

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private impressaoService: ImpressaoService,
    private criptografia: CriptografiaService,
    private orcamentoOficialService: OrcamentoOficialService,
    private progressService: ProgressService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.carregarDados();
    this.verificarOrcamentoSalvo();
    this.adicionarItem(); // Adiciona primeiro item automaticamente ao abrir
    this.cdr.detectChanges();
  }

  private verificarOrcamentoSalvo() {
    // Verifica se há um orçamento salvo passado via navegação (history.state)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { orcamentoSalvo?: any } | undefined;

    if (state?.orcamentoSalvo) {
      this.carregarOrcamentoSalvo(state.orcamentoSalvo);
    }
  }

  private carregarOrcamentoSalvo(orcamento: any) {
    try {
      this.cliente = orcamento.cliente || '';
      this.temporada = (orcamento.temporada as 'auto' | 'baixa' | 'alta') || 'auto';
      this.dataCheckin = new Date(orcamento.dataCheckin);
      this.dataCheckout = new Date(orcamento.dataCheckout);
      this.horaEntrada = orcamento.horaEntrada || DateUtils.HORA_CHECKIN;
      this.horaSaida = orcamento.horaSaida || DateUtils.HORA_CHECKOUT;
      this.itens = orcamento.itens || [];
      this.onDataChange(); // Recalcula tudo
    } catch (error) {
      console.error('Erro ao carregar orçamento salvo:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível carregar o orçamento salvo.',
      });
    }
  }

  async abrirOrcamentosSalvos() {
    try {
      const orcamentos = await this.orcamentoOficialService.listar();
      this.orcamentosSalvos = orcamentos.sort(
        (a, b) => new Date(b.dataGeracao).getTime() - new Date(a.dataGeracao).getTime()
      );
      this.orcamentosSalvosDialog = true;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message || 'Não foi possível carregar os orçamentos salvos.',
      });
    }
  }

  selecionarOrcamentoSalvo(orcamento: OrcamentoOficial) {
    this.carregarOrcamentoSalvo(orcamento);
    this.orcamentosSalvosDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Orçamento Carregado',
      detail: `"${orcamento.titulo}" carregado com sucesso.`,
    });
  }

  excluirOrcamentoSalvo(event: Event, orcamento: OrcamentoOficial) {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Excluir o orçamento "${orcamento.titulo}" do cliente ${orcamento.cliente}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.orcamentoOficialService.excluir(orcamento.id);
          this.orcamentosSalvos = this.orcamentosSalvos.filter((o) => o.id !== orcamento.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Excluído',
            detail: 'Orçamento removido com sucesso.',
          });
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.message || 'Não foi possível excluir o orçamento.',
          });
        }
      },
    });
  }

  novoOrcamento() {
    this.cliente = '';
    this.temporada = 'auto';
    this.dataCheckin = new Date();
    this.dataCheckout = new Date();
    this.dataCheckout.setDate(this.dataCheckout.getDate() + 1);
    this.horaEntrada = DateUtils.HORA_CHECKIN;
    this.horaSaida = DateUtils.HORA_CHECKOUT;
    this.itens = [];
    // this.adicionarItem(); // Não adiciona item automaticamente
    this.onDataChange();
    this.messageService.add({
      severity: 'info',
      summary: 'Novo Orçamento',
      detail: 'Formulário limpo para novo orçamento.',
    });
  }

  async salvarOrcamento() {
    if (!this.cliente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Informe o nome do cliente.',
      });
      return;
    }

    this.progressService.show({
      titulo: 'Salvando Orçamento',
      mensagem: 'Preparando dados...',
      mostrarBarra: false,
    });

    try {
      const orcamento = this.orcamentoOficialService.criarOrcamento(
        `Orçamento ${this.cliente}`,
        this.cliente
      );

      orcamento.temporada = this.temporada;
      orcamento.dataCheckin = this.dataCheckin;
      orcamento.dataCheckout = this.dataCheckout;
      orcamento.horaEntrada = this.horaEntrada;
      orcamento.horaSaida = this.horaSaida;
      orcamento.itens = this.itens;

      this.progressService.updateMensagem('Salvando no banco de dados...');
      this.progressService.updateProgress(50);

      await this.orcamentoOficialService.salvar(orcamento);

      this.progressService.updateProgress(100);
      this.messageService.add({
        severity: 'success',
        summary: 'Salvo',
        detail: 'Orçamento salvo com sucesso.',
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message || 'Não foi possível salvar o orçamento.',
      });
    } finally {
      this.progressService.hide();
    }
  }

  async carregarDados() {
    const [cats, cfg] = await Promise.all([
      this.tarifaService.getCategorias(),
      this.tarifaService.getConfiguracao(),
    ]);
    this.categorias.set(cats);
    this.config.set(cfg);
    this.cdr.detectChanges();
  }

  /**
   * Retorna o número de noites para fins de exibição e cálculo.
   * Se for o mesmo dia (Day Use), retorna 1 para cobrar a diária cheia.
   */
  get noitesCalculadas(): number {
    const noitesReais = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    const isDayUse = noitesReais === 0 && !!this.dataCheckin && !!this.dataCheckout;
    return isDayUse ? 1 : noitesReais;
  }

  /**
   * Retorna se a estadia atual é considerada Day Use (mesma data).
   */
  get isDayUse(): boolean {
    return (
      this.calcularNoites(this.dataCheckin, this.dataCheckout) === 0 &&
      !!this.dataCheckin &&
      !!this.dataCheckout
    );
  }

  /**
   * Retorna a descrição textual do período (ex: "Day Use", "1 diária", "2 diárias")
   */
  get noitesDescricao(): string {
    if (this.isDayUse) return 'Day Use';
    const n = this.noitesCalculadas;
    return `${n} diária${n !== 1 ? 's' : ''}`;
  }

  getPlaceholderVars(): { [key: string]: string } {
    const noites = this.noitesCalculadas;
    const noitesDesc = this.noitesDescricao;
    const cfg = this.config();
    const precosRefeicoes = cfg?.precos?.refeicoes || { almoco: 0, janta: 0, lanche: 0 };
    const orcamentoConfig = cfg?.orcamento || {};
    const promocaoConfig = cfg?.promocao || {};

    return {
      cliente: this.cliente || '',
      checkinHora: this.horaEntrada,
      checkoutHora: this.horaSaida,
      checkinDataBr: DateUtils.formatarDataBR(this.dataCheckin),
      checkoutDataBr: DateUtils.formatarDataBR(this.dataCheckout),
      noites: noites.toString(),
      noitesDescricao: noitesDesc,
      totalGeral: this.totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      valorAlmoco: (precosRefeicoes.almoco || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      valorJanta: (precosRefeicoes.janta || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      valorLanche: (precosRefeicoes.lanche || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      sinalPercentual: (orcamentoConfig as any).sinalPercentual?.toString() || '50',
      temporada: this.temporada,
      horasExtras: this.horasExtras.toFixed(0),
      mensagemHorasExtras:
        this.horasExtras > 0
          ? `<strong>Horas Extras (Day Use):</strong> Estão contabilizadas ${this.horasExtras.toFixed(0)} horas de prolongamento na estadia após o vencimento da diária.`
          : '',
      percentualDesconto: (promocaoConfig as any).desconto?.toString() || '0',
      minimoDiarias: (promocaoConfig as any).minDiarias?.toString() || '0',
      textoPromocao: (promocaoConfig as any).texto || '',
    };
  }

  adicionarItem() {
    if (this.categorias().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nenhuma categoria cadastrada.',
      });
      return;
    }
    const novoItem: ItemOrcamento = {
      quantidade: 1,
      categoriaId: this.categorias()[0].id,
      categoriaNome: this.categorias()[0].nome,
      camasDescricao: this.formatarCamas(this.categorias()[0]),
      descricao: '',
      comCafe: true,
      comAlmoco: false,
      comJanta: false,
      comLanche: false,
      precoDiaria: 0,
      total: 0,
    };
    this.itens.push(novoItem);
    this.calcularItem(novoItem);
  }

  removerItem(index: number) {
    this.confirmationService.confirm({
      message: 'Remover este item do orçamento?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.itens.splice(index, 1);
        this.calcularTotais();
        this.messageService.add({
          severity: 'success',
          summary: 'Removido',
          detail: 'Item excluído.',
        });
      },
    });
  }

  onCategoriaChange(item: ItemOrcamento) {
    const cat = this.categorias().find((c) => c.id === item.categoriaId);
    if (cat) {
      item.categoriaNome = cat.nome;
      item.camasDescricao = this.formatarCamas(cat);
      this.calcularItem(item);
    }
  }

  // Função auxiliar para converter hora "HH:MM" em minutos
  parseTime(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  calcularItem(item: ItemOrcamento) {
    const cat = this.categorias().find((c) => c.id === item.categoriaId);
    if (!cat) return;

    const noites = this.noitesCalculadas;
    const isMesmoDia = this.isDayUse;
    const cfg = this.config();
    if (!cfg) return;

    if (noites <= 0) {
      item.precoDiaria = 0;
      item.total = 0;
      this.calcularTotais();
      return;
    }

    // Cálculo da hospedagem (diárias)
    let totalBaseHospedagem = 0;

    const cfgTemporada = cfg?.temporada || {};
    const altaInicio = cfgTemporada.altaInicio || '2025-12-15';
    const altaFim = cfgTemporada.altaFim || '2026-03-15';

    if (this.temporada === 'auto') {
      let current = new Date(this.dataCheckin);
      current.setHours(0, 0, 0, 0);
      for (let i = 0; i < noites; i++) {
        const isAlta = DateUtils.isAltaTemporada(
          current,
          altaInicio,
          altaFim,
        );
        const pAltaCafe = Number(cat.precoAltaCafe) || 0;
        const pAltaSemCafe = Number(cat.precoAltaSemCafe) || 0;
        const pBaixaCafe = Number(cat.precoBaixaCafe) || 0;
        const pBaixaSemCafe = Number(cat.precoBaixaSemCafe) || 0;

        const valorDia = isAlta
          ? item.comCafe
            ? pAltaCafe
            : pAltaSemCafe
          : item.comCafe
            ? pBaixaCafe
            : pBaixaSemCafe;

        totalBaseHospedagem += valorDia;
        current.setDate(current.getDate() + 1);
      }
    } else {
      const usarAlta = this.temporada === 'alta';
      const pAltaCafe = Number(cat.precoAltaCafe) || 0;
      const pAltaSemCafe = Number(cat.precoAltaSemCafe) || 0;
      const pBaixaCafe = Number(cat.precoBaixaCafe) || 0;
      const pBaixaSemCafe = Number(cat.precoBaixaSemCafe) || 0;

      const valorDia = usarAlta
        ? item.comCafe
          ? pAltaCafe
          : pAltaSemCafe
        : item.comCafe
          ? pBaixaCafe
          : pBaixaSemCafe;

      totalBaseHospedagem = valorDia * noites;
    }

    // Aplicar promoção se ativa (Ignora se for Day Use conforme solicitado: "sem abatimentos")
    if (
      !isMesmoDia &&
      cfg.promocao.ativa &&
      noites >= (cfg.promocao.minDiarias || 1)
    ) {
      const isPeriodoAlta =
        this.temporada === 'alta' ||
        (this.temporada === 'auto' &&
          DateUtils.isAltaTemporada(
            this.dataCheckin,
            altaInicio,
            altaFim,
          ));

      if (!cfg.promocao.somenteAlta || isPeriodoAlta) {
        const desconto = totalBaseHospedagem * (cfg.promocao.desconto / 100);
        totalBaseHospedagem -= desconto;
      }
    }

    // Capacidade da UH (para calcular refeições por pessoa)
    const catAny = cat as any;
    const capacidade = Number(catAny.capacidadeMaxima || catAny.cap || 1);

    // Cálculo das refeições com base nos horários
    const arrMin = this.parseTime(this.horaEntrada);
    const depMin = this.parseTime(this.horaSaida);
    const middleDays = Math.max(0, noites - 1);

    let qtdAlmoco = 0,
      qtdJanta = 0,
      qtdLanche = 0;
    let custoAlmoco = 0,
      custoJanta = 0,
      custoLanche = 0;

    if (item.comAlmoco) {
      let count = 0;
      if (isMesmoDia) {
        if (
          arrMin <= this.parseTime(cfg.horarios.almoco.fim) &&
          depMin >= this.parseTime(cfg.horarios.almoco.inicio)
        ) {
          count = 1;
        }
      } else {
        if (arrMin <= this.parseTime(cfg.horarios.almoco.fim)) count++;
        if (depMin >= this.parseTime(cfg.horarios.almoco.inicio)) count++;
        count += middleDays;
      }
      qtdAlmoco = count;
      custoAlmoco = count * (cfg.precos.refeicoes.almoco || 0) * capacidade;
    }
    if (item.comJanta) {
      let count = 0;
      if (isMesmoDia) {
        if (
          arrMin <= this.parseTime(cfg.horarios.jantar.fim) &&
          depMin >= this.parseTime(cfg.horarios.jantar.inicio)
        ) {
          count = 1;
        }
      } else {
        if (arrMin <= this.parseTime(cfg.horarios.jantar.fim)) count++;
        if (depMin >= this.parseTime(cfg.horarios.jantar.inicio)) count++;
        count += middleDays;
      }
      qtdJanta = count;
      custoJanta = count * (cfg.precos.refeicoes.janta || 0) * capacidade;
    }
    if (item.comLanche) {
      let count = 0;
      if (isMesmoDia) {
        if (
          arrMin <= this.parseTime(cfg.horarios.lanche.fim) &&
          depMin >= this.parseTime(cfg.horarios.lanche.inicio)
        ) {
          count = 1;
        }
      } else {
        if (arrMin <= this.parseTime(cfg.horarios.lanche.fim)) count++;
        if (depMin >= this.parseTime(cfg.horarios.lanche.inicio)) count++;
        count += middleDays;
      }
      qtdLanche = count;
      custoLanche = count * (cfg.precos.refeicoes.lanche || 0) * capacidade;
    }

    const totalRefeicoes = custoAlmoco + custoJanta + custoLanche;

    // Horas extras
    this.calcularHorasExtras();
    let extraCharge = 0;
    if (this.horasExtras > 0 && noites > 0) {
      const baseDaily = totalBaseHospedagem / noites;
      const hourlyRate = baseDaily / DateUtils.getDuracaoDiariaPadrao();
      extraCharge = hourlyRate * this.horasExtras * item.quantidade;
    }

    // Totais do item
    const totalItemSemExtra = (totalBaseHospedagem + totalRefeicoes) * item.quantidade;
    const totalItem = totalItemSemExtra + extraCharge;

    item.precoDiaria = (totalBaseHospedagem + totalRefeicoes) / noites;
    item.total = totalItem;

    // Guardar valores auxiliares para exibição
    item._subtotalSemExtra = totalItemSemExtra;
    item._extraCharge = extraCharge;
    item.qtdAlmoco = qtdAlmoco;
    item.qtdJanta = qtdJanta;
    item.qtdLanche = qtdLanche;

    this.calcularTotais();
  }

  calcularHorasExtras() {
    if (!this.dataCheckin || !this.dataCheckout) {
      this.horasExtras = 0;
      return;
    }
    const dtEntrada = new Date(this.dataCheckin);
    const [hEnt, mEnt] = this.horaEntrada.split(':').map(Number);
    dtEntrada.setHours(hEnt, mEnt, 0, 0);

    const dtSaida = new Date(this.dataCheckout);
    const [hSai, mSai] = this.horaSaida.split(':').map(Number);
    dtSaida.setHours(hSai, mSai, 0, 0);

    const noites = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    // Se for o mesmo dia, não há prolongamento de diária (horas extras)
    if (noites <= 0) {
      this.horasExtras = 0;
      return;
    }

    const duracaoPadraoMs =
      ((noites - 1) * 24 + DateUtils.getDuracaoDiariaPadrao()) * 60 * 60 * 1000;

    const dtStandardEnd = new Date(dtEntrada.getTime() + duracaoPadraoMs);
    const diffMs = dtSaida.getTime() - dtStandardEnd.getTime();
    this.horasExtras = Math.max(0, diffMs / (1000 * 60 * 60));
  }

  calcularTotais() {
    this.totalGeral = this.itens.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  calcularNoites(checkin: Date, checkout: Date): number {
    return DateUtils.calcularDiasEntre(checkin, checkout);
  }

  ajustarDataSaida(): void {
    if (this.dataCheckin && this.dataCheckout) {
      // Só ajusta automaticamente se a saída for ANTES da entrada.
      // Se for IGUAL, agora é permitido manualmente.
      if (this.dataCheckout < this.dataCheckin) {
        this.dataCheckout = DateUtils.ajustarDataSaida(this.dataCheckin, this.dataCheckout);
      }
    }
  }

  onTemporadaChange() {
    this.itens.forEach((item) => this.calcularItem(item));
  }

  onDataChange() {
    this.ajustarDataSaida();
    this.itens.forEach((item) => this.calcularItem(item));
  }

  formatarCamas(cat: any): string {
    const txt = MensagemUtils.formatarCamas(cat);
    return txt ? `(${txt})` : '';
  }

  // ===== MÉTODOS PARA BOTÕES ÚNICOS =====
  todosCom(meal: Refeicao): boolean {
    return this.itens.length > 0 && this.itens.every((item) => item[meal] === true);
  }

  alternarTodos(meal: Refeicao): void {
    const novoValor = !this.todosCom(meal);
    this.itens.forEach((item) => {
      item[meal] = novoValor;
      this.calcularItem(item);
    });
  }

  // Exportar/Importar
  async exportarOrcamento() {
    if (!this.cliente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Informe o nome do cliente.',
      });
      return;
    }

    this.progressService.show({
      titulo: 'Exportando Orçamento',
      mensagem: 'Preparando dados...',
      mostrarBarra: false,
    });

    try {
      // Usa o service que já faz criptografia com segredo portável
      const orcamento = this.orcamentoOficialService.criarOrcamentoCompleto({
        titulo: `Orçamento - ${this.cliente}`,
        cliente: this.cliente,
        temporada: this.temporada,
        dataCheckin: this.dataCheckin,
        dataCheckout: this.dataCheckout,
        horaEntrada: this.horaEntrada,
        horaSaida: this.horaSaida,
        itens: this.itens
      });

      await this.orcamentoOficialService.downloadOrcamento(orcamento);

      this.progressService.updateProgress(100);
      this.messageService.add({
        severity: 'success',
        summary: 'Exportado',
        detail: 'Arquivo .ortf salvo com sucesso.',
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro na Exportação',
        detail: error.message || 'Não foi possível exportar o orçamento.',
      });
    } finally {
      this.progressService.hide();
    }
  }

  async importarOrcamento(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.progressService.show({
      titulo: 'Importando Orçamento',
      mensagem: 'Lendo arquivo...',
      mostrarBarra: false,
    });

    try {
      const rawContent = await file.text();
      if (!rawContent) {
        throw new Error('Arquivo vazio.');
      }

      this.progressService.updateMensagem('Descriptografando arquivo (pode levar alguns segundos)...');
      this.progressService.updateProgress(30);
      // Usa segredo de backup (portável) para permitir importação de outras máquinas
      const dados = (await this.criptografia.descriptografarDados(rawContent, true)) as OrcamentoOficialImportado | null;

      this.progressService.updateMensagem('Validando assinatura digital...');
      this.progressService.updateProgress(60);

      if (!dados) {
        throw new Error('Formato de arquivo inválido ou corrompido.');
      }

      // O service exporta com tipo 'orcamento' (não 'orcamento-oficial-snapshot')
      if (dados.tipo !== 'orcamento' || !dados.itens || !dados.cliente) {
        throw new Error('Este não é um arquivo de orçamento oficial válido.');
      }

      if (dados.assinatura) {
        const { assinatura, ...dadosParaVerificar } = dados;
        const hashCalculado = this.criptografia.gerarHash(JSON.stringify(dadosParaVerificar));
        if (hashCalculado !== assinatura) {
          throw new Error('Assinatura do arquivo inválida. O arquivo pode estar corrompido.');
        }
      }

      this.progressService.updateMensagem('Carregando dados do orçamento...');
      this.progressService.updateProgress(80);

      this.cliente = dados.cliente || '';
      this.temporada = (dados.temporada as 'auto' | 'baixa' | 'alta') || 'auto';
      this.dataCheckin = new Date(dados.dataCheckin);
      this.dataCheckout = new Date(dados.dataCheckout);
      this.horaEntrada = dados.horaEntrada || DateUtils.HORA_CHECKIN;
      this.horaSaida = dados.horaSaida || DateUtils.HORA_CHECKOUT;
      this.itens = dados.itens || [];

      this.onDataChange(); // Recalcula tudo e ajusta datas
      this.progressService.updateProgress(100);
      this.messageService.add({
        severity: 'success',
        summary: 'Importado',
        detail: 'Orçamento carregado com sucesso.',
      });
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

  imprimir() {
    const elemento = document.getElementById('documento-impressao');
    if (elemento) {
      const tituloImpressao = this.cliente ? `Orçamento - ${this.cliente}` : 'Orçamento Oficial';

      this.impressaoService.imprimirElemento(elemento, tituloImpressao, IMPRESSAO_ORCAMENTO_CSS);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Elemento de impressão não encontrado.',
      });
    }
  }

  voltar() {
    this.router.navigate(['/']);
  }
}
