export class DateUtils {
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

  static calcularDiasEntre(data1: Date, data2: Date): number {
    const diff = data2.getTime() - data1.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  static adicionarDias(data: Date, dias: number): Date {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
  }

  static ajustarDataSaida(entrada: Date, saida: Date): Date {
    if (!entrada || !saida) return saida;
    const diff = this.calcularDiasEntre(entrada, saida);
    if (diff < 1) {
      return this.adicionarDias(entrada, 1);
    }
    return saida;
  }

  // Ajusta datas de alta temporada: garante que fim seja pelo menos um dia após início
  static ajustarDatasAltaTemporada(inicio: string, fim: string): { inicio: string; fim: string } {
    if (!inicio || !fim) return { inicio, fim };
    const dataInicio = new Date(inicio + 'T00:00:00');
    const dataFim = new Date(fim + 'T00:00:00');
    if (dataFim < dataInicio) {
      // Se fim é anterior, iguala a início
      return { inicio, fim: inicio };
    }
    if (dataFim.getTime() === dataInicio.getTime()) {
      // Se são iguais, avança fim para o dia seguinte
      const novaFim = this.adicionarDias(dataInicio, 1);
      return { inicio, fim: this.formatarDataISO(novaFim) };
    }
    return { inicio, fim };
  }
}
