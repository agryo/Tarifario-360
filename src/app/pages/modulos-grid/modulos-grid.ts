import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

// Services
import { TarifaService } from '../../services/tarifa';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

@Component({
  selector: 'app-modulos-grid',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  templateUrl: './modulos-grid.html',
  styleUrls: ['./modulos-grid.scss'],
})
export class ModulosGridComponent implements OnInit {
  config?: ConfiguracaoGeral;

  constructor(private tarifaService: TarifaService) {}

  ngOnInit() {
    this.config = this.tarifaService.getConfiguracao();
  }
}
