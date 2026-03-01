import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localePt from '@angular/common/locales/pt';

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
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

// Services
import { TarifaService, ConfiguracaoGeral } from '../../services/tarifa';
import { OrcamentoOficialService } from '../../services/orcamento-oficial';
import { DateUtils } from '../../utils/date-utils';

// Pipes
import { SubstituirPlaceholdersPipe } from '../../pipes/substituir-placeholders-pipe';

// Models
import { CategoriaQuarto } from '../../services/tarifa';

registerLocaleData(localePt);

export interface ItemOrcamento {
  id?: string;
  quantidade: number;
  categoriaId: string;
  categoriaNome?: string;
  camasDescricao?: string;
  descricao?: string; // nome dos hóspedes / cargo
  comCafe: boolean;
  comAlmoco: boolean;
  comJanta: boolean;
  comLanche: boolean;
  precoDiaria: number; // preço médio por diária (acomodação + refeições inclusas)
  total: number;
  // campos auxiliares para exibição (não persistidos)
  _subtotalAcomodacao?: number;
  _subtotalRefeicoes?: number;
  _subtotalSemExtra?: number;
  _extraCharge?: number;
  _totalItem?: number;
  // contagens de refeições para exibição
  qtdAlmoco?: number;
  qtdJanta?: number;
  qtdLanche?: number;
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
    SubstituirPlaceholdersPipe,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './orcamento-oficial.html',
  styleUrls: ['./orcamento-oficial.scss'],
})
export class OrcamentoOficialComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>();

  categorias: CategoriaQuarto[] = [];
  config!: ConfiguracaoGeral;

  cliente: string = '';
  temporada: 'auto' | 'baixa' | 'alta' = 'auto';
  dataCheckin: Date = new Date();
  dataCheckout: Date = DateUtils.adicionarDias(new Date(), 1);
  horaEntrada: string = '14:00';
  horaSaida: string = '11:00';
  hoje: Date = new Date();

  itens: ItemOrcamento[] = [];

  // Para o documento impresso
  totalGeral: number = 0;
  horasExtras: number = 0;

  constructor(
    private tarifaService: TarifaService,
    private orcamentoService: OrcamentoOficialService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.adicionarItem(); // começa com uma linha em branco
  }

  carregarDados() {
    this.categorias = this.tarifaService.getCategorias();
    this.config = this.tarifaService.getConfiguracao();
  }

  formatarDataBr(data: Date | null): string {
    if (!data) return '';
    return data.toLocaleDateString('pt-BR');
  }

  getPlaceholderVars(): { [key: string]: string } {
    const noites = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    return {
      cliente: this.cliente || '',
      checkinHora: this.horaEntrada,
      checkoutHora: this.horaSaida,
      checkinDataBr: this.formatarDataBr(this.dataCheckin),
      checkoutDataBr: this.formatarDataBr(this.dataCheckout),
      noites: noites.toString(),
      totalGeral: this.totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      valorAlmoco: (this.config.valorAlmocoExtra || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      valorJanta: (this.config.valorJantaExtra || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      valorLanche: (this.config.valorLancheExtra || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      sinalPercentual: this.config.orcSinalPercentual?.toString() || '50',
      temporada: this.temporada,
      horasExtras: this.horasExtras.toFixed(0),
      mensagemHorasExtras:
        this.horasExtras > 0
          ? `<strong>Horas Extras (Day Use):</strong> Estão contabilizadas ${this.horasExtras.toFixed(0)} horas de prolongamento na estadia após o vencimento da diária.`
          : '',
      percentualDesconto: this.config.promocaoDesconto?.toString() || '0',
      minimoDiarias: this.config.promocaoMinDiarias?.toString() || '0',
      textoPromocao: this.config.promocaoTexto || '',
    };
  }

  adicionarItem() {
    if (this.categorias.length === 0) {
      this.mostrarMensagem('warn', 'Atenção', 'Nenhuma categoria cadastrada.');
      return;
    }
    const novoItem: ItemOrcamento = {
      quantidade: 1,
      categoriaId: this.categorias[0].id,
      categoriaNome: this.categorias[0].nome,
      camasDescricao: this.formatarCamas(this.categorias[0]),
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
        this.mostrarMensagem('success', 'Removido', 'Item excluído.');
      },
    });
  }

  onCategoriaChange(item: ItemOrcamento) {
    const cat = this.categorias.find((c) => c.id === item.categoriaId);
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
    const cat = this.categorias.find((c) => c.id === item.categoriaId);
    if (!cat) return;

    const noites = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    if (noites <= 0) {
      item.precoDiaria = 0;
      item.total = 0;
      this.calcularTotais();
      return;
    }

    // Cálculo da hospedagem (diárias)
    let totalBaseHospedagem = 0;

    if (this.temporada === 'auto') {
      let current = new Date(this.dataCheckin);
      current.setHours(0, 0, 0, 0);
      for (let i = 0; i < noites; i++) {
        const isAlta = this.isAltaTemporada(current, this.config.altaInicio, this.config.altaFim);
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

    // Aplicar promoção se ativa
    if (this.config.promocaoAtiva && noites >= (this.config.promocaoMinDiarias || 1)) {
      const isPeriodoAlta =
        this.temporada === 'alta' ||
        (this.temporada === 'auto' &&
          this.isAltaTemporada(this.dataCheckin, this.config.altaInicio, this.config.altaFim));

      if (!this.config.promocaoSomenteAlta || isPeriodoAlta) {
        const desconto = totalBaseHospedagem * (this.config.promocaoDesconto / 100);
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
      if (arrMin <= this.parseTime(this.config.almocoFim)) count++;
      if (depMin >= this.parseTime(this.config.almocoInicio)) count++;
      count += middleDays;
      qtdAlmoco = count;
      custoAlmoco = count * (this.config.valorAlmocoExtra || 0) * capacidade;
    }
    if (item.comJanta) {
      let count = 0;
      if (arrMin <= this.parseTime(this.config.jantarFim)) count++;
      if (depMin >= this.parseTime(this.config.jantarInicio)) count++;
      count += middleDays;
      qtdJanta = count;
      custoJanta = count * (this.config.valorJantaExtra || 0) * capacidade;
    }
    if (item.comLanche) {
      let count = 0;
      if (arrMin <= this.parseTime(this.config.lancheTardeFim)) count++;
      if (depMin >= this.parseTime(this.config.lancheTardeInicio)) count++;
      count += middleDays;
      qtdLanche = count;
      custoLanche = count * (this.config.valorLancheExtra || 0) * capacidade;
    }

    const totalRefeicoes = custoAlmoco + custoJanta + custoLanche;

    // Horas extras
    this.calcularHorasExtras();
    let extraCharge = 0;
    if (this.horasExtras > 0 && noites > 0) {
      const baseDaily = totalBaseHospedagem / noites;
      const hourlyRate = baseDaily / 21;
      extraCharge = hourlyRate * this.horasExtras * item.quantidade;
    }

    // Totais do item
    const totalItemSemExtra = (totalBaseHospedagem + totalRefeicoes) * item.quantidade;
    const totalItem = totalItemSemExtra + extraCharge;

    item.precoDiaria = (totalBaseHospedagem + totalRefeicoes) / noites;
    item.total = totalItem;

    // Guardar valores auxiliares para exibição
    item._subtotalAcomodacao = totalBaseHospedagem * item.quantidade;
    item._subtotalRefeicoes = totalRefeicoes * item.quantidade;
    item._subtotalSemExtra = totalItemSemExtra;
    item._extraCharge = extraCharge;
    item._totalItem = totalItem;
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

    const dtStandardEnd = new Date(dtEntrada.getTime() + 21 * 60 * 60 * 1000);
    const diffMs = dtSaida.getTime() - dtStandardEnd.getTime();
    this.horasExtras = Math.max(0, diffMs / (1000 * 60 * 60));
  }

  calcularTotais() {
    this.totalGeral = this.itens.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  calcularNoites(checkin: Date, checkout: Date): number {
    return DateUtils.calcularDiasEntre(checkin, checkout);
  }

  isAltaTemporada(data: Date, altaInicio: string, altaFim: string): boolean {
    if (!altaInicio || !altaFim) return false;
    const inicio = new Date(altaInicio + 'T00:00:00');
    const fim = new Date(altaFim + 'T00:00:00');
    return data.getTime() >= inicio.getTime() && data.getTime() <= fim.getTime();
  }

  ajustarDataSaida(): void {
    if (!this.dataCheckin) return;
    if (!this.dataCheckout || this.dataCheckout <= this.dataCheckin) {
      this.dataCheckout = new Date(this.dataCheckin);
      this.dataCheckout.setDate(this.dataCheckout.getDate() + 1);
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
    const partes = [];
    if (cat.camasCasal > 0) partes.push(`${cat.camasCasal} Casal`);
    if (cat.camasSolteiro > 0) partes.push(`${cat.camasSolteiro} Solteiro`);
    return partes.length > 0 ? `(${partes.join(' + ')})` : '';
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
  exportarOrcamento() {
    if (!this.cliente) {
      this.mostrarMensagem('warn', 'Atenção', 'Informe o nome do cliente.');
      return;
    }
    const orcamento = {
      cliente: this.cliente,
      temporada: this.temporada,
      dataCheckin: this.dataCheckin,
      dataCheckout: this.dataCheckout,
      horaEntrada: this.horaEntrada,
      horaSaida: this.horaSaida,
      itens: this.itens,
      totalGeral: this.totalGeral,
    };
    const dataStr = JSON.stringify(orcamento, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orcamento_${this.cliente.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.mostrarMensagem('success', 'Exportado', 'Arquivo salvo.');
  }

  importarOrcamento(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string);
        this.cliente = dados.cliente || '';
        this.temporada = dados.temporada || 'auto';
        this.dataCheckin = new Date(dados.dataCheckin);
        this.dataCheckout = new Date(dados.dataCheckout);
        this.horaEntrada = dados.horaEntrada || '14:00';
        this.horaSaida = dados.horaSaida || '11:00';
        this.itens = dados.itens || [];
        this.onDataChange(); // Recalcula tudo e ajusta datas
        this.mostrarMensagem('success', 'Importado', 'Orçamento carregado.');
      } catch {
        this.mostrarMensagem('error', 'Erro', 'Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  imprimir() {
    window.print();
  }

  voltar() {
    this.onVoltar.emit();
  }

  private mostrarMensagem(severity: string, summary: string, detail: string) {
    this.onMensagem.emit({ severity, summary, detail });
  }
}
