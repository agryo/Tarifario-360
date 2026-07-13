import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { TarifaService } from '../../services/tarifa';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

@Component({
  selector: 'app-modulos-grid',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './modulos-grid.html',
  styleUrls: ['./modulos-grid.scss'],
})
export class ModulosGridComponent implements OnInit {
  config = signal<ConfiguracaoGeral | null>(null);
  carregando = signal(false);

  private tarifaService = inject(TarifaService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    this.carregando.set(true);
    try {
      const cfg = await this.tarifaService.getConfiguracao();
      this.config.set(cfg);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível carregar a configuração.',
      });
    } finally {
      this.carregando.set(false);
      this.cdr.detectChanges();
    }
  }
}
