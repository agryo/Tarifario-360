import { ConfiguracaoGeral } from '../models/tarifa.model';
import { CategoriaQuarto } from '../models/categoria-quarto.model';

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

  public static formatarCamas(cat: CategoriaQuarto): string {
    const partes: string[] = [];
    const camasCasal = cat.camasCasal ?? 0;
    const camasSolteiro = cat.camasSolteiro ?? 0;

    if (camasCasal > 0) {
      partes.push(`${camasCasal} Cama${camasCasal > 1 ? 's' : ''} Casal`);
    }
    if (camasSolteiro > 0) {
      partes.push(`${camasSolteiro} Cama${camasSolteiro > 1 ? 's' : ''} Solteiro`);
    }
    return partes.join(' + ') || 'Configuração sob consulta';
  }

  public static formatarBlocoDePrecos(
    diariaCom: number,
    diariaSem: number,
    totalCom: number,
    totalSem: number,
    noites: number,
    isMisto: boolean,
  ): string {
    const formatarMoeda = (valor: number) =>
      valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const sufixoMedia = isMisto ? ' (média)' : '';

    let texto = `💰 *Valor da diária:*\n`;
    texto += `☕ Com café: ${formatarMoeda(diariaCom)}${sufixoMedia}\n`;
    texto += `❌ Sem café: ${formatarMoeda(diariaSem)}${sufixoMedia}\n`;

    if (noites > 1) {
      texto += `\n💵 *Total para ${noites} diárias:*\n`;
      texto += `☕ *Total com café:* ${formatarMoeda(totalCom)}\n`;
      texto += `❌ *Total sem café:* ${formatarMoeda(totalSem)}\n`;
    }

    return texto;
  }

  public static processarPromocao(
    config: ConfiguracaoGeral,
    noites: number,
    diasAlta: number,
  ): { texto: string; aplicada: boolean; desconto: number } {
    if (!config.promocao.ativa) {
      return { texto: '', aplicada: false, desconto: 0 };
    }

    const { desconto, minDiarias, texto: promoTexto, somenteAlta, msgBaixa } = config.promocao;

    let aplicarPromo = true;
    let exibirApenasMsg = false;

    // Se for somente alta e não houver dias de alta
    if (somenteAlta && diasAlta === 0) {
      aplicarPromo = false;
      if (msgBaixa) exibirApenasMsg = true;
    }

    if (aplicarPromo) {
      if (noites >= minDiarias) {
        return {
          texto: `🔥 *PROMOÇÃO ESPECIAL ATIVA:*\nGanhe *${desconto}% de desconto* para ${promoTexto}!\n👇 *Valores com desconto aplicado:*`,
          aplicada: true,
          desconto: desconto / 100,
        };
      } else {
        return {
          texto: `🔥 *PROMOÇÃO ESPECIAL:* Reserve *${minDiarias} diárias* ou mais e ganhe *${desconto}% de desconto* para ${promoTexto}!`,
          aplicada: false,
          desconto: 0,
        };
      }
    } else if (exibirApenasMsg) {
      return {
        texto: `🔥 *PROMOÇÃO ESPECIAL:* Ganhe *${desconto}% de desconto* para ${promoTexto}!`,
        aplicada: false,
        desconto: 0,
      };
    }

    return { texto: '', aplicada: false, desconto: 0 };
  }
}
