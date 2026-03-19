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
    checkin?: Date,
    checkout?: Date,
  ): { texto: string; aplicada: boolean; desconto: number } {
    if (!config.promocao.ativa) {
      return { texto: '', aplicada: false, desconto: 0 };
    }

    const { desconto, minDiarias, texto: promoTexto, somenteAlta, msgBaixa } = config.promocao;

    // 1. Verifica elegibilidade da promoção (dias dentro do período promocional >= minDiarias)
    let diasElegiveis = diasAlta;

    // Cálculo de fallback: Se diasAlta vier zerado (ex: tabela-opcoes), tenta calcular via datas se disponíveis
    if (
      diasAlta === 0 &&
      checkin &&
      checkout &&
      config.temporada.altaInicio &&
      config.temporada.altaFim
    ) {
      const inicioPromo = new Date(config.temporada.altaInicio + 'T00:00:00');
      const fimPromo = new Date(config.temporada.altaFim + 'T00:00:00');
      const current = new Date(checkin);
      current.setHours(0, 0, 0, 0);

      const end = new Date(checkout);
      end.setDate(end.getDate() - 1); // Última diária é dia anterior ao checkout
      end.setHours(0, 0, 0, 0);

      let count = 0;
      // Itera para contar dias dentro do intervalo
      while (current <= end) {
        if (current >= inicioPromo && current <= fimPromo) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      diasElegiveis = count;
    }

    let aplicarPromo = false;

    // Regra unificada: O desconto só ativa se houver o mínimo de diárias DENTRO do período promocional.
    // A flag 'somenteAlta' controla apenas a exibição de mensagens fora do período, não a regra de aplicação.
    if (diasElegiveis >= minDiarias) {
      aplicarPromo = true;
    }

    // 2. Lógica de Aplicação do Desconto (Requer período válido e mínimo de noites)
    if (aplicarPromo) {
      return {
        texto: `🔥 *PROMOÇÃO ESPECIAL ATIVA:*\nGanhe *${desconto}% de desconto* para ${promoTexto}!\n👇 *Valores com desconto aplicado:*`,
        aplicada: true,
        desconto: desconto / 100,
      };
    }

    // 3. Lógica de Exibição de Mensagens (Quando o desconto NÃO é aplicado)

    // Caso A: Tem dias no período (ou é promo geral), mas não atingiu o mínimo -> Incentiva a reserva
    // Para "somenteAlta", verifica se tem ALGUM dia de alta (diasElegiveis > 0) para mostrar o incentivo
    if ((somenteAlta && diasElegiveis > 0) || (!somenteAlta && noites > 0)) {
      return {
        texto: `🔥 *PROMOÇÃO ESPECIAL:* Reserve *${minDiarias} diárias* ou mais e ganhe *${desconto}% de desconto* para ${promoTexto}!`,
        aplicada: false,
        desconto: 0,
      };
    }

    // Caso B: Totalmente fora do período (apenas se somenteAlta for true, pois o else acima cobre !somenteAlta)
    if (!somenteAlta) {
      // Opção "Somente Alta" DESMARCADA -> Mostra a mensagem de incentivo padrão em qualquer data
      return {
        texto: `🔥 *PROMOÇÃO ESPECIAL:* Reserve *${minDiarias} diárias* ou mais e ganhe *${desconto}% de desconto* para ${promoTexto}!`,
        aplicada: false,
        desconto: 0,
      };
    } else {
      // Opção "Somente Alta" MARCADA
      if (msgBaixa) {
        // Opção "Mensagem na Baixa" MARCADA -> Mostra mensagem alternativa
        return {
          texto: `🔥 *PROMOÇÃO ESPECIAL:* Ganhe *${desconto}% de desconto* para ${promoTexto}!`,
          aplicada: false,
          desconto: 0,
        };
      }
      // Se "Mensagem na Baixa" estiver desmarcada, não retorna nada (cai no return final)
    }

    return { texto: '', aplicada: false, desconto: 0 };
  }
}
