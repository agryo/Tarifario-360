import { Component, OnInit, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';

// Services
import { EscalaService, EscalaConfig } from '../../services/escala';

@Component({
  selector: 'app-escala-noturna',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DatePicker],
  templateUrl: './escala-noturna.html',
  styleUrls: ['./escala-noturna.scss'],
  encapsulation: ViewEncapsulation.None, // Permite estilizar o conteúdo dinâmico da tabela
})
export class EscalaNoturnaComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>();

  escalaConfig!: EscalaConfig;
  dataInicio: Date = new Date();
  dataFim: Date = new Date(new Date().setDate(new Date().getDate() + 41));
  tabelaHTML: string = '';

  constructor(private escalaService: EscalaService) {}

  ngOnInit() {
    this.escalaConfig = this.escalaService.getConfiguracao();
    this.gerarEscala();
  }

  gerarEscala() {
    if (!this.escalaConfig) return;

    const p1 = this.escalaConfig.p1 || 'P1';
    const p2 = this.escalaConfig.p2 || 'P2';
    const diasFolga = this.escalaConfig.folgas; // array de números 0-6
    const quemFolgaPrimeiro = this.escalaConfig.quemFolgaPrimeiro;

    const inicio = new Date(this.dataInicio);
    const fim = new Date(this.dataFim);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(0, 0, 0, 0);

    let html = '<table><thead><tr>';
    const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    diasNomes.forEach((nome, i) => {
      const classe = diasFolga.includes(i) ? 'color-folga' : `color-${i}`;
      html += `<th class="${classe}">${nome}</th>`;
    });
    html += '</tr></thead><tbody><tr>';

    let atual = new Date(inicio);
    let ciclo = quemFolgaPrimeiro === 'p1' ? 1 : 0;
    let folgaAnterior = false;
    let ultimoNoite = '';

    while (atual <= fim) {
      const sem = atual.getDay();
      const hojeFolga = diasFolga.includes(sem);

      if (!hojeFolga && folgaAnterior) ciclo++;
      folgaAnterior = hojeFolga;

      const qNoite = hojeFolga ? (ciclo % 2 === 0 ? p2 : p1) : p1;
      const qMadruga = hojeFolga ? (ciclo % 2 === 0 ? p2 : p1) : p2;

      const diaMes = `${atual.getDate().toString().padStart(2, '0')}/${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][atual.getMonth()]}`;

      html += `<td><div class="cell-wrapper">`;
      html += `<span class="data-label ${hojeFolga ? 'color-folga' : `color-${sem}`}">${diaMes}</span>`;
      html += `<div class="dia-container">`;

      // Turno madruga (00h-06h)
      html += `<div class="coluna turno-madruga">`;
      if (qMadruga === ultimoNoite && ultimoNoite !== '') {
        html += `<div class="seta-fluxo">➔</div>`;
      }
      html += `<strong>${qMadruga}</strong><br><small>00h-06h</small>`;
      if (hojeFolga) {
        const quemFolgaHoje = qNoite === p1 ? p2 : p1;
        if (quemFolgaHoje === p2) {
          html += `<span class="folga-aviso">Folga: ${p2}</span>`;
        }
      }
      html += `</div>`;

      // Turno dia (06h-18h) - sempre "Equipe do Dia"
      html += `<div class="coluna equipe-dia">Equipe<br>do Dia<br><small>06h-18h</small></div>`;

      // Turno noite (18h-00h)
      html += `<div class="coluna turno-noite">`;
      html += `<strong>${qNoite}</strong><br><small>18h-00h</small>`;
      if (hojeFolga) {
        const quemFolgaHoje = qNoite === p1 ? p2 : p1;
        if (quemFolgaHoje === p1) {
          html += `<span class="folga-aviso">Folga: ${p1}</span>`;
        }
      }

      // Seta de saída no sábado (se houver continuidade)
      if (sem === 6) {
        const amanha = new Date(atual);
        amanha.setDate(amanha.getDate() + 1);
        if (amanha <= fim) {
          const proxSem = amanha.getDay();
          const proxFolga = diasFolga.includes(proxSem);
          let proxCiclo = ciclo;
          if (!proxFolga && folgaAnterior) proxCiclo++;
          const proxMadruga = proxFolga ? (proxCiclo % 2 === 0 ? p2 : p1) : p2;
          if (proxMadruga === qNoite) {
            html += `<div class="seta-saida">➔</div>`;
          }
        }
      }

      html += `</div>`;

      html += `</div></div></td>`;

      ultimoNoite = qNoite;

      if (sem === 6) {
        html += '</tr>';
        const proximo = new Date(atual);
        proximo.setDate(proximo.getDate() + 1);
        if (proximo <= fim) {
          html += '<tr>';
        }
      }

      atual.setDate(atual.getDate() + 1);
    }

    html += '</tbody></table>';
    this.tabelaHTML = html;
  }

  imprimir() {
    window.print();
  }

  exportarImagem() {
    const element = document.querySelector('.tabela-escala') as HTMLElement;
    if (!element) return;
    html2canvas(element, { scale: 3, useCORS: true }).then((canvas) => {
      const link = document.createElement('a');
      link.download = 'escala-equipe.webp';
      link.href = canvas.toDataURL('image/webp', 1.0);
      link.click();
    });
  }

  voltar() {
    this.onVoltar.emit();
  }
}
