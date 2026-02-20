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
}
