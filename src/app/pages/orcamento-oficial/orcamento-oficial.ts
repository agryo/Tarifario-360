import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
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
import { MessageService, ConfirmationService } from 'primeng/api';

// Services
import { TarifaService } from '../../services/tarifa';
import { CriptografiaService } from '../../services/criptografia';
import { DateUtils } from '../../utils/date-utils';
import { ImpressaoService } from '../../utils/impressao-service';

// Pipes
import { SubstituirPlaceholdersPipe } from '../../pipes/substituir-placeholders-pipe';

// Models
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../../models/tarifa.model';
import { ImpressaoOrcamentoCSS } from './impressao-styles';

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
  _subtotalSemExtra?: number;
  _extraCharge?: number;
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
  categorias: CategoriaQuarto[] = [];
  config!: ConfiguracaoGeral;

  cliente: string = '';
  temporada: 'auto' | 'baixa' | 'alta' = 'auto';
  dataCheckin: Date = DateUtils.hoje();
  dataCheckout: Date = DateUtils.amanha();
  horaEntrada: string = DateUtils.HORA_CHECKIN;
  horaSaida: string = DateUtils.HORA_CHECKOUT;
  hoje: Date = DateUtils.hoje();

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
    private router: Router,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.adicionarItem(); // começa com uma linha em branco
  }

  carregarDados() {
    this.categorias = this.tarifaService.getCategorias();
    this.config = this.tarifaService.getConfiguracao();
  }

  getPlaceholderVars(): { [key: string]: string } {
    const noites = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    return {
      cliente: this.cliente || '',
      checkinHora: this.horaEntrada,
      checkoutHora: this.horaSaida,
      checkinDataBr: DateUtils.formatarDataBR(this.dataCheckin),
      checkoutDataBr: DateUtils.formatarDataBR(this.dataCheckout),
      noites: noites.toString(),
      totalGeral: this.totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      valorAlmoco: (this.config.precos.refeicoes.almoco || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      valorJanta: (this.config.precos.refeicoes.janta || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      valorLanche: (this.config.precos.refeicoes.lanche || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      sinalPercentual: this.config.orcamento.sinalPercentual?.toString() || '50',
      temporada: this.temporada,
      horasExtras: this.horasExtras.toFixed(0),
      mensagemHorasExtras:
        this.horasExtras > 0
          ? `<strong>Horas Extras (Day Use):</strong> Estão contabilizadas ${this.horasExtras.toFixed(0)} horas de prolongamento na estadia após o vencimento da diária.`
          : '',
      percentualDesconto: this.config.promocao.desconto?.toString() || '0',
      minimoDiarias: this.config.promocao.minDiarias?.toString() || '0',
      textoPromocao: this.config.promocao.texto || '',
    };
  }

  adicionarItem() {
    if (this.categorias.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nenhuma categoria cadastrada.',
      });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Removido',
          detail: 'Item excluído.',
        });
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
        const isAlta = DateUtils.isAltaTemporada(
          current,
          this.config.temporada.altaInicio,
          this.config.temporada.altaFim,
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

    // Aplicar promoção se ativa
    if (this.config.promocao.ativa && noites >= (this.config.promocao.minDiarias || 1)) {
      const isPeriodoAlta =
        this.temporada === 'alta' ||
        (this.temporada === 'auto' &&
          DateUtils.isAltaTemporada(
            this.dataCheckin,
            this.config.temporada.altaInicio,
            this.config.temporada.altaFim,
          ));

      if (!this.config.promocao.somenteAlta || isPeriodoAlta) {
        const desconto = totalBaseHospedagem * (this.config.promocao.desconto / 100);
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
      if (arrMin <= this.parseTime(this.config.horarios.almoco.fim)) count++;
      if (depMin >= this.parseTime(this.config.horarios.almoco.inicio)) count++;
      count += middleDays;
      qtdAlmoco = count;
      custoAlmoco = count * (this.config.precos.refeicoes.almoco || 0) * capacidade;
    }
    if (item.comJanta) {
      let count = 0;
      if (arrMin <= this.parseTime(this.config.horarios.jantar.fim)) count++;
      if (depMin >= this.parseTime(this.config.horarios.jantar.inicio)) count++;
      count += middleDays;
      qtdJanta = count;
      custoJanta = count * (this.config.precos.refeicoes.janta || 0) * capacidade;
    }
    if (item.comLanche) {
      let count = 0;
      if (arrMin <= this.parseTime(this.config.horarios.lanche.fim)) count++;
      if (depMin >= this.parseTime(this.config.horarios.lanche.inicio)) count++;
      count += middleDays;
      qtdLanche = count;
      custoLanche = count * (this.config.precos.refeicoes.lanche || 0) * capacidade;
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
      this.dataCheckout = DateUtils.ajustarDataSaida(this.dataCheckin, this.dataCheckout);
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
    if (cat.camasCasal > 0) {
      partes.push(`${cat.camasCasal} ${cat.camasCasal > 1 ? 'Camas' : 'Cama'} Casal`);
    }
    if (cat.camasSolteiro > 0) {
      partes.push(`${cat.camasSolteiro} ${cat.camasSolteiro > 1 ? 'Camas' : 'Cama'} Solteiro`);
    }
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Informe o nome do cliente.',
      });
      return;
    }
    const dados = {
      tipo: 'orcamento-oficial-snapshot', // Identificador para validação na importação
      versao: '1.0',
      cliente: this.cliente,
      temporada: this.temporada,
      dataCheckin: this.dataCheckin,
      dataCheckout: this.dataCheckout,
      horaEntrada: this.horaEntrada,
      horaSaida: this.horaSaida,
      itens: this.itens,
      totalGeral: this.totalGeral,
    };

    const orcamentoAssinado = {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };

    const encryptedData = this.criptografia.criptografarDados(orcamentoAssinado);
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orcamento_${this.cliente.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.ortf`;
    link.click();
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'success',
      summary: 'Exportado',
      detail: 'Arquivo .ortf salvo com sucesso.',
    });
  }

  importarOrcamento(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const rawContent = e.target?.result as string;
        if (!rawContent) {
          throw new Error('Arquivo vazio.');
        }

        // Tenta descriptografar (.ortf)
        const dados = this.criptografia.descriptografarDados(rawContent);

        if (!dados) {
          throw new Error('Formato de arquivo inválido ou corrompido.');
        }

        if (dados.tipo !== 'orcamento-oficial-snapshot' || !dados.itens || !dados.cliente) {
          throw new Error('Este não é um arquivo de orçamento oficial válido.');
        }

        if (dados.assinatura) {
          const { assinatura, ...dadosParaVerificar } = dados;
          const hashCalculado = this.criptografia.gerarHash(JSON.stringify(dadosParaVerificar));
          if (hashCalculado !== assinatura) {
            throw new Error('Assinatura do arquivo inválida. O arquivo pode estar corrompido.');
          }
        }

        this.cliente = dados.cliente || '';
        this.temporada = dados.temporada || 'auto';
        this.dataCheckin = new Date(dados.dataCheckin);
        this.dataCheckout = new Date(dados.dataCheckout);
        this.horaEntrada = dados.horaEntrada || DateUtils.HORA_CHECKIN;
        this.horaSaida = dados.horaSaida || DateUtils.HORA_CHECKOUT;
        this.itens = dados.itens || [];

        this.onDataChange(); // Recalcula tudo e ajusta datas
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
        target.value = '';
      }
    };
    reader.readAsText(file);
  }

  imprimir() {
    const elemento = document.getElementById('documento-impressao');
    if (elemento) {
      const tituloImpressao = this.cliente ? `Orçamento - ${this.cliente}` : 'Orçamento Oficial';

      this.impressaoService.imprimirElemento(elemento, tituloImpressao, ImpressaoOrcamentoCSS);
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
