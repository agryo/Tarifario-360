import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Services
import { TarifaService } from '../../services/tarifa';

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
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './wallbox.html',
  styleUrls: ['./wallbox.scss'],
})
export class WallboxComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  consumo: number | null = null;
  tempo: string = '';
  tarifaKwh: number = 1.8;
  mostrarAjuda: boolean = false;

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    const config = this.tarifaService.getConfiguracao();
    this.tarifaKwh = config.valorKwh || 1.8;
  }

  calcular() {
    // Apenas para manter a lógica
  }

  limpar() {
    this.consumo = null;
    this.tempo = '';
  }

  copiarWhatsApp() {
    if (!this.consumo || this.consumo <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Insira o consumo em kWh antes de gerar a mensagem.',
      });
      return;
    }

    const agora = new Date();
    const dataFim = agora.toLocaleDateString('pt-BR');
    const horaFim = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const total = this.consumo * this.tarifaKwh;

    const texto = `🔋 *Recarga Veículo Elétrico*\n\n📅 ${dataFim} às ${horaFim}\n⚡ ${this.consumo} kWh\n💲 ${this.tarifaKwh.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/kWh\n💰 *TOTAL: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*`;

    navigator.clipboard.writeText(texto).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Resumo copiado para a área de transferência.',
      });
    });
  }

  fechar() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
