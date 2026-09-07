import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';
import { IConfigGeralRepository } from './repositories/repository-interfaces';
import { RepositoryFactory } from './repository-factory';
import { ConfiguracaoGeral } from '../models/tarifa.model';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly STORAGE_CONFIG = 'config';

  // Notifica quando a configuração geral é atualizada (salvo/importado/limpo)
  private configAtualizadaSource = new Subject<void>();
  configAtualizada$ = this.configAtualizadaSource.asObservable();

  constructor(
    private storage: StorageService,
    private criptografia: CriptografiaService,
    private repoFactory: RepositoryFactory,
  ) {}

  private get configGeralRepo(): IConfigGeralRepository {
    return this.repoFactory.getConfigGeralRepo();
  }

  async getConfiguracao(): Promise<ConfiguracaoGeral> {
    try {
      const config = await this.configGeralRepo.get();
      if (config) {
        // Deep merge com defaults, mas preserva senhaHash/senhaSalt vazios (sem senha)
        const defaults = this.getConfiguracaoPadrao();
        const dbSeguranca = config.seguranca ?? {};
        const seguranca = {
          ...defaults.seguranca,
          ...dbSeguranca,
          // Se veio vazio do banco (usuário removeu senha), mantém vazio
          // Usa verificação explícita de undefined/null pois string vazia "" é falsy
          senhaHash: dbSeguranca.senhaHash !== undefined && dbSeguranca.senhaHash !== null ? dbSeguranca.senhaHash : defaults.seguranca.senhaHash,
          senhaSalt: dbSeguranca.senhaSalt !== undefined && dbSeguranca.senhaSalt !== null ? dbSeguranca.senhaSalt : defaults.seguranca.senhaSalt,
        };
        return {
          ...defaults,
          ...config,
          precos: { ...defaults.precos, ...config.precos, refeicoes: { ...defaults.precos.refeicoes, ...(config.precos?.refeicoes || {}) } },
          temporada: { ...defaults.temporada, ...config.temporada },
          horarios: { ...defaults.horarios, ...config.horarios },
          promocao: { ...defaults.promocao, ...config.promocao },
          seguranca,
          orcamento: { ...defaults.orcamento, ...config.orcamento, textos: { ...defaults.orcamento.textos, ...(config.orcamento?.textos || {}) } },
        };
      }
      // No config in Supabase (empty table) - return defaults, DON'T fall back to localStorage
      return this.getConfiguracaoPadrao();
    } catch (error) {
      console.error('Falha ao buscar config do Supabase:', error);
      throw error;
    }
  }

  /**
   * Verifica se um objeto de configuração está no formato antigo (plano) e o converte
   * para a nova estrutura aninhada. Retorna a configuração no formato `ConfiguracaoGeral` atualizado.
   * @param config A configuração a ser verificada e possivelmente migrada.
   * @returns A configuração no formato `ConfiguracaoGeral` atualizado.
   */
  migrarConfiguracaoSeNecessario(config: any): ConfiguracaoGeral {
    if (config && config.precos === undefined && config.valorAlmocoExtra !== undefined) {
      return {
        festividade: config.festividade,
        totalUhs: config.totalUhs,
        comodidadesGlobais: config.comodidadesGlobais,
        precos: {
          refeicoes: {
            almoco: config.valorAlmocoExtra,
            janta: config.valorJantaExtra,
            lanche: config.valorLancheExtra,
          },
          kwh: config.valorKwh,
        },
        temporada: { altaInicio: config.altaInicio, altaFim: config.altaFim },
        horarios: {
          cafe: { inicio: config.cafeInicio, fim: config.cafeFim, ativo: config.cafeAtivo },
          almoco: { inicio: config.almocoInicio, fim: config.almocoFim, ativo: config.almocoAtivo },
          lanche: {
            inicio: config.lancheTardeInicio,
            fim: config.lancheTardeFim,
            ativo: config.lancheTardeAtivo,
          },
          jantar: { inicio: config.jantarInicio, fim: config.jantarFim, ativo: config.jantarAtivo },
        },
        promocao: {
          ativa: config.promocaoAtiva,
          desconto: config.promocaoDesconto,
          minDiarias: config.promocaoMinDiarias,
          texto: config.promocaoTexto,
          somenteAlta: config.promocaoSomenteAlta,
          msgBaixa: config.promocaoMsgBaixa,
        },
        seguranca: { senhaHash: config.senhaHash, senhaSalt: config.senhaSalt },
        orcamento: {
          textos: {
            titulo: config.orcTitulo,
            configTitulo: config.orcConfigTitulo,
            configDescricao: config.orcConfigDescricao,
            notaRefeicoes: config.orcNotaRefeicoes,
            cronograma: config.orcCronograma,
            pagamento: config.orcPagamento,
            observacoes: config.orcObservacoes,
            rodape: config.orcRodape,
          },
          sinalPercentual: config.orcSinalPercentual,
        },
      };
    }
    return config as ConfiguracaoGeral;
  }

  async salvarConfiguracao(config: ConfiguracaoGeral): Promise<void> {
    await this.configGeralRepo.update(config);
    this.storage.set(this.STORAGE_CONFIG, config);
    this.configAtualizadaSource.next();
  }

  // ===== DADOS INICIAIS =====
  private getConfiguracaoPadrao(): ConfiguracaoGeral {
    const salt = this.criptografia.gerarSalt();
    const hash = this.criptografia.hashSenha('1234', salt);

    // Data padrão: uma semana à frente de hoje
    const hoje = new Date();
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);
    const altaInicio = umaSemana.toISOString().split('T')[0];

    const altaFim = new Date(umaSemana);
    altaFim.setDate(umaSemana.getDate() + 90); // 90 dias de alta temporada
    const altaFimStr = altaFim.toISOString().split('T')[0];

    return {
      festividade: '🎊 Evento Especial',
      totalUhs: 50,
      comodidadesGlobais: 'Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro',
      precos: {
        refeicoes: { almoco: 45, janta: 55, lanche: 25 },
        kwh: 0.89,
      },
      temporada: { altaInicio, altaFim: altaFimStr },
      horarios: {
        cafe: { inicio: '07:00', fim: '10:00', ativo: true },
        almoco: { inicio: '12:00', fim: '14:00', ativo: true },
        lanche: { inicio: '15:00', fim: '17:00', ativo: true },
        jantar: { inicio: '19:00', fim: '21:00', ativo: true },
      },
      promocao: {
        ativa: false,
        desconto: 15,
        minDiarias: 3,
        texto: 'Pagamento integral via Pix ou Dinheiro',
        somenteAlta: true,
        msgBaixa: false,
      },
      seguranca: { senhaHash: hash, senhaSalt: salt },
      orcamento: {
        textos: {
          titulo: 'Orçamento de Hospedagem',
          configTitulo: '1. Configuração de Acomodação e Valores',
          configDescricao: 'A proposta contempla a estadia com café da manhã incluso...',
          notaRefeicoes: 'Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...',
          cronograma: 'Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}',
          pagamento: 'Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...',
          observacoes: 'Refeições: O café da manhã é cortesia da casa e já está incluso...',
          rodape: 'Setor de Reservas - Hotel Plaza',
        },
        sinalPercentual: 50,
      },
    };
  }

  // ===== LIMPAR CACHE =====
  async limparCache(): Promise<void> {
    // Limpa TUDO no Supabase via ClientStrategy (API ou Direct Client)
    const strategy = this.repoFactory['strategy'] as any;
    if (strategy?.clearDatabase) {
      await strategy.clearDatabase();
    }
    // Limpa localStorage
    this.storage.remove(this.STORAGE_CONFIG);
    // Recria dados padrão
    await this.salvarConfiguracao(this.getConfiguracaoPadrao());
    this.configAtualizadaSource.next();
  }

  // Recarrega dados do Supabase para atualizar o cache local
  async recarregarDoSupabase(): Promise<void> {
    try {
      this.storage.remove(this.STORAGE_CONFIG);
      await this.getConfiguracao();
      this.configAtualizadaSource.next();
    } catch (error) {
      console.warn('Falha ao recarregar config do Supabase:', error);
    }
  }

  // Para compatibilidade com backup service
  async inicializarDadosPadraoSeNecessario(): Promise<void> {
    const configExistente = await this.configGeralRepo.get();
    if (!configExistente) {
      await this.salvarConfiguracao(this.getConfiguracaoPadrao());
    }
  }
}