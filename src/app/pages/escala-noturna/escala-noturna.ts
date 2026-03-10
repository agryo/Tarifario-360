import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewEncapsulation,
  LOCALE_ID,
} from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';

// Services
import { EscalaService, EscalaConfig } from '../../services/escala';
import { DateUtils } from '../../utils/date-utils';
import { ImpressaoService } from '../../utils/impressao-service';

// Model impressão
import { ImpressaoEscalaCSS } from './impressao-styles';

registerLocaleData(localePt);

@Component({
  selector: 'app-escala-noturna',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DatePicker],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './escala-noturna.html',
  styleUrls: ['./escala-noturna.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EscalaNoturnaComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>();

  escalaConfig!: EscalaConfig;
  dataInicio: Date = DateUtils.hoje();
  dataFim: Date = DateUtils.adicionarDias(DateUtils.hoje(), 41);
  tabelaHTML: string = '';

  constructor(
    private escalaService: EscalaService,
    private impressaoService: ImpressaoService,
  ) {}

  ngOnInit() {
    this.escalaConfig = this.escalaService.getConfiguracao();
    this.ajustarDatasParaSemanaCompleta();
    this.gerarEscala();
  }

  // Ajusta a data de início para o domingo anterior e a data de fim para o sábado posterior
  private ajustarDatasParaSemanaCompleta() {
    // Ajusta dataInicio para o domingo da semana
    this.dataInicio = DateUtils.ajustarParaDomingo(this.dataInicio);

    // Calcula o sábado mínimo (domingo + 6)
    const sabadoMinimo = DateUtils.adicionarDias(this.dataInicio, 6);

    // Se dataFim for menor que o sábado mínimo, ajusta para ele
    if (this.dataFim < sabadoMinimo) {
      this.dataFim = sabadoMinimo;
    } else {
      // Garante que dataFim seja um sábado
      this.dataFim = DateUtils.ajustarParaSabado(this.dataFim);
    }
  }

  onDataChange() {
    this.ajustarDatasParaSemanaCompleta();
    this.gerarEscala();
  }

  gerarEscala() {
    if (!this.escalaConfig) return;

    const p1 = this.escalaConfig.p1 || 'P1';
    const p2 = this.escalaConfig.p2 || 'P2';
    const diasFolga = this.escalaConfig.folgas;
    const quemFolgaPrimeiro = this.escalaConfig.quemFolgaPrimeiro;
    const dataInicioFolgas = new Date(this.escalaConfig.dataInicioFolgas);

    const inicio = new Date(this.dataInicio);
    const fim = new Date(this.dataFim);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(0, 0, 0, 0);

    // Calcular o número de semanas desde a data de início das folgas
    const diffTime = inicio.getTime() - dataInicioFolgas.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    let cicloInicial = diffWeeks % 2;
    if (quemFolgaPrimeiro === 'p2') {
      cicloInicial = (cicloInicial + 1) % 2;
    }

    let html = '<table><thead><tr>';
    const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    diasNomes.forEach((nome, i) => {
      const classe = diasFolga.includes(i) ? 'color-folga' : `color-${i}`;
      html += `<th class="${classe}">${nome}</th>`;
    });
    html += '</tr></thead><tbody><tr>';

    let atual = new Date(inicio);
    let ciclo = cicloInicial;
    let folgaAnterior = false;
    let ultimoNoite = '';

    while (atual <= fim) {
      const sem = atual.getDay();
      const hojeFolga = diasFolga.includes(sem);

      if (!hojeFolga && folgaAnterior) ciclo = (ciclo + 1) % 2;
      folgaAnterior = hojeFolga;

      const qNoite = hojeFolga ? (ciclo === 0 ? p2 : p1) : p1;
      const qMadruga = hojeFolga ? (ciclo === 0 ? p2 : p1) : p2;

      const diaMes = `${atual.getDate().toString().padStart(2, '0')}/${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][atual.getMonth()]}`;

      html += `<td class="${hojeFolga ? 'color-folga' : `color-${sem}`}"><div class="cell-wrapper">`;
      html += `<span class="data-label ${hojeFolga ? 'color-folga' : `color-${sem}`}">${diaMes}</span>`;
      html += `<div class="dia-container">`;

      // Turno madruga
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

      // Turno dia
      html += `<div class="coluna equipe-dia">Equipe<br>do Dia<br><small>06h-18h</small></div>`;

      // Turno noite
      html += `<div class="coluna turno-noite">`;
      html += `<strong>${qNoite}</strong><br><small>18h-00h</small>`;
      if (hojeFolga) {
        const quemFolgaHoje = qNoite === p1 ? p2 : p1;
        if (quemFolgaHoje === p1) {
          html += `<span class="folga-aviso">Folga: ${p1}</span>`;
        }
      }
      if (sem === 6) {
        const amanha = new Date(atual);
        amanha.setDate(amanha.getDate() + 1);
        if (amanha <= fim) {
          const proxSem = amanha.getDay();
          const proxFolga = diasFolga.includes(proxSem);
          let proxCiclo = ciclo;
          if (!proxFolga && folgaAnterior) proxCiclo = (proxCiclo + 1) % 2;
          const proxMadruga = proxFolga ? (proxCiclo === 0 ? p2 : p1) : p2;
          if (proxMadruga === qNoite) {
            html += `<div class="seta-saida">➔</div>`;
          }
        }
      }
      html += `</div>`;

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
    const elemento = document.querySelector('.tabela-area') as HTMLElement;
    console.log('Elemento para impressão:', elemento);
    console.log('Conteúdo:', elemento?.innerHTML);
    if (elemento) {
      this.impressaoService.imprimirElemento(elemento, 'Escala Noturna', ImpressaoEscalaCSS);
    } else {
      this.onMensagem.emit({
        severity: 'error',
        summary: 'Erro',
        detail: 'Tabela não encontrada para impressão.',
      });
    }
  }

  exportarImagem() {
    const element = document.querySelector('.tabela-area') as HTMLElement;
    if (!element) {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Tabela não encontrada para gerar imagem.',
      });
      return;
    }

    // Salva o estilo original
    const originalOverflow = element.style.overflowX;
    element.style.overflowX = 'visible';
    // Opcional: define uma largura fixa para evitar cortes
    element.style.width = '1500px';

    this.onMensagem.emit({ severity: 'info', summary: 'Processando', detail: 'Gerando imagem...' });

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: true, // ative para depuração
      allowTaint: false,
      imageTimeout: 15000,
    })
      .then((canvas) => {
        // Restaura
        element.style.overflowX = originalOverflow;
        element.style.width = ''; // remove largura fixa

        const webpDataUrl = canvas.toDataURL('image/webp', 0.95);
        const link = document.createElement('a');
        link.download = `escala-equipe-${new Date().toISOString().split('T')[0]}.webp`;
        link.href = webpDataUrl;
        link.click();
        this.onMensagem.emit({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Imagem WEBP gerada com sucesso!',
        });
      })
      .catch((error) => {
        element.style.overflowX = originalOverflow;
        element.style.width = '';
        console.error('Erro ao gerar imagem:', error);
        this.onMensagem.emit({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao gerar imagem. Verifique o console.',
        });
      });
  }

  voltar() {
    this.onVoltar.emit();
  }
}
