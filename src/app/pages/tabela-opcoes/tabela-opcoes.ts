import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { TarifaService } from '../../services/tarifa';
import { DateUtils } from '../../utils/date-utils';
import { ConfiguracaoGeral } from '../../models/tarifa.model';
import { MensagemUtils } from '../../utils/mensagem-utils';

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
  ativo: boolean;
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
  providers: [],
  templateUrl: './tabela-opcoes.html',
  styleUrls: ['./tabela-opcoes.scss'],
})
export class TabelaOpcoesComponent implements OnInit {
  categorias: CategoriaComSelecao[] = [];
  config!: ConfiguracaoGeral;

  dataCheckin: Date = DateUtils.hoje();
  dataCheckout: Date = DateUtils.amanha();
  temporada: 'auto' | 'baixa' | 'alta' = 'auto';
  hoje: Date = DateUtils.hoje();

  textoPrevia: string = '';

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.gerar();
  }

  carregarDados() {
    this.config = this.tarifaService.getConfiguracao();
    const cats = this.tarifaService.getCategorias();
    this.categorias = cats.map((cat) => ({
      ...cat,
      camasCasal: cat.camasCasal ?? 0,
      camasSolteiro: cat.camasSolteiro ?? 0,
      grupo: this.inferirGrupo(cat),
      selecionado: false,
    }));
  }

  private inferirGrupo(cat: any): 'solteiro' | 'casal' {
    if (cat.grupo) return cat.grupo;
    if (cat.tipoOcupacaoPadrao === 'solteiro') return 'solteiro';
    if (cat.tipoOcupacaoPadrao === 'casal') return 'casal';
    if (cat.capacidadeMaxima === 1) return 'solteiro';
    const camasCasal = cat.camasCasal ?? 0;
    const camasSolteiro = cat.camasSolteiro ?? 0;
    if (camasSolteiro >= 3 && camasCasal === 0) return 'solteiro';
    if (camasCasal >= 1 && camasSolteiro >= 1) return 'casal';
    if (camasCasal > 0) return 'casal';
    return 'solteiro';
  }

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

  onDataChange() {
    if (this.dataCheckin && this.dataCheckout) {
      this.dataCheckout = DateUtils.ajustarDataSaida(this.dataCheckin, this.dataCheckout);
    }
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

    // Calcula dias de alta para a lógica da promoção
    const { diasAlta } = DateUtils.contarDiasPorTemporada(
      d1,
      d2,
      this.config.temporada.altaInicio,
      this.config.temporada.altaFim,
    );

    let texto = `*ORÇAMENTO DE HOSPEDAGEM*\n\n`;
    texto += `🏨 *Hotel Plaza - Cruzeta/RN*\n\n`;
    texto += `📅 *Período:* ${d1.toLocaleDateString('pt-BR')} a ${d2.toLocaleDateString('pt-BR')}\n`;
    texto += `🌙 *Duração:* ${noites} diária(s)\n\n------ *OPÇÕES DE ACOMODAÇÃO* ------\n`;

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

      texto += `\n🟢 *${cat.nome.toUpperCase()}*\n`;
      if (cat.descricao) texto += `_${cat.descricao}_\n`;
      texto += `🛏️ ${MensagemUtils.formatarCamas(cat)}\n`;
      texto += `👤 Capacidade: ${capacidadeTexto}\n\n`;
      texto +=
        MensagemUtils.formatarBlocoDePrecos(
          diariaMediaCom,
          diariaMediaSem,
          somaCom,
          somaSem,
          noites,
          isMisto,
        ) + '\n';
      texto += `-------------------------------------------------------------`;
    });

    const comuns = this.comodidadesComuns(selecionados);
    if (comuns.length > 0) {
      texto += `\n✅ *Todas as opções acima possuem:* ${comuns.join(', ')}.\n\n`;
    }

    texto += this.aplicarPromocao(resultados, noites, diasAlta);

    texto += MensagemUtils.formatarHorariosRefeicoes(this.config);
    texto += `\n📥 *Check-in:* das 14h às 22h.\n`;
    texto += `_OBS.: Após esse horário a recepção fecha. Acesso somente para hóspedes acomodados (descanso e circulação normal)._\n`;
    texto += `📤 *Check-out:* até as 12h.\n\n`;
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

    let somaCom = 0,
      somaSem = 0;
    let diasAlta = 0,
      diasBaixa = 0;
    const current = new Date(d1);
    current.setHours(0, 0, 0, 0);
    const end = new Date(d2);
    end.setHours(0, 0, 0, 0);

    while (current < end) {
      const isAlta = DateUtils.isAltaTemporada(
        current,
        this.config.temporada.altaInicio,
        this.config.temporada.altaFim,
      );
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

  private calcularNoites(checkin: Date, checkout: Date): number {
    return DateUtils.calcularDiasEntre(checkin, checkout);
  }

  private comodidadesComuns(selecionados: CategoriaComSelecao[]): string[] {
    if (selecionados.length === 0) return [];
    const comodidadesList = selecionados
      .map((c) => c.comodidadesSelecionadas || [])
      .filter((list) => list.length > 0);
    if (comodidadesList.length === 0) return [];
    return comodidadesList.reduce((acc, curr) => acc.filter((c) => curr.includes(c)));
  }

  private aplicarPromocao(
    resultados: { nome: string; com: number; sem: number }[],
    noites: number,
    diasAlta: number,
  ): string {
    const resultadoPromo = MensagemUtils.processarPromocao(this.config, noites, diasAlta);

    if (!resultadoPromo.texto) return '';

    let texto = resultadoPromo.texto;

    if (resultadoPromo.aplicada) {
      texto += '\n'; // Quebra linha após o cabeçalho
      resultados.forEach((res) => {
        const finalCom = res.com * (1 - resultadoPromo.desconto);
        const finalSem = res.sem * (1 - resultadoPromo.desconto);
        texto += `🟢 *${res.nome}*\n`;
        texto += `   ✅ C/ Café: *${finalCom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n`;
        texto += `   ❌ S/ Café: *${finalSem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n\n`;
      });
      return texto + '\n';
    }

    // Caso apenas mensagem informativa (sem aplicar desconto ou min diarias não atingido)
    return texto + '\n\n';
  }

  copiarTexto() {
    if (!this.textoPrevia || this.textoPrevia === 'Selecione as acomodações...') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nenhuma opção selecionada.',
      });
      return;
    }
    navigator.clipboard.writeText(this.textoPrevia).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Tabela copiada para a área de transferência.',
      });
    });
  }

  voltar() {
    this.router.navigate(['/']);
  }
}
