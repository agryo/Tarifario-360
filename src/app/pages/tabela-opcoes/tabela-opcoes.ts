import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { CategoriaQuarto } from '../../models/categoria-quarto.model';

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
  templateUrl: './tabela-opcoes.html',
  styleUrls: ['./tabela-opcoes.scss'],
})
export class TabelaOpcoesComponent implements OnInit {
  categorias: CategoriaComSelecao[] = [];
  config: ConfiguracaoGeral | null = null;

  dataCheckin: Date = DateUtils.hoje();
  dataCheckout: Date = DateUtils.amanha();
  temporada: 'auto' | 'baixa' | 'alta' = 'auto';
  hoje: Date = DateUtils.hoje();
  carregando = true;

  textoPrevia: string = '';

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.carregarDados();
    this.gerar();
  }

  async carregarDados() {
    this.carregando = true;
    this.config = await this.tarifaService.getConfiguracao();
    const cats = await this.tarifaService.getCategorias();
    this.categorias = cats.map((cat) => ({
      ...cat,
      camasCasal: cat.camasCasal ?? 0,
      camasSolteiro: cat.camasSolteiro ?? 0,
      grupo: this.inferirGrupo(cat),
      selecionado: false,
    }));
    this.carregando = false;
    this.cdr.detectChanges();
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
    return this.categorias
      .filter((c) => c.grupo === 'solteiro')
      .sort((a, b) => this.getOrdenacaoComposta(a) - this.getOrdenacaoComposta(b));
  }
  get categoriasCasal() {
    return this.categorias
      .filter((c) => c.grupo === 'casal')
      .sort((a, b) => this.getOrdenacaoComposta(a) - this.getOrdenacaoComposta(b));
  }

  private getOrdenacaoComposta(cat: CategoriaComSelecao): number {
    if (!this.config) return 0;

    // 1. Preço base (menor primeiro)
    const preco = this.getPrecoBase(cat);

    // 2. Capacidade (menor primeiro) - multiplicamos por 10000 para ter prioridade sobre preço
    const capacidade = cat.capacidadeMaxima * 10000;

    // 3. Tipo de cama: camas de solteiro primeiro (0), camas de casal depois (100000)
    // Se tem camas de solteiro e não tem camas de casal = prioridade 0
    // Se tem camas de casal e não tem camas de solteiro = prioridade 100000
    // Se tem ambos = prioridade 50000 (meio termo)
    let tipoCama = 0;
    const temSolteiro = (cat.camasSolteiro ?? 0) > 0;
    const temCasal = (cat.camasCasal ?? 0) > 0;
    if (temCasal && !temSolteiro) {
      tipoCama = 100000;
    } else if (temCasal && temSolteiro) {
      tipoCama = 50000;
    }
    // Se só tem solteiro, tipoCama = 0 (prioridade máxima)

    return preco + capacidade + tipoCama;
  }

  private getPrecoBase(cat: CategoriaComSelecao): number {
    if (!this.config) return 0;

    // Se temporada fixa, usa o preço da temporada selecionada
    if (this.temporada === 'alta') {
      return cat.precoAltaSemCafe;
    }
    if (this.temporada === 'baixa') {
      return cat.precoBaixaSemCafe;
    }

    // Se 'auto', usa o preço da temporada atual (baseado na data de check-in)
    const checkin = this.dataCheckin || new Date();
    const isAlta = DateUtils.isAltaTemporada(
      checkin,
      this.config.temporada.altaInicio,
      this.config.temporada.altaFim,
    );
    return isAlta ? cat.precoAltaSemCafe : cat.precoBaixaSemCafe;
  }

  toggleGrupo(grupo: 'solteiro' | 'casal') {
    const grupoCats = this.categorias.filter((c) => c.grupo === grupo);
    const todosSelecionados = grupoCats.every((c) => c.selecionado);
    grupoCats.forEach((c) => (c.selecionado = !todosSelecionados));
    this.gerar();
  }

  onCheckinSelect() {
    if (this.dataCheckin) {
      // Comportamento padrão: ao mudar o check-in, sugere check-out para o dia seguinte
      const amanha = new Date(this.dataCheckin);
      amanha.setDate(amanha.getDate() + 1);
      this.dataCheckout = amanha;
    }
    this.onDataChange();
  }

  onDataChange() {
    if (this.dataCheckin && this.dataCheckout) {
      // Só força o ajuste automático se o checkout for ANTES do checkin.
      // Se forem iguais (Day Use), agora é permitido manualmente.
      if (this.dataCheckout < this.dataCheckin) {
        this.dataCheckout = DateUtils.ajustarDataSaida(this.dataCheckin, this.dataCheckout);
      }
    }
    this.gerar();
  }

  gerar() {
    if (!this.config) {
      this.textoPrevia = 'Carregando configuração...';
      return;
    }

    const selecionados = this.categorias.filter((c) => c.selecionado);
    if (selecionados.length === 0) {
      this.textoPrevia = 'Selecione as acomodações...';
      return;
    }

    const noitesReais = this.calcularNoites(this.dataCheckin, this.dataCheckout);
    // Se for o mesmo dia, consideramos como 1 diária para fins de cobrança
    const isDayUse = noitesReais === 0 && !!this.dataCheckin && !!this.dataCheckout;
    const noites = isDayUse ? 1 : noitesReais;

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
    texto += `🏨 *Hotel Plaza - Cruzeta/RN*\n`;
    texto += `📅 *Período:* ${d1.toLocaleDateString('pt-BR')} a ${d2.toLocaleDateString('pt-BR')}\n`;
    texto += `🌙 *Duração:* ${isDayUse ? 'Day Use' : noites + ' diária(s)'}\n\n------ *OPÇÕES DE ACOMODAÇÃO* ------\n`;

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

    texto += this.formatarHorariosRefeicoes();
    texto += `📥 *Check-in:* das 14h às 22h.\n`;
    texto += `_OBS.: Após esse horário a recepção fecha. Acesso somente para hóspedes acomodados (descanso e circulação normal)._\n`;
    texto += `📤 *Check-out:* até as 12h.\n\n`;
    texto += `⚠️ _Valores sujeitos a disponibilidade no ato da reserva._\n\nDeseja garantir sua reserva?`;

    this.textoPrevia = texto;
  }

  private formatarHorariosRefeicoes() {
    if (!this.config) return '';
    return MensagemUtils.formatarHorariosRefeicoes(this.config);
  }

  private calcularTotaisCategoria(
    cat: CategoriaComSelecao,
    d1: Date,
    d2: Date,
    noites: number,
  ): { somaCom: number; somaSem: number; isMisto: boolean } {
    if (!this.config) {
      return { somaCom: 0, somaSem: 0, isMisto: false };
    }

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
    // Usamos um loop baseado no número de diárias para garantir que Day Use (1 diária) funcione
    for (let i = 0; i < noites; i++) {
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
    if (!this.config) return '';

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
