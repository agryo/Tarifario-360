import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { TarifaService } from './tarifa';
import {
  OrcamentoRapido,
  OrcamentoRapidoRequest,
  OrcamentoRapidoResultado,
} from '../models/orcamento-rapido.model';
import { DadosGeracaoTexto } from '../models/dados-geracao-texto.model';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { MensagemUtils } from '../utils/mensagem-utils';

@Injectable({
  providedIn: 'root',
})
export class OrcamentoRapidoService {
  private readonly STORAGE_KEY = 'orcamentos_rapidos';

  constructor(
    private storage: StorageService,
    private tarifaService: TarifaService,
  ) {}

  gerarOrcamento(request: OrcamentoRapidoRequest): OrcamentoRapidoResultado {
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
      const isAlta = this.isAltaTemporada(
        dataAtual,
        config.temporada.altaInicio,
        config.temporada.altaFim,
      );
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

    if (config.promocao.ativa) {
      const promoMin = config.promocao.minDiarias;
      const promoPct = config.promocao.desconto;
      const promoTxt = config.promocao.texto;
      const promoSomenteAlta = config.promocao.somenteAlta;
      const promoMsgBaixa = config.promocao.msgBaixa;

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
    };

    // this.salvarHistorico(orcamento);
    return { orcamento, textoWhatsApp };
  }

  private isAltaTemporada(data: Date, altaInicio: string, altaFim: string): boolean {
    if (!altaInicio || !altaFim) return false;
    const inicio = new Date(altaInicio);
    const fim = new Date(altaFim);
    return data >= inicio && data <= fim;
  }

  private calcularNoites(checkin: Date, checkout: Date): number {
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private gerarTextoWhatsApp(categoria: CategoriaQuarto, dados: DadosGeracaoTexto): string {
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
    let texto = `Olá! Segue o orçamento para *${config.festividade}*:\n\n`;
    texto += `🏨 *Hotel Plaza - Cruzeta/RN*\n\n`;
    texto += `🛌 *Acomodação:* ${categoria.nome}\n`;
    if (categoria.descricao) texto += `✨ _${categoria.descricao}_\n`;

    // Itens inclusos
    if (categoria.comodidadesSelecionadas?.length) {
      texto += `✅ *Itens inclusos:* ${categoria.comodidadesSelecionadas.join(', ')}.\n\n`;
    } else {
      texto += `\n`;
    }

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
      (categoria.camasCasal ?? 0) === 0 &&
      (categoria.camasSolteiro ?? 0) > 0 &&
      categoria.capacidadeMaxima === 1
    ) {
      capacidadeExibida = 1;
    }
    const capacidadeTexto =
      capacidadeExibida === 1 ? `Apenas 1 pessoa` : `Até ${capacidadeExibida} pessoas`;
    texto += `👤 *Capacidade:* ${capacidadeTexto}\n`;

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

    // Só exibe o valor total do pacote se for mais de uma diária, para evitar redundância.
    if (numeroNoites > 1) {
      texto += `💵 *Total para ${numeroNoites} diárias:*\n`;
      texto += `✅ *Total com café: ${formatarMoeda(valorTotalComCafe)}*\n`;
      texto += `❌ *Total sem café: ${formatarMoeda(valorTotalSemCafe)}*\n\n`;
    }

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
    texto += MensagemUtils.formatarHorariosRefeicoes(config);

    texto += `⚠️ _Valores sujeitos a disponibilidade no ato da reserva._\n\n`;
    texto += `*Deseja garantir sua reserva agora?*`;

    return texto;
  }

  importarDados(historico: OrcamentoRapido[]): void {
    this.storage.set(this.STORAGE_KEY, historico || []);
  }
}
