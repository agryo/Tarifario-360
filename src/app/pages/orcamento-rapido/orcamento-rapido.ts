import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';

// PrimeNG 21
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

// Services
import { TarifaService } from '../../services/tarifa';
import { OrcamentoRapidoService } from '../../services/orcamento-rapido';
import { DateUtils } from '../../utils/date-utils';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

@Component({
  selector: 'app-orcamento-rapido',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Select, DatePicker],
  providers: [],
  templateUrl: './orcamento-rapido.html',
  styleUrls: ['./orcamento-rapido.scss'],
})
export class OrcamentoRapidoComponent implements OnInit {
  categorias: any[] = [];
  config!: ConfiguracaoGeral;

  categoriaId: string | null = null;
  dataCheckin: Date = DateUtils.hoje();
  dataCheckout: Date = DateUtils.amanha();

  textoOrcamento: string = '';
  hoje: Date = DateUtils.hoje();

  constructor(
    private tarifaService: TarifaService,
    private orcamentoService: OrcamentoRapidoService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.gerarOrcamento();
  }

  carregarDados() {
    this.categorias = this.tarifaService.getCategorias();
    this.config = this.tarifaService.getConfiguracao();
    if (this.categorias.length) {
      this.categoriaId = this.categorias[0].id;
    }
  }

  onDataChange() {
    if (this.dataCheckin && this.dataCheckout) {
      this.dataCheckout = DateUtils.ajustarDataSaida(this.dataCheckin, this.dataCheckout);
    }
    this.gerarOrcamento();
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
      const resultado = this.orcamentoService.gerarOrcamento({
        categoriaId: this.categoriaId,
        dataCheckin: this.dataCheckin,
        dataCheckout: this.dataCheckout,
        quantidade: 1, // fixo
        incluirCafe: true, // fixo
      });
      this.textoOrcamento = resultado.textoWhatsApp;
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível gerar o orçamento.',
      });
    }
  }

  copiarWhatsApp() {
    if (!this.textoOrcamento) return;
    navigator.clipboard.writeText(this.textoOrcamento).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Orçamento copiado para a área de transferência.',
      });
    });
  }

  voltar() {
    this.router.navigate(['/']);
  }
}
