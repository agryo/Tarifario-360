import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';

// PrimeNG 21 - componentes standalone com nomes atualizados
import { Button } from 'primeng/button';
import { Select } from 'primeng/select'; // Antigo Dropdown
import { DatePicker } from 'primeng/datepicker'; // Antigo Calendar

// Services
import { TarifaService } from '../../services/tarifa';
import { OrcamentoRapidoService } from '../../services/orcamento-rapido';
import { DateUtils } from '../../utils/date-utils';

// Registra a localização pt-BR
registerLocaleData(localePt);

@Component({
  selector: 'app-orcamento-rapido',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Select, DatePicker],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './orcamento-rapido.html',
  styleUrls: ['./orcamento-rapido.scss'],
})
export class OrcamentoRapidoComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>();

  categorias: any[] = [];
  // Padrões básicos caso não haja configuração salva
  config: any = {
    altaInicio: '2025-12-15',
    altaFim: '2026-03-15',
    promocaoAtiva: false,
    promocaoDesconto: 15,
    promocaoMinDiarias: 3,
    promocaoSomenteAlta: true,
  };

  categoriaId: string | null = null;
  dataCheckin: Date = new Date();
  dataCheckout: Date = DateUtils.adicionarDias(new Date(), 1);
  quantidade: number = 1;
  incluirCafe: boolean = true;

  textoOrcamento: string = '';
  hoje: Date = new Date();

  constructor(
    private tarifaService: TarifaService,
    private orcamentoService: OrcamentoRapidoService,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.gerarOrcamento();
  }

  carregarDados() {
    this.categorias = this.tarifaService.getCategorias();
    const savedConfig = this.tarifaService.getConfiguracao();
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
    if (this.categorias.length) {
      this.categoriaId = this.categorias[0].id;
    }
  }

  gerarOrcamento() {
    if (
      !this.categoriaId ||
      !this.dataCheckin ||
      !this.dataCheckout ||
      this.dataCheckout <= this.dataCheckin
    ) {
      this.textoOrcamento = '';
      return;
    }

    try {
      const orcamento = this.orcamentoService.gerarOrcamento({
        categoriaId: this.categoriaId,
        dataCheckin: this.dataCheckin,
        dataCheckout: this.dataCheckout,
        quantidade: this.quantidade,
        incluirCafe: this.incluirCafe,
      });
      this.textoOrcamento = orcamento.textoWhatsApp;
    } catch (error) {
      this.onMensagem.emit({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível gerar o orçamento.',
      });
    }
  }

  copiarWhatsApp() {
    if (!this.textoOrcamento) return;

    navigator.clipboard.writeText(this.textoOrcamento).then(() => {
      this.onMensagem.emit({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Orçamento copiado para a área de transferência.',
      });
    });
  }

  limpar() {
    this.categoriaId = this.categorias.length ? this.categorias[0].id : null;
    this.dataCheckin = new Date();
    this.dataCheckout = DateUtils.adicionarDias(new Date(), 1);
    this.quantidade = 1;
    this.incluirCafe = true;
    this.gerarOrcamento();
    this.onMensagem.emit({
      severity: 'info',
      summary: 'Limpo',
      detail: 'Campos reiniciados.',
    });
  }

  voltar() {
    this.onVoltar.emit();
  }
}
