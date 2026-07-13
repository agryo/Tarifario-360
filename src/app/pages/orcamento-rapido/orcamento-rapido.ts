import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { CategoriaQuarto } from '../../models/categoria-quarto.model';

@Component({
  selector: 'app-orcamento-rapido',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Select, DatePicker],
  providers: [],
  templateUrl: './orcamento-rapido.html',
  styleUrls: ['./orcamento-rapido.scss'],
})
export class OrcamentoRapidoComponent implements OnInit {
  // Signals para evitar ExpressionChangedAfterItHasBeenCheckedError
  categorias = signal<CategoriaQuarto[]>([]);
  config = signal<ConfiguracaoGeral | null>(null);
  carregando = signal(true);

  categoriaId = signal<string | null>(null);
  dataCheckin = signal<Date>(DateUtils.hoje());
  dataCheckout = signal<Date>(DateUtils.amanha());

  textoOrcamento = signal<string>('');
  hoje = DateUtils.hoje();

  constructor(
    private tarifaService: TarifaService,
    private orcamentoService: OrcamentoRapidoService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.carregarDados();
    this.gerarOrcamento();
  }

  async carregarDados() {
    this.carregando.set(true);
    const [cats, cfg] = await Promise.all([
      this.tarifaService.getCategorias(),
      this.tarifaService.getConfiguracao(),
    ]);
    this.categorias.set(cats);
    this.config.set(cfg);

    if (cats.length) {
      this.categoriaId.set(cats[0].id);
    }
    this.carregando.set(false);
    this.cdr.detectChanges();
  }

  onCheckinSelect() {
    if (this.dataCheckin()) {
      // Ao mudar o check-in, sugere check-out para o dia seguinte por padrão
      const amanha = new Date(this.dataCheckin());
      amanha.setDate(amanha.getDate() + 1);
      this.dataCheckout.set(amanha);
    }
    this.onDataChange();
  }

  async onDataChange() {
    if (this.dataCheckin() && this.dataCheckout()) {
      // Só força o ajuste automático se o checkout for ANTES do checkin.
      if (this.dataCheckout() < this.dataCheckin()) {
        this.dataCheckout.set(DateUtils.ajustarDataSaida(this.dataCheckin(), this.dataCheckout()));
      }
    }
    await this.gerarOrcamento();
  }

  async gerarOrcamento() {
    // Converter strings para Date se necessário (PrimeNG 21 pode retornar string)
    const checkin = this.dataCheckin() instanceof Date ? this.dataCheckin() : new Date(this.dataCheckin());
    const checkout = this.dataCheckout() instanceof Date ? this.dataCheckout() : new Date(this.dataCheckout());

    if (
      !this.categoriaId() ||
      !checkin ||
      !checkout ||
      checkout < checkin
    ) {
      this.textoOrcamento.set('');
      return;
    }

    try {
      const resultado = await this.orcamentoService.gerarOrcamento({
        categoriaId: this.categoriaId()!,
        dataCheckin: checkin,
        dataCheckout: checkout,
        quantidade: 1, // fixo
        incluirCafe: true, // fixo
      });
      this.textoOrcamento.set(resultado.textoWhatsApp);
    } catch (error: any) {
      console.error('Erro ao gerar orçamento:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: `Não foi possível gerar o orçamento: ${error.message}`,
      });
    }
  }

  copiarWhatsApp() {
    if (!this.textoOrcamento()) return;
    navigator.clipboard.writeText(this.textoOrcamento()).then(() => {
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
