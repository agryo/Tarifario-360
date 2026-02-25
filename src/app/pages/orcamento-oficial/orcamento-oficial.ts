import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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

interface ItemOrcamento {
  id?: string;
  quantidade: number;
  categoriaId: string;
  categoriaNome?: string;
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
  // Removido providers locais para usar os serviços globais (do Dashboard/App)
  // providers: [MessageService, ConfirmationService],
  templateUrl: './orcamento-oficial.html',
  styleUrls: ['./orcamento-oficial.scss'],
})
export class OrcamentoOficialComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>();

  categorias: CategoriaQuarto[] = [];
  config: any = {};

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
    this.config = this.tarifaService.getConfiguracao();
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
      this.calcularItem(item);
    }
  }

  calcularItem(item: ItemOrcamento) {
    const cat = this.categorias.find((c) => c.id === item.categoriaId);
    if (!cat) return;

    // Determinar qual temporada usar
    let usarAlta = false;
    if (this.temporada === 'alta') usarAlta = true;
    else if (this.temporada === 'baixa') usarAlta = false;
    else {
      // Automático: verificar se a data de check-in está na alta temporada
      usarAlta = this.isAltaTemporada(
        this.dataCheckin,
        this.config.altaInicio,
        this.config.altaFim,
      );
    }

    const precoBase = usarAlta
      ? item.comCafe
        ? cat.precoAltaCafe
        : cat.precoAltaSemCafe
      : item.comCafe
        ? cat.precoBaixaCafe
        : cat.precoBaixaSemCafe;

    // Almoço opcional (valor fixo da configuração)
    const precoAlmoco = item.comAlmoco ? this.config.valorAlmocoExtra || 0 : 0;

    item.precoDiaria = precoBase + precoAlmoco;
    this.calcularItemTotal(item);
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
    const inicio = new Date(altaInicio);
    const fim = new Date(altaFim);
    return data >= inicio && data <= fim;
  }

  onTemporadaChange() {
    this.itens.forEach((item) => this.calcularItem(item));
  }

  onDataChange() {
    this.itens.forEach((item) => this.calcularItem(item));
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
