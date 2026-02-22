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

    // ===== LÓGICA DE PROMOÇÃO IGUAL AO JS ORIGINAL =====
    let textoPromocao = '';
    let valorFinalComCafe = valorTotalComCafe;
    let valorFinalSemCafe = valorTotalSemCafe;

    if (config.promocaoAtiva) {
      const promoMin = config.promocaoMinDiarias;
      const promoPct = config.promocaoDesconto;
      const promoTxt = config.promocaoTexto;
      const promoSomenteAlta = config.promocaoSomenteAlta;
      const promoMsgBaixa = config.promocaoMsgBaixa;

      let aplicarPromo = true;
      let exibirApenasMsg = false;

      if (promoSomenteAlta) {
        if (diasAlta === 0) {
          aplicarPromo = false;
          if (promoMsgBaixa) exibirApenasMsg = true;
        }
      }

      if (aplicarPromo) {
        if (numeroNoites >= promoMin) {
          const desconto = promoPct / 100;
          valorFinalComCafe = valorTotalComCafe * (1 - desconto);
          valorFinalSemCafe = valorTotalSemCafe * (1 - desconto);
          textoPromocao = `🔥 *PROMOÇÃO ESPECIAL ATIVA:*\nGanhe *${promoPct}% de desconto* para ${promoTxt}!\n👇 *Valores com desconto aplicado:*`;
        } else {
          textoPromocao = `🔥 *PROMOÇÃO ESPECIAL:* Reserve *${promoMin} diárias* ou mais e ganhe *${promoPct}% de desconto* para ${promoTxt}!`;
        }
      } else if (exibirApenasMsg) {
        textoPromocao = `🔥 *PROMOÇÃO ESPECIAL:* Ganhe *${promoPct}% de desconto* para ${promoTxt} (Consulte condições para alta temporada)!`;
      }
    }
    // ===================================================

    const textoWhatsApp = this.gerarTextoWhatsApp(categoria, {
      request,
      numeroNoites,
      diasAlta,
      diasBaixa,
      tipoTemporada,
      somaComCafe,
      somaSemCafe,
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
      somaComCafe,
      somaSemCafe,
      valorTotalComCafe,
      valorTotalSemCafe,
      valorFinalComCafe,
      valorFinalSemCafe,
      textoPromocao,
      config,
    } = dados;

    const formatarMoeda = (valor: number) =>
      valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ===== TEXTO IGUAL AO JS ORIGINAL =====
    let texto = `Olá! Segue orçamento para o *${config.festividade}*:\n\n`;
    texto += `🏨 *Hotel Plaza - Cruzeta/RN*\n`;
    texto += `🛌 *Acomodação:* ${categoria.nome}\n`;
    if (categoria.descricao) texto += `✨ _${categoria.descricao}_\n`;

    // Configuração de camas (igual ao JS)
    const camas: string[] = [];
    if (categoria.camasCasal && categoria.camasCasal > 0) {
      camas.push(`${categoria.camasCasal} Cama${categoria.camasCasal > 1 ? 's' : ''} Casal`);
    }
    if (categoria.camasSolteiro && categoria.camasSolteiro > 0) {
      camas.push(
        `${categoria.camasSolteiro} Cama${categoria.camasSolteiro > 1 ? 's' : ''} Solteiro`,
      );
    }
    texto += `🛏️ *Configuração:* ${camas.join(' + ') || 'Sob consulta'}\n`;

    // Capacidade (lógica do JS: se grupo solteiro, exibe 1 pessoa; senão, usa capacidadeMaxima)
    // No JS antigo, usava q.grupo === "solteiro" ? 1 : q.cap
    // Vamos manter isso: se não tiver grupo, inferimos pelo número de camas?
    // Por simplicidade, usaremos a capacidadeMaxima mesmo, mas tentaremos replicar a lógica.
    let capacidadeExibida = categoria.capacidadeMaxima;
    // Se for uma categoria claramente de solteiro (camasSolteiro > 0 e camasCasal === 0) e capacidade 1?
    if (
      categoria.camasCasal === 0 &&
      categoria.camasSolteiro > 0 &&
      categoria.capacidadeMaxima === 1
    ) {
      capacidadeExibida = 1;
    }
    const capacidadeTexto =
      capacidadeExibida === 1 ? `Apenas 1 pessoa` : `Até ${capacidadeExibida} pessoas`;
    texto += `👤 *Capacidade:* ${capacidadeTexto}\n`;

    // Itens inclusos
    if (categoria.comodidadesSelecionadas?.length) {
      texto += `✅ *Itens inclusos:* ${categoria.comodidadesSelecionadas.join(', ')}.\n\n`;
    } else {
      texto += `\n`;
    }

    // Período (usando toLocaleDateString pt-BR)
    texto += `📅 *Período:* ${request.dataCheckin.toLocaleDateString('pt-BR')} a ${request.dataCheckout.toLocaleDateString('pt-BR')}\n`;
    texto += `🌙 *Duração:* ${numeroNoites} diária(s)\n\n`;

    // Valor da diária
    const mediaCom = somaComCafe / numeroNoites;
    const mediaSem = somaSemCafe / numeroNoites;
    let txtDiariaCom, txtDiariaSem;
    if (tipoTemporada === 'misto') {
      txtDiariaCom = `${formatarMoeda(mediaCom)} (média)`;
      txtDiariaSem = `${formatarMoeda(mediaSem)} (média)`;
    } else if (diasAlta > 0) {
      txtDiariaCom = formatarMoeda(categoria.precoAltaCafe);
      txtDiariaSem = formatarMoeda(categoria.precoAltaSemCafe);
    } else {
      txtDiariaCom = formatarMoeda(categoria.precoBaixaCafe);
      txtDiariaSem = formatarMoeda(categoria.precoBaixaSemCafe);
    }

    texto += `💰 *Valor da diária:*\n`;
    texto += `☕ Com café: ${txtDiariaCom}\n`;
    texto += `🍽️ Sem café: ${txtDiariaSem}\n\n`;

    texto += `💵 *VALOR TOTAL DO PACOTE:*\n`;
    texto += `✅ *COM CAFÉ DA MANHÃ: ${formatarMoeda(valorTotalComCafe)}*\n`;
    texto += `❌ *SEM CAFÉ DA MANHÃ: ${formatarMoeda(valorTotalSemCafe)}*\n\n`;

    // Promoção
    if (textoPromocao) {
      texto += textoPromocao;
      if (valorFinalComCafe !== valorTotalComCafe || valorFinalSemCafe !== valorTotalSemCafe) {
        texto += `\n✅ C/ Café: *${formatarMoeda(valorFinalComCafe)}*\n`;
        texto += `❌ S/ Café: *${formatarMoeda(valorFinalSemCafe)}*\n`;
      }
      texto += `\n`;
    }

    texto += `📥 *Check-in:* a partir das 14h\n`;
    texto += `📤 *Check-out:* até as 11h\n\n`;

    // Horários das refeições (igual ao JS)
    const horarios = [];
    if (config.cafeAtivo)
      horarios.push(`*- Café da manhã:* ${config.cafeInicio} às ${config.cafeFim}`);
    if (config.almocoAtivo)
      horarios.push(`*- Almoço:* ${config.almocoInicio} às ${config.almocoFim} (opcional)`);
    if (config.jantarAtivo)
      horarios.push(`*- Lanche à Noite:* ${config.jantarInicio} às ${config.jantarFim} (opcional)`);
    if (horarios.length) {
      texto += `⏰ *Horários das Refeições:*\n${horarios.join('\n')}\n\n`;
    }

    texto += `⚠️ _Valores sujeitos a disponibilidade no ato da reserva._\n\n`;
    texto += `*Deseja garantir sua reserva agora?*`;

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
