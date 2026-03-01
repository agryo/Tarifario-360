export class DateUtils {
  // ===== CONSTANTES =====
  static readonly HORA_CHECKIN = '14:00';
  static readonly HORA_CHECKOUT = '11:00';

  // ===== DATAS ATUAIS =====
  static hoje(): Date {
    return new Date();
  }

  static amanha(): Date {
    return this.adicionarDias(new Date(), 1);
  }

  // ===== FORMATAÇÃO =====
  static formatarDataBR(data: Date): string {
    return data.toLocaleDateString('pt-BR');
  }

  static formatarDataISO(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  static parseDataBR(dataStr: string): Date {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  // ===== CÁLCULOS =====
  static calcularDiasEntre(data1: Date, data2: Date): number {
    const diff = data2.getTime() - data1.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  static adicionarDias(data: Date, dias: number): Date {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
  }

  // ===== VALIDAÇÃO DE DATAS =====
  static ajustarDataSaida(entrada: Date, saida: Date): Date {
    if (!entrada || !saida) return saida;
    const diff = this.calcularDiasEntre(entrada, saida);
    if (diff < 1) {
      return this.adicionarDias(entrada, 1);
    }
    return saida;
  }

  // ===== ALTA TEMPORADA =====
  static isAltaTemporada(data: Date, altaInicio: string, altaFim: string): boolean {
    if (!altaInicio || !altaFim) return false;
    const inicio = new Date(altaInicio + 'T00:00:00');
    const fim = new Date(altaFim + 'T00:00:00');
    return data >= inicio && data <= fim;
  }

  static contarDiasPorTemporada(
    checkin: Date,
    checkout: Date,
    altaInicio: string,
    altaFim: string,
  ): { diasAlta: number; diasBaixa: number; total: number } {
    let diasAlta = 0;
    let diasBaixa = 0;
    const current = new Date(checkin);
    current.setHours(0, 0, 0, 0);
    const end = new Date(checkout);
    end.setHours(0, 0, 0, 0);

    while (current < end) {
      if (this.isAltaTemporada(current, altaInicio, altaFim)) {
        diasAlta++;
      } else {
        diasBaixa++;
      }
      current.setDate(current.getDate() + 1);
    }
    return { diasAlta, diasBaixa, total: diasAlta + diasBaixa };
  }

  static ajustarDatasAltaTemporada(inicio: string, fim: string): { inicio: string; fim: string } {
    if (!inicio || !fim) return { inicio, fim };
    const dataInicio = new Date(inicio + 'T00:00:00');
    const dataFim = new Date(fim + 'T00:00:00');
    if (dataFim < dataInicio) {
      return { inicio, fim: inicio };
    }
    if (dataFim.getTime() === dataInicio.getTime()) {
      const novaFim = this.adicionarDias(dataInicio, 1);
      return { inicio, fim: this.formatarDataISO(novaFim) };
    }
    return { inicio, fim };
  }

  // ===== ESCALA (DOMINGO E SÁBADO) =====
  static ajustarParaDomingo(data: Date): Date {
    const dia = data.getDay();
    const diff = dia === 0 ? 0 : -dia;
    return this.adicionarDias(data, diff);
  }

  static ajustarParaSabado(data: Date): Date {
    const dia = data.getDay();
    const diff = dia === 6 ? 0 : 6 - dia;
    return this.adicionarDias(data, diff);
  }
}
