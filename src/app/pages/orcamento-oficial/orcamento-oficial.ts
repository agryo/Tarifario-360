import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
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
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

// Services
import { TarifaService } from '../../services/tarifa';
import { OrcamentoOficialService } from '../../services/orcamento-oficial';

// Models
import { CategoriaQuarto } from '../../services/tarifa';

// Registra a localização pt-BR para formatação de moeda e data
registerLocaleData(localePt);

interface ItemOrcamento {
  id?: string;
  quantidade: number;
  categoriaId: string;
  categoriaNome?: string;
  camasDescricao?: string;
  descricao?: string;
  comCafe: boolean;
  comAlmoco: boolean;
  precoDiaria: number; // preço por diária (já considerando temporada e opcionais)
  total: number;
}

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
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './orcamento-oficial.html',
  styleUrls: ['./orcamento-oficial.scss'],
})
export class OrcamentoOficialComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>();

  categorias: CategoriaQuarto[] = [];
  // Inicializa com os mesmos padrões do Painel Master para evitar erros de undefined
  config: any = {
    valorAlmocoExtra: 45,
    comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
    altaInicio: '2025-12-15',
    altaFim: '2026-03-15',
    cafeInicio: '07:00',
    cafeFim: '10:00',
    promocaoAtiva: false,
    promocaoDesconto: 15,
    promocaoMinDiarias: 3,
    promocaoSomenteAlta: true,
  };

  cliente: string = '';
  temporada: 'auto' | 'baixa' | 'alta' = 'auto';
  dataCheckin: Date = new Date();
  dataCheckout: Date = new Date(new Date().setDate(new Date().getDate() + 1));
  hoje: Date = new Date();

  itens: ItemOrcamento[] = [];

  // Para o documento impresso
  totalGeral: number = 0;

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
    const savedConfig = this.tarifaService.getConfiguracao();
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
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

    let totalBaseHospedagem = 0;

    if (this.temporada === 'auto') {
      // Cálculo dia a dia para suportar períodos mistos
      let current = new Date(this.dataCheckin);
      current.setHours(0, 0, 0, 0);

      for (let i = 0; i < noites; i++) {
        const isAlta = this.isAltaTemporada(current, this.config.altaInicio, this.config.altaFim);

        // Garante que os valores sejam números para evitar concatenação de strings
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
      // Temporada fixa forçada
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

    // Aplicação de Promoção (Lógica do Painel Master)
    if (this.config.promocaoAtiva && noites >= (this.config.promocaoMinDiarias || 1)) {
      // Verifica se a promoção se aplica (se for somente alta, checa se estamos na alta)
      const isPeriodoAlta =
        this.temporada === 'alta' ||
        (this.temporada === 'auto' &&
          this.isAltaTemporada(this.dataCheckin, this.config.altaInicio, this.config.altaFim));

      if (!this.config.promocaoSomenteAlta || isPeriodoAlta) {
        const desconto = totalBaseHospedagem * (this.config.promocaoDesconto / 100);
        totalBaseHospedagem -= desconto;
      }
    }

    // Almoço opcional: Valor * Capacidade * Noites
    // Tenta pegar a capacidade de várias formas (novo, antigo ou alternativo)
    const catAny = cat as any;
    const capacidade = Number(catAny.capacidadeMaxima || catAny.cap || 1);
    const valorAlmoco = Number(this.config.valorAlmocoExtra || 0);

    const custoAlmocoTotal = item.comAlmoco ? valorAlmoco * capacidade * noites : 0;

    // Define o preço médio da diária para exibição e cálculo final
    item.precoDiaria = (totalBaseHospedagem + custoAlmocoTotal) / noites;

    // Atualiza o total do item
    item.total = item.precoDiaria * item.quantidade * noites;
    this.calcularTotais();
  }

  calcularItemTotal(item: ItemOrcamento) {
    const noites = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    item.total = item.quantidade * item.precoDiaria * noites;
    this.calcularTotais();
  }

  calcularTotais() {
    this.totalGeral = this.itens.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  calcularNoites(checkin: Date, checkout: Date): number {
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isAltaTemporada(data: Date, altaInicio: string, altaFim: string): boolean {
    if (!altaInicio || !altaFim) return false;

    // Cria datas em hora local (00:00) adicionando T00:00:00 para evitar UTC
    const inicio = new Date(altaInicio + 'T00:00:00');
    const fim = new Date(altaFim + 'T00:00:00');

    // Compara os timestamps para garantir precisão
    return data.getTime() >= inicio.getTime() && data.getTime() <= fim.getTime();
  }

  onTemporadaChange() {
    this.itens.forEach((item) => this.calcularItem(item));
  }

  onDataChange() {
    this.itens.forEach((item) => this.calcularItem(item));
  }

  // Helper para formatar descrição das camas (ex: "1 Casal + 2 Solteiro")
  formatarCamas(cat: any): string {
    const partes = [];
    if (cat.camasCasal > 0) {
      partes.push(`${cat.camasCasal} Casal`);
    }
    if (cat.camasSolteiro > 0) {
      partes.push(`${cat.camasSolteiro} Solteiro`);
    }
    return partes.length > 0 ? `(${partes.join(' + ')})` : '';
  }

  // Ações em lote
  marcarTodos(tipo: 'cafe' | 'almoco', valor: boolean) {
    this.itens.forEach((item) => {
      if (tipo === 'cafe') item.comCafe = valor;
      else item.comAlmoco = valor;
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
        this.itens = dados.itens || [];
        this.calcularTotais();
        this.mostrarMensagem('success', 'Importado', 'Orçamento carregado.');
      } catch {
        this.mostrarMensagem('error', 'Erro', 'Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  // Impressão
  imprimir() {
    window.print();
  }

  // Botão Voltar
  voltar() {
    this.onVoltar.emit();
  }

  private mostrarMensagem(severity: string, summary: string, detail: string) {
    this.onMensagem.emit({ severity, summary, detail });
  }
}
