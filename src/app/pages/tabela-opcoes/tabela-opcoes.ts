import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { TarifaService } from '../../services/tarifa';

// Registra a localização pt-BR
registerLocaleData(localePt);

interface CategoriaComSelecao {
  id: string;
  nome: string;
  descricao?: string;
  capacidadeMaxima: number;
  camasCasal: number;
  camasSolteiro: number;
  precoAltaCafe: number;
  precoAltaSemCafe: number;
  precoBaixaCafe: number;
  precoBaixaSemCafe: number;
  comodidadesSelecionadas?: string[];
  grupo: 'solteiro' | 'casal';
  selecionado: boolean;
}

@Component({
  selector: 'app-tabela-opcoes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    TooltipModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './tabela-opcoes.html',
  styleUrls: ['./tabela-opcoes.scss'],
})
export class TabelaOpcoesComponent implements OnInit {
  @Output() onMensagem = new EventEmitter<{ severity: string; summary: string; detail: string }>();
  @Output() onVoltar = new EventEmitter<void>();

  categorias: CategoriaComSelecao[] = [];
  config: any = {};

  dataCheckin: Date = new Date();
  dataCheckout: Date = new Date(new Date().setDate(new Date().getDate() + 1));
  temporada: 'auto' | 'baixa' | 'alta' = 'auto';
  hoje: Date = new Date();

  textoPrevia: string = '';

  constructor(private tarifaService: TarifaService) {}

  ngOnInit() {
    this.carregarDados();
    this.gerar();
  }

  carregarDados() {
    this.config = this.tarifaService.getConfiguracao();
    const cats = this.tarifaService.getCategorias();
    this.categorias = cats.map((cat) => ({
      ...cat,
      // Garantir valores padrão para campos obrigatórios
      camasCasal: cat.camasCasal ?? 0,
      camasSolteiro: cat.camasSolteiro ?? 0,
      grupo: this.inferirGrupo(cat),
      selecionado: false,
    }));
  }

  private inferirGrupo(cat: any): 'solteiro' | 'casal' {
    // Se tiver grupo explícito no modelo (caso exista)
    if (cat.grupo) return cat.grupo;

    // Verifica se tem tipo de ocupação padrão definido (mapeando para grupo)
    if (cat.tipoOcupacaoPadrao === 'solteiro') return 'solteiro';
    if (cat.tipoOcupacaoPadrao === 'casal') return 'casal';

    // Se a capacidade for 1, força como solteiro (mesmo com cama de casal)
    if (cat.capacidadeMaxima === 1) return 'solteiro';

    const camasCasal = cat.camasCasal ?? 0;
    const camasSolteiro = cat.camasSolteiro ?? 0;
    // Regras de inferência (baseadas no JS antigo)
    if (camasSolteiro >= 3 && camasCasal === 0) return 'solteiro';
    if (camasCasal >= 1 && camasSolteiro >= 1) return 'casal';
    if (camasCasal > 0) return 'casal';
    return 'solteiro';
  }

  // Getters para filtrar por grupo
  get categoriasSolteiro() {
    return this.categorias.filter((c) => c.grupo === 'solteiro');
  }
  get categoriasCasal() {
    return this.categorias.filter((c) => c.grupo === 'casal');
  }

  toggleGrupo(grupo: 'solteiro' | 'casal') {
    const grupoCats = this.categorias.filter((c) => c.grupo === grupo);
    const todosSelecionados = grupoCats.every((c) => c.selecionado);
    grupoCats.forEach((c) => (c.selecionado = !todosSelecionados));
    this.gerar();
  }

