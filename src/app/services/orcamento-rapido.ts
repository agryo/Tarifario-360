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
    // Temporariamente, vamos usar um cálculo fixo até o método ser implementado
    // const { precoTotal, tipo, diasAlta, diasBaixa } = this.tarifaService.calcularPrecoCategoria(
    //   request.categoriaId,
    //   request.dataCheckin,
    //   request.dataCheckout,
    // );

    const numeroNoites = this.calcularNoites(request.dataCheckin, request.dataCheckout);
    // const valorTotal = precoTotal * request.quantidade;
    const valorTotal = 0; // temporário

    const categoria = this.tarifaService.getCategoria(request.categoriaId);

    const orcamento: OrcamentoRapido = {
      id: this.storage.generateId(),
      dataGeracao: new Date(),
      categoriaId: request.categoriaId,
      dataCheckin: request.dataCheckin,
      dataCheckout: request.dataCheckout,
      numeroNoites,
      quantidade: request.quantidade,
      valorDiaria: 0, // temporário
      tipoTemporada: 'baixa', // temporário
      valorTotal,
      textoWhatsApp: this.gerarTextoWhatsApp(categoria?.nome || 'Quarto', {
        ...request,
        numeroNoites,
        valorTotal,
        tipoTemporada: 'baixa',
        diasAlta: 0,
        diasBaixa: numeroNoites,
      }),
    };

    this.salvarHistorico(orcamento);
    return orcamento;
  }

  private calcularNoites(checkin: Date, checkout: Date): number {
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private gerarTextoWhatsApp(categoriaNome: string, dados: any): string {
    const config = this.tarifaService.getConfiguracao();

    let texto = `🏨 *Orçamento Rápido - Tarifário 360*\n\n`;
    texto += `📅 *Check-in:* ${dados.dataCheckin.toLocaleDateString()}\n`;
    texto += `📅 *Check-out:* ${dados.dataCheckout.toLocaleDateString()}\n`;
    texto += `🛏️ *Quarto:* ${categoriaNome}\n`;
    texto += `📦 *Quantidade:* ${dados.quantidade}\n`;
    texto += `🌡️ *Temporada:* ${dados.tipoTemporada === 'alta' ? '🔴 Alta' : dados.tipoTemporada === 'baixa' ? '🟢 Baixa' : '🟡 Mista'}\n`;

    if (dados.diasAlta > 0 && dados.diasBaixa > 0) {
      texto += `   ${dados.diasAlta} dia(s) em alta, ${dados.diasBaixa} dia(s) em baixa\n`;
    }

    texto += `\n💰 *Valor Total:* R$ ${dados.valorTotal.toFixed(2)}\n`;
    texto += `💵 *Entrada:* 50% no ato da reserva\n\n`;

    texto += `_Sujeito à disponibilidade no momento da reserva._\n`;
    texto += `_Tarifário 360 - Sistema de Gestão Hoteleira_`;

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