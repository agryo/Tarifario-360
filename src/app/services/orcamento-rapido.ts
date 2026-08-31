import { Injectable } from '@angular/core';
import { TarifaService } from './tarifa';
import {
  OrcamentoRapidoRequest,
  OrcamentoRapidoResultado,
  ResultadoCategoriaOrcamento,
} from '../models/orcamento-rapido.model';
import { DadosGeracaoTexto } from '../models/dados-geracao-texto.model';
import { CategoriaQuarto } from '../models/categoria-quarto.model';
import { MensagemUtils } from '../utils/mensagem-utils';
import { DateUtils } from '../utils/date-utils';

@Injectable({
  providedIn: 'root',
})
export class OrcamentoRapidoService {
  constructor(
    private tarifaService: TarifaService,
  ) {}

  async gerarOrcamento(request: OrcamentoRapidoRequest): Promise<OrcamentoRapidoResultado> {
    console.log('=== orcamento-rapido.service gerarOrcamento ===');
    console.log('request:', request);

    // Garantir que datas são objetos Date (PrimeNG 21 pode retornar string)
    const checkin = request.dataCheckin instanceof Date ? request.dataCheckin : new Date(request.dataCheckin);
    const checkout = request.dataCheckout instanceof Date ? request.dataCheckout : new Date(request.dataCheckout);

    console.log('checkin:', checkin);
    console.log('checkout:', checkout);
    console.log('categoriaId:', request.categoriaId);

    const categoria = await this.tarifaService.getCategoria(request.categoriaId);
    console.log('categoria encontrada:', categoria);
    if (!categoria) throw new Error('Categoria não encontrada');

    const noitesReais = DateUtils.calcularDiasEntre(checkin, checkout);
    const isDayUse = noitesReais === 0 && !!checkin && !!checkout;
    const numeroNoites = isDayUse ? 1 : noitesReais;
    const config = await this.tarifaService.getConfiguracao();

    // Valida disponibilidade da UH na temporada do check-in (preço zerado = não liberada)
    const isAltaCheckin = DateUtils.isAltaTemporada(
      checkin,
      config.temporada.altaInicio,
      config.temporada.altaFim,
    );
    if (!MensagemUtils.isDisponivelNaTemporada(categoria, isAltaCheckin ? 'alta' : 'baixa')) {
      const nomeTemporada = isAltaCheckin ? 'Alta Temporada' : 'Baixa Temporada';
      throw new Error(`Esta UH não está disponível em '${nomeTemporada}'.`);
    }

    // Calcular preço por noite considerando temporada
    let diasAlta = 0;
    let diasBaixa = 0;

    let somaComCafeAlta = 0;
    let somaSemCafeAlta = 0;
    let somaComCafeBaixa = 0;
    let somaSemCafeBaixa = 0;

    const dataAtual = new Date(checkin);
    const dataFim = new Date(checkout);

    // Usamos um loop baseado no número de diárias para garantir que Day Use (1 diária) funcione
    for (let i = 0; i < numeroNoites; i++) {
      const isAlta = DateUtils.isAltaTemporada(
        dataAtual,
        config.temporada.altaInicio,
        config.temporada.altaFim,
      );
      if (isAlta) {
        diasAlta++;
        somaComCafeAlta += categoria.precoAltaCafe;
        somaSemCafeAlta += categoria.precoAltaSemCafe;
      } else {
        diasBaixa++;
        somaComCafeBaixa += categoria.precoBaixaCafe;
        somaSemCafeBaixa += categoria.precoBaixaSemCafe;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    const somaComCafe = somaComCafeAlta + somaComCafeBaixa;
    const somaSemCafe = somaSemCafeAlta + somaSemCafeBaixa;

    const tipoTemporada = diasAlta > 0 && diasBaixa > 0 ? 'misto' : diasAlta > 0 ? 'alta' : 'baixa';
    const valorTotalComCafe = somaComCafe * request.quantidade;
    const valorTotalSemCafe = somaSemCafe * request.quantidade;

    // ===== LÓGICA DE PROMOÇÃO CENTRALIZADA =====
    const resultadoPromo = MensagemUtils.processarPromocao(
      config,
      numeroNoites,
      diasAlta,
      request.dataCheckin,
      request.dataCheckout,
    );

    let valorFinalComCafe = valorTotalComCafe;
    let valorFinalSemCafe = valorTotalSemCafe;

    if (resultadoPromo.aplicada) {
      const fatorDesconto = 1 - resultadoPromo.desconto;

      // Aplica desconto SEMPRE apenas nos dias de alta temporada (período da promoção)
      const totalAltaCom = somaComCafeAlta * request.quantidade;
      const totalAltaSem = somaSemCafeAlta * request.quantidade;
      const totalBaixaCom = somaComCafeBaixa * request.quantidade;
      const totalBaixaSem = somaSemCafeBaixa * request.quantidade;

      valorFinalComCafe = totalAltaCom * fatorDesconto + totalBaixaCom;
      valorFinalSemCafe = totalAltaSem * fatorDesconto + totalBaixaSem;
    }

    // Construir resultados por categoria para o componente
    const resultadoCategoria: ResultadoCategoriaOrcamento = {
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      capacidadeMaxima: categoria.capacidadeMaxima,
      precoDiaria: request.incluirCafe ? (somaComCafe / numeroNoites) : (somaSemCafe / numeroNoites),
      precoComDesconto: request.incluirCafe ? (valorFinalComCafe / numeroNoites) : (valorFinalSemCafe / numeroNoites),
      desconto: resultadoPromo.aplicada ? Math.round(resultadoPromo.desconto * 100) : 0,
      valorTotal: request.incluirCafe ? valorFinalComCafe : valorFinalSemCafe,
      camasCasal: categoria.camasCasal ?? 0,
      camasSolteiro: categoria.camasSolteiro ?? 0,
    };

    const textoWhatsApp = this.gerarTextoWhatsApp(categoria, {
      request,
      checkin,
      checkout,
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
      textoPromocao: resultadoPromo.texto,
      config,
    });

    return { resultados: [resultadoCategoria], textoWhatsApp };
  }

  private gerarTextoWhatsApp(categoria: CategoriaQuarto, dados: DadosGeracaoTexto & { checkin: Date; checkout: Date }): string {
    const {
      request,
      checkin,
      checkout,
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

    // Itens inclusos - combinar comodidades da categoria + globais do config
    // Com deduplicação inteligente: se global está contido na categoria (ex: "TV" em "TV a Cabo"), usa a da categoria
    const comodidadesCategoria = categoria.comodidadesSelecionadas || [];
    const comodidadesGlobais = config?.comodidadesGlobais
      ? config.comodidadesGlobais.split(',').map(c => c.trim()).filter(c => c.length > 0)
      : [];

    // Filtrar globais que já estão "cobertos" pelas da categoria (match parcial case-insensitive)
    const globaisFiltrados = comodidadesGlobais.filter((global) => {
      const globalLower = global.toLowerCase();
      return !comodidadesCategoria.some((cat) =>
        cat.toLowerCase().includes(globalLower) || globalLower.includes(cat.toLowerCase())
      );
    });

    const todasComodidades = [...comodidadesCategoria, ...globaisFiltrados];

    if (todasComodidades.length) {
      texto += `✅ *Itens inclusos:* ${todasComodidades.join(', ')}.\n\n`;
    } else {
      texto += `\n`;
    }

    texto += `🛏️ *Configuração:* ${MensagemUtils.formatarCamas({ camasCasal: categoria.camasCasal ?? 0, camasSolteiro: categoria.camasSolteiro ?? 0 } as CategoriaQuarto)}\n`;

    // Capacidade (lógica do JS: se grupo solteiro, exibe 1 pessoa; senão, usa capacidadeMaxima)
    let capacidadeExibida = categoria.capacidadeMaxima;
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
    texto += `📅 *Período:* ${checkin.toLocaleDateString('pt-BR')} a ${checkout.toLocaleDateString('pt-BR')}\n`;

    const isDayUseLocal =
      numeroNoites === 1 &&
      checkin.getFullYear() === checkout.getFullYear() &&
      checkin.getMonth() === checkout.getMonth() &&
      checkin.getDate() === checkout.getDate();

    texto += `🌙 *Duração:* ${isDayUseLocal ? 'Day Use' : numeroNoites + ' diária(s)'}\n\n`;

    // Valor da diária
    const mediaCom = somaComCafe / numeroNoites;
    const mediaSem = somaSemCafe / numeroNoites;
    const isMisto = tipoTemporada === 'misto';

    texto +=
      MensagemUtils.formatarBlocoDePrecos(
        mediaCom,
        mediaSem,
        valorTotalComCafe,
        valorTotalSemCafe,
        numeroNoites,
        isMisto,
      ) + '\n';

    // Promoção
    if (textoPromocao) {
      texto += textoPromocao;
      if (valorFinalComCafe !== valorTotalComCafe || valorFinalSemCafe !== valorTotalSemCafe) {
        texto += `\n☕ C/ Café: *${formatarMoeda(valorFinalComCafe)}*\n`;
        texto += `❌ S/ Café: *${formatarMoeda(valorFinalSemCafe)}*\n`;
      }
      texto += `\n`;
    }

    texto += `\n📥 *Check-in:* das 14h às 22h.\n`;
    texto += `_OBS.: Após esse horário a recepção fecha. Acesso somente para hóspedes acomodados (descanso e circulação normal)._\n`;
    texto += `📤 *Check-out:* até as 12h\n\n`;

    // Horários das refeições (igual ao JS)
    texto += MensagemUtils.formatarHorariosRefeicoes(config);

    texto += `⚠️ _Valores sujeitos a disponibilidade no ato da reserva._\n\n`;
    texto += `*Deseja garantir sua reserva agora?*`;

    return texto;
  }
}