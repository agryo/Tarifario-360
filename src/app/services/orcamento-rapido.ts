import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { TarifaService } from './tarifa';
import { OrcamentoRapido, OrcamentoRapidoRequest } from '../models/orcamento-rapido.model';

@Injectable({
  providedIn: 'root',
})
export class OrcamentoRapidoService {
  private readonly STORAGE_KEY = 'orcamentos_rapidos';

  constructor(
    private storage: StorageService,
    private tarifaService: TarifaService,
  ) {}

  gerarOrcamento(request: OrcamentoRapidoRequest): OrcamentoRapido {
    const categoria = this.tarifaService.getCategoria(request.categoriaId);
    if (!categoria) throw new Error('Categoria não encontrada');

    const numeroNoites = this.calcularNoites(request.dataCheckin, request.dataCheckout);
    const config = this.tarifaService.getConfiguracao();

    // Calcular preço por noite considerando temporada
    let diasAlta = 0;
    let diasBaixa = 0;
    let somaComCafe = 0;
    let somaSemCafe = 0;

    const dataAtual = new Date(request.dataCheckin);
    const dataFim = new Date(request.dataCheckout);

    while (dataAtual < dataFim) {
      const isAlta = this.isAltaTemporada(dataAtual, config.altaInicio, config.altaFim);
      if (isAlta) {
        diasAlta++;
        somaComCafe += categoria.precoAltaCafe;
        somaSemCafe += categoria.precoAltaSemCafe;
      } else {
        diasBaixa++;
        somaComCafe += categoria.precoBaixaCafe;
        somaSemCafe += categoria.precoBaixaSemCafe;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    const tipoTemporada = diasAlta > 0 && diasBaixa > 0 ? 'misto' : diasAlta > 0 ? 'alta' : 'baixa';
    const valorTotalComCafe = somaComCafe * request.quantidade;
    const valorTotalSemCafe = somaSemCafe * request.quantidade;

    // Aplicar promoção se ativa
    let valorFinalComCafe = valorTotalComCafe;
    let valorFinalSemCafe = valorTotalSemCafe;
    let textoPromocao = '';

    if (config.promocaoAtiva) {
      const elegivel = numeroNoites >= config.promocaoMinDiarias;
      const isAltaPeriodo = diasAlta > 0; // período tem pelo menos um dia de alta

      if (config.promocaoSomenteAlta && !isAltaPeriodo) {
        // Não aplica desconto, mas pode exibir mensagem
        if (config.promocaoMsgBaixa) {
          textoPromocao = `*Promoção:* ${config.promocaoTexto} (válida apenas na alta temporada)`;
        }
      } else if (elegivel) {
        const desconto = config.promocaoDesconto / 100;
        valorFinalComCafe = valorTotalComCafe * (1 - desconto);
        valorFinalSemCafe = valorTotalSemCafe * (1 - desconto);
        textoPromocao = `*Promoção:* ${config.promocaoDesconto}% de desconto - ${config.promocaoTexto}`;
      } else {
        textoPromocao = `*Promoção:* A partir de ${config.promocaoMinDiarias} diárias, ${config.promocaoDesconto}% de desconto - ${config.promocaoTexto}`;
      }
    }

    const textoWhatsApp = this.gerarTextoWhatsApp(categoria, {
      request,
      numeroNoites,
      diasAlta,
      diasBaixa,
      tipoTemporada,
      valorTotalComCafe,
      valorTotalSemCafe,
      valorFinalComCafe,
      valorFinalSemCafe,
      textoPromocao,
      config,
    });

    const orcamento: OrcamentoRapido = {
      id: this.storage.generateId(),
      dataGeracao: new Date(),
      categoriaId: request.categoriaId,
      dataCheckin: request.dataCheckin,
      dataCheckout: request.dataCheckout,
      numeroNoites,
      quantidade: request.quantidade,
      valorDiaria: (somaComCafe / numeroNoites) * request.quantidade, // média por noite
      tipoTemporada,
      valorTotal: request.incluirCafe ? valorFinalComCafe : valorFinalSemCafe,
      textoWhatsApp,
    };

    this.salvarHistorico(orcamento);
    return orcamento;
  }

  private isAltaTemporada(data: Date, altaInicio: string, altaFim: string): boolean {
    if (!altaInicio || !altaFim) return false; // se não configurado, assume baixa
    const inicio = new Date(altaInicio);
    const fim = new Date(altaFim);
    return data >= inicio && data <= fim;
  }

  private calcularNoites(checkin: Date, checkout: Date): number {
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private gerarTextoWhatsApp(categoria: any, dados: any): string {
    const {
      request,
      numeroNoites,
      diasAlta,
      diasBaixa,
      tipoTemporada,
      valorTotalComCafe,
      valorTotalSemCafe,
      valorFinalComCafe,
      valorFinalSemCafe,
      textoPromocao,
      config,
    } = dados;

    const formatarMoeda = (valor: number) =>
      valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let texto = `🏨 *Hotel Plaza - Cruzeta/RN*\n`;
    texto += `🎊 *Orçamento para ${config.festividade}*\n\n`;
    texto += `🛌 *Acomodação:* ${categoria.nome}\n`;
    if (categoria.descricao) texto += `✨ _${categoria.descricao}_\n`;

    // Configuração de camas
    const camas: string[] = [];
    if (categoria.camasCasal) camas.push(`${categoria.camasCasal} Cama de Casal`);
    if (categoria.camasSolteiro) camas.push(`${categoria.camasSolteiro} Cama de Solteiro`);
    texto += `🛏️ *Configuração:* ${camas.join(' e ') || 'Sob consulta'}\n`;

    const capacidadeTexto =
      categoria.capacidadeMaxima === 1
        ? 'Apenas 1 pessoa'
        : `Até ${categoria.capacidadeMaxima} pessoas`;
    texto += `👤 *Capacidade:* ${capacidadeTexto}\n`;

    if (categoria.comodidadesSelecionadas?.length) {
      texto += `✅ *Itens inclusos:* ${categoria.comodidadesSelecionadas.join(', ')}\n\n`;
    } else {
      texto += `\n`;
    }

    texto += `📅 *Check-in:* ${request.dataCheckin.toLocaleDateString('pt-BR')}\n`;
    texto += `📅 *Check-out:* ${request.dataCheckout.toLocaleDateString('pt-BR')}\n`;
    texto += `🌙 *Duração:* ${numeroNoites} diária(s)\n`;
    texto += `📦 *Quantidade:* ${request.quantidade} unidade(s)\n\n`;

    texto += `💰 *Valores:*\n`;
    if (tipoTemporada === 'misto') {
      texto += `   ${diasAlta} dia(s) em alta, ${diasBaixa} dia(s) em baixa\n`;
    }

    if (textoPromocao) {
      texto += `🔥 ${textoPromocao}\n`;
    }

    texto += `\n`;
    texto += `*COM CAFÉ DA MANHÃ:* ${formatarMoeda(valorFinalComCafe)}`;
    if (valorFinalComCafe !== valorTotalComCafe) {
      texto += ` (de ${formatarMoeda(valorTotalComCafe)})`;
    }
    texto += `\n`;
    texto += `*SEM CAFÉ DA MANHÃ:* ${formatarMoeda(valorFinalSemCafe)}`;
    if (valorFinalSemCafe !== valorTotalSemCafe) {
      texto += ` (de ${formatarMoeda(valorTotalSemCafe)})`;
    }
    texto += `\n\n`;

    texto += `📥 *Check-in:* a partir das 14h\n`;
    texto += `📤 *Check-out:* até as 11h\n\n`;

    // Horários das refeições
    const horarios = [];
    if (config.cafeAtivo) horarios.push(`Café: ${config.cafeInicio} às ${config.cafeFim}`);
    if (config.almocoAtivo) horarios.push(`Almoço: ${config.almocoInicio} às ${config.almocoFim}`);
    if (config.jantarAtivo)
      horarios.push(`Lanche noturno: ${config.jantarInicio} às ${config.jantarFim}`);
    if (horarios.length) {
      texto += `⏰ *Horários:*\n${horarios.map((h) => `- ${h}`).join('\n')}\n\n`;
    }

    texto += `⚠️ _Valores sujeitos a disponibilidade no ato da reserva._\n`;
    texto += `*Deseja garantir sua reserva?*`;

    return texto;
  }

  private salvarHistorico(orcamento: OrcamentoRapido): void {
    const historico = this.getHistorico();
    historico.unshift(orcamento);
    if (historico.length > 50) historico.pop();
    this.storage.set(this.STORAGE_KEY, historico);
  }

  getHistorico(): OrcamentoRapido[] {
    return this.storage.get<OrcamentoRapido[]>(this.STORAGE_KEY) || [];
  }
}
