import { ConfiguracaoGeral } from '../models/tarifa.model';

export class MensagemUtils {
  public static formatarHorariosRefeicoes(config: ConfiguracaoGeral): string {
    const horarios: string[] = [];

    if (config.horarios.cafe.ativo) {
      horarios.push(
        `*- Café da manhã:* ${config.horarios.cafe.inicio} às ${config.horarios.cafe.fim}`,
      );
    }

    if (config.horarios.almoco.ativo) {
      horarios.push(
        `*- Almoço:* ${config.horarios.almoco.inicio} às ${config.horarios.almoco.fim} (opcional)`,
      );
    }

    if (config.horarios.lanche.ativo) {
      horarios.push(
        `*- Lanche da Tarde:* ${config.horarios.lanche.inicio} às ${config.horarios.lanche.fim} (opcional)`,
      );
    }

    if (config.horarios.jantar.ativo) {
      horarios.push(
        `*- Jantar:* ${config.horarios.jantar.inicio} às ${config.horarios.jantar.fim} (opcional)`,
      );
    }

    if (horarios.length > 0) {
      return `⏰ *Horários das Refeições:*\n${horarios.join('\n')}\n\n`;
    }
    return '';
  }
}