  gerar() {
    const selecionados = this.categorias.filter((c) => c.selecionado);
    if (selecionados.length === 0) {
      this.textoPrevia = 'Selecione as acomodações...';
      return;
    }

    const noites = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    const d1 = this.dataCheckin;
    const d2 = this.dataCheckout;

    let texto = `*ORÇAMENTO DE HOSPEDAGEM*\n\n`;
    texto += `🏨 *Hotel Plaza - Cruzeta/RN*\n\n`;
    texto += `📅 *Período:* ${d1.toLocaleDateString('pt-BR')} a ${d2.toLocaleDateString('pt-BR')}\n`;
    texto += `🌙 *Duração:* ${noites} diária(s)\n\n--- *OPÇÕES DE ACOMODAÇÃO* ---\n`;

    const resultados: { nome: string; com: number; sem: number }[] = [];

    selecionados.forEach((cat) => {
      const { somaCom, somaSem, isMisto } = this.calcularTotaisCategoria(cat, d1, d2, noites);
      resultados.push({ nome: cat.nome, com: somaCom, sem: somaSem });

      const diariaMediaCom = somaCom / noites;
      const diariaMediaSem = somaSem / noites;
      const capacidadeTexto =
        cat.grupo === 'solteiro' && cat.capacidadeMaxima === 1
          ? 'Apenas 1 pessoa'
          : `Até ${cat.capacidadeMaxima} pessoas`;

      const txtDiariaCom =
        diariaMediaCom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) +
        (isMisto ? ' (média)' : '');
      const txtDiariaSem =
        diariaMediaSem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) +
        (isMisto ? ' (média)' : '');

      texto += `\n🟢 *${cat.nome.toUpperCase()}*\n`;
      if (cat.descricao) texto += `_${cat.descricao}_\n`;
      texto += `🛏️ ${this.formatarCamas(cat)}\n`;
      texto += `👤 Capacidade: ${capacidadeTexto}\n`;
      texto += `💰 Diária: ${txtDiariaCom} ☕ Com Café ou ${txtDiariaSem} ❌ Sem Café\n`;
      texto += `☕ *Total com café:* ${somaCom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
      texto += `🍽️ *Total sem café:* ${somaSem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    });

    // Comodidades comuns
    const comuns = this.comodidadesComuns(selecionados);
    texto += `\n----------------------------------\n`;
    if (comuns.length > 0) {
      texto += `✅ *Todas as opções acima possuem:* ${comuns.join(', ')}.\n\n`;
    }

    // Horários
    texto += this.formatarHorarios();

    // Promoção
    texto += this.aplicarPromocao(selecionados, resultados, noites, d1, d2);

    texto += `\n⚠️ _Valores sujeitos a disponibilidade no ato da reserva._\n\nDeseja garantir sua reserva?`;

