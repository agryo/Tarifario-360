import { ConfiguracaoGeral } from '../models/tarifa.model';

export class MensagemUtils {
  static formatarHorariosRefeicoes(config: ConfiguracaoGeral): string {
    const horarios: string[] = [];

    if (config.cafeAtivo) {
      horarios.push(`*- Café da manhã:* ${config.cafeInicio} às ${config.cafeFim}`);
    }

    if (config.almocoAtivo) {
      horarios.push(`*- Almoço:* ${config.almocoInicio} às ${config.almocoFim} (opcional)`);
    }

    if (config.lancheTardeAtivo) {
      horarios.push(
        `*- Lanche da Tarde:* ${config.lancheTardeInicio} às ${config.lancheTardeFim} (opcional)`,
      );
    }

    if (config.jantarAtivo) {
      horarios.push(`*- Lanche à Noite:* ${config.jantarInicio} às ${config.jantarFim} (opcional)`);
    }

    if (horarios.length === 0) return '';
    return `⏰ *Horários das Refeições:*\n${horarios.join('\n')}\n\n`;
  }
}
