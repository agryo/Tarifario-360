import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { TarifaService } from './tarifa';
import { OrcamentosRapidosRepository } from './repositories/orcamentos-rapidos-repository';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { RepositoryFactory } from './repository-factory';
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
  protected readonly STORAGE_KEY = 'orcamentos_rapidos';
  protected readonly ENTITY_TYPE = 'orcamento_rapido';

  constructor(
    private storage: StorageService,
    private tarifaService: TarifaService,
    private configFactory: ConfigRepositoryFactory,
    private repoFactory: RepositoryFactory,
  ) {}

  private get orcamentosRepo(): OrcamentosRapidosRepository {
    return this.repoFactory.getOrcamentosRapidosRepo();
  }

  protected criarEntidade(dados: Partial<OrcamentoRapido>): OrcamentoRapido {
    return {
      ...dados,
      id: this.storage.generateId(),
    } as OrcamentoRapido;
  }

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

    const noitesReais = this.calcularNoites(checkin, checkout);
    const isDayUse = noitesReais === 0 && !!checkin && !!checkout;
    const numeroNoites = isDayUse ? 1 : noitesReais;
    const config = await this.tarifaService.getConfiguracao();

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
      const isAlta = this.isAltaTemporada(
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

    const orcamento: OrcamentoRapido = {
      ...this.criarEntidade({}),
      tipo: this.ENTITY_TYPE,
      dataGeracao: new Date().toISOString(),
      categoriaId: request.categoriaId,
      dataCheckin: request.dataCheckin instanceof Date ? request.dataCheckin.toISOString() : request.dataCheckin,
      dataCheckout: request.dataCheckout instanceof Date ? request.dataCheckout.toISOString() : request.dataCheckout,
      numeroNoites,
      quantidade: request.quantidade,
      valorDiaria: (somaComCafe / numeroNoites) * request.quantidade, // média por noite
      tipoTemporada,
      valorTotal: request.incluirCafe ? valorFinalComCafe : valorFinalSemCafe,
    };

    // Orçamentos rápidos NÃO são salvos no banco - são apenas para gerar texto WhatsApp
    // Apenas orçamentos oficiais precisam ser persistidos
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

  async listar(): Promise<OrcamentoRapido[]> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        return await this.orcamentosRepo.getAll();
      }
    } catch (error) {
      console.warn('Falha ao buscar orçamentos rápidos do Supabase, usando localStorage:', error);
    }
    return this.storage.get<OrcamentoRapido[]>(this.STORAGE_KEY) || [];
  }

  async buscarPorId(id: string): Promise<OrcamentoRapido | null> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        return await this.orcamentosRepo.getById(id);
      }
    } catch (error) {
      console.warn('Falha ao buscar orçamento rápido do Supabase, usando localStorage:', error);
    }
    const lista = await this.listar();
    return lista.find((e) => e.id === id) || null;
  }

  async salvar(orcamento: OrcamentoRapido): Promise<void> {
    if (!this.validarEntidade(orcamento)) {
      throw new Error(`Dados inválidos. O objeto não é um ${this.ENTITY_TYPE} válido.`);
    }

    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        const existing = await this.orcamentosRepo.getById(orcamento.id);
        if (existing) {
          await this.orcamentosRepo.update(orcamento.id, orcamento);
        } else {
          // Não enviar ID para o Supabase - deixar o banco gerar UUID
          const { id, ...orcamentoSemId } = orcamento;
          await this.orcamentosRepo.create(orcamentoSemId);
        }
      }
    } catch (error) {
      console.warn('Falha ao salvar orçamento rápido no Supabase:', error);
    }

    // Fallback to localStorage
    const lista = await this.listar();
    const index = lista.findIndex((e) => e.id === orcamento.id);
    if (index >= 0) {
      lista[index] = orcamento;
    } else {
      lista.push(orcamento);
    }
    this.storage.set(this.STORAGE_KEY, lista);
  }

  async excluir(id: string): Promise<void> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        await this.orcamentosRepo.delete(id);
      }
    } catch (error) {
      console.warn('Falha ao excluir orçamento rápido do Supabase:', error);
    }
    const lista = (await this.listar()).filter((e) => e.id !== id);
    this.storage.set(this.STORAGE_KEY, lista);
  }

  protected validarEntidade(entidade: unknown): entidade is OrcamentoRapido {
    return (
      entidade !== null &&
      typeof entidade === 'object' &&
      'id' in entidade &&
      'tipo' in entidade &&
      (entidade as Record<string, unknown>)['tipo'] === this.ENTITY_TYPE
    );
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

    // Itens inclusos
    if (categoria.comodidadesSelecionadas?.length) {
      texto += `✅ *Itens inclusos:* ${categoria.comodidadesSelecionadas.join(', ')}.\n\n`;
    } else {
      texto += `\n`;
    }

    texto += `🛏️ *Configuração:* ${MensagemUtils.formatarCamas(categoria)}\n`;

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

  async limpar(): Promise<void> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        // Would need bulk delete - skip for now
      }
    } catch (error) {
      console.warn('Falha ao limpar orçamentos rápidos do Supabase:', error);
    }
    this.storage.remove(this.STORAGE_KEY);
  }
}