    this.textoPrevia = texto;
  }

  private calcularTotaisCategoria(
    cat: CategoriaComSelecao,
    d1: Date,
    d2: Date,
    noites: number,
  ): { somaCom: number; somaSem: number; isMisto: boolean } {
    if (this.temporada !== 'auto') {
      const base =
        this.temporada === 'alta'
          ? [cat.precoAltaCafe, cat.precoAltaSemCafe]
          : [cat.precoBaixaCafe, cat.precoBaixaSemCafe];
      return { somaCom: base[0] * noites, somaSem: base[1] * noites, isMisto: false };
    }

    // Cálculo dia a dia
    let somaCom = 0,
      somaSem = 0;
    let diasAlta = 0;
    let diasBaixa = 0;
    const current = new Date(d1);
    current.setHours(0, 0, 0, 0);
    const end = new Date(d2);
    end.setHours(0, 0, 0, 0);

    while (current < end) {
      const isAlta = this.isAltaTemporada(current);
      if (isAlta) {
        diasAlta++;
        somaCom += cat.precoAltaCafe;
        somaSem += cat.precoAltaSemCafe;
      } else {
        diasBaixa++;
        somaCom += cat.precoBaixaCafe;
        somaSem += cat.precoBaixaSemCafe;
      }
      current.setDate(current.getDate() + 1);
    }
    return { somaCom, somaSem, isMisto: diasAlta > 0 && diasBaixa > 0 };
  }

  private isAltaTemporada(data: Date): boolean {
    if (!this.config.altaInicio || !this.config.altaFim) return false;
    const inicio = new Date(this.config.altaInicio);
    const fim = new Date(this.config.altaFim);
    return data >= inicio && data <= fim;
  }

  private calcularNoites(checkin: Date, checkout: Date): number {
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private formatarCamas(cat: CategoriaComSelecao): string {
    const partes: string[] = [];
    if (cat.camasCasal && cat.camasCasal > 0) {
      partes.push(`${cat.camasCasal} Cama${cat.camasCasal > 1 ? 's' : ''} Casal`);
    }
    if (cat.camasSolteiro && cat.camasSolteiro > 0) {
      partes.push(`${cat.camasSolteiro} Cama${cat.camasSolteiro > 1 ? 's' : ''} Solteiro`);
    }
    return partes.join(' + ') || 'Configuração sob consulta';
  }

  private comodidadesComuns(selecionados: CategoriaComSelecao[]): string[] {
    if (selecionados.length === 0) return [];
    const comodidadesList = selecionados
      .map((c) => c.comodidadesSelecionadas || [])
      .filter((list) => list.length > 0);
    if (comodidadesList.length === 0) return [];
    return comodidadesList.reduce((acc, curr) => acc.filter((c) => curr.includes(c)));
  }

  private formatarHorarios(): string {
    const horarios = [];
    if (this.config.cafeAtivo)
      horarios.push(`*- Café da manhã:* ${this.config.cafeInicio} às ${this.config.cafeFim}`);
    if (this.config.almocoAtivo)
      horarios.push(
        `*- Almoço:* ${this.config.almocoInicio} às ${this.config.almocoFim} (opcional)`,
      );
    if (this.config.jantarAtivo)
      horarios.push(
        `*- Lanche à Noite:* ${this.config.jantarInicio} às ${this.config.jantarFim} (opcional)`,
      );
    if (horarios.length === 0) return '';
    return `⏰ *Horários das Refeições:*\n${horarios.join('\n')}\n\n`;
  }

  private aplicarPromocao(
    selecionados: CategoriaComSelecao[],
    resultados: { nome: string; com: number; sem: number }[],
    noites: number,
    d1: Date,
    d2: Date,
  ): string {
    if (!this.config.promocaoAtiva) return '';

    const {
      promocaoDesconto,
      promocaoMinDiarias,
      promocaoTexto,
      promocaoSomenteAlta,
      promocaoMsgBaixa,
    } = this.config;
    let aplicarPromo = true;
    let exibirApenasMsg = false;

    if (promocaoSomenteAlta) {
      let temAlta = false;
      if (this.temporada === 'alta') temAlta = true;
      else if (this.temporada === 'baixa') temAlta = false;
      else {
        // auto: verificar se há dias de alta
        const current = new Date(d1);
        current.setHours(0, 0, 0, 0);
        const end = new Date(d2);
        end.setHours(0, 0, 0, 0);
        while (current < end) {
          if (this.isAltaTemporada(current)) {
            temAlta = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }
      }
      if (!temAlta) {
        aplicarPromo = false;
        if (promocaoMsgBaixa) exibirApenasMsg = true;
      }
    }

    if (aplicarPromo) {
      if (noites >= promocaoMinDiarias) {
        let texto = `🔥 *PROMOÇÃO ESPECIAL ATIVA:*\nGanhe *${promocaoDesconto}% de desconto* para ${promocaoTexto}!\n👇 *Valores com desconto aplicado:*\n`;
        resultados.forEach((res) => {
          const finalCom = res.com * (1 - promocaoDesconto / 100);
          const finalSem = res.sem * (1 - promocaoDesconto / 100);
          texto += `🔹 *${res.nome}*\n`;
          texto += `   ✅ C/ Café: *${finalCom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n`;
          texto += `   ❌ S/ Café: *${finalSem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n`;
        });
        return texto + '\n';
      } else {
        return `🔥 *PROMOÇÃO ESPECIAL:* Reserve *${promocaoMinDiarias} diárias* ou mais e ganhe *${promocaoDesconto}% de desconto* para ${promocaoTexto}!\n\n`;
      }
    } else if (exibirApenasMsg) {
      return `🔥 *PROMOÇÃO ESPECIAL:* Ganhe *${promocaoDesconto}% de desconto* para ${promocaoTexto} (Consulte condições para alta temporada)!\n\n`;
    }
    return '';
  }

  copiarTexto() {
    if (!this.textoPrevia || this.textoPrevia === 'Selecione as acomodações...') {
      this.onMensagem.emit({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nenhuma opção selecionada.',
      });
      return;
    }
    navigator.clipboard.writeText(this.textoPrevia).then(() => {
      this.onMensagem.emit({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Tabela copiada para a área de transferência.',
      });
    });
  }

  voltar() {
    this.onVoltar.emit();
  }
}
