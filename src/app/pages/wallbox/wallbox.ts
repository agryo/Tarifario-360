import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { TarifaService } from '../../services/tarifa';
import { DateUtils } from '../../utils/date-utils';

// Registra a localização pt-BR
registerLocaleData(localePt);

@Component({
  selector: 'app-wallbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    TooltipModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './wallbox.html',
  styleUrls: ['./wallbox.scss'],
})
export class WallboxComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>(); // Evento para voltar ao dashboard

  consumo: number | null = null;
  tempo: string = '';
  tarifaKwh: number = 0.89; // Valor padrão alinhado com o Painel Master
  mostrarAjuda: boolean = false;

  constructor(private tarifaService: TarifaService) {}

  ngOnInit() {
    const config = this.tarifaService.getConfiguracao();
    if (config && config.precos.kwh !== undefined) {
      this.tarifaKwh = config.precos.kwh;
    }
  }

  limpar() {
    this.consumo = null;
    this.tempo = '';
    this.onMensagem.emit({
      severity: 'info',
      summary: 'Limpo',
      detail: 'Campos limpos com sucesso.',
    });
  }

  get totalCalculado(): number {
    return (this.consumo || 0) * this.tarifaKwh;
  }

  copiarWhatsApp() {
    if (!this.consumo || this.consumo <= 0) {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Insira o consumo em kWh antes de gerar a mensagem.',
      });
      return;
    }

    const agora = new Date();
    const dataFim = DateUtils.formatarDataBR(agora);
    const horaFim = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let texto = `🔋 *Recarga Veículo Elétrico*\n\n`;
    texto += `📅 ${dataFim} às ${horaFim}\n`;
    if (this.tempo) {
      texto += `⏱️ Tempo de Carga: ${this.tempo}\n`;
    }
    texto += `⚡ ${this.consumo} kWh\n`;
    texto += `💲 ${this.tarifaKwh.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/kWh\n`;
    texto += `💰 *TOTAL: ${this.totalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*`;

    navigator.clipboard.writeText(texto).then(() => {
      this.onMensagem.emit({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Resumo copiado para a área de transferência.',
      });
    });
  }

  voltar() {
    this.onVoltar.emit();
  }
}
