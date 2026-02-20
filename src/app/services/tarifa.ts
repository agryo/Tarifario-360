import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { CategoriaQuarto, CategoriaComPreco } from '../models/categoria-quarto.model';
import { Temporada, PeriodoMisto } from '../models/temporada.model';
import { Comodidade, COMODIDADES_PADRAO } from '../models/comodidade.model';
import { ConfiguracaoGeral } from '../models/tarifa.model';

@Injectable({
  providedIn: 'root',
})
export class TarifaService {
  private readonly STORAGE_CATEGORIAS = 'categorias';
  private readonly STORAGE_TEMPORADAS = 'temporadas';
  private readonly STORAGE_COMODIDADES = 'comodidades';
  private readonly STORAGE_CONFIG = 'config';

  constructor(private storage: StorageService) {
    this.inicializarDadosPadrao();
  }

  // ===== CATEGORIAS =====
  getCategorias(): CategoriaQuarto[] {
    return this.storage.get<CategoriaQuarto[]>(this.STORAGE_CATEGORIAS) || [];
  }

  getCategoria(id: string): CategoriaQuarto | null {
    const categorias = this.getCategorias();
    return categorias.find((c) => c.id === id) || null;
  }

  salvarCategoria(categoria: any): void {
    const categorias = this.getCategorias();
    const index = categorias.findIndex((c) => c.id === categoria.id);

    if (index >= 0) {
      categorias[index] = categoria;
    } else {
      categoria.id = this.storage.generateId();
      categorias.push(categoria);
    }

    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  excluirCategoria(id: string): void {
    const categorias = this.getCategorias().filter((c) => c.id !== id);
    this.storage.set(this.STORAGE_CATEGORIAS, categorias);
  }

  // ===== TEMPORADAS =====
  getTemporadas(): Temporada[] {
    return this.storage.get<Temporada[]>(this.STORAGE_TEMPORADAS) || [];
  }

  salvarTemporada(temporada: Temporada): void {
    const temporadas = this.getTemporadas();
    const index = temporadas.findIndex((t) => t.id === temporada.id);

    if (index >= 0) {
      temporadas[index] = temporada;
    } else {
      temporada.id = this.storage.generateId();
      temporadas.push(temporada);
    }

    this.storage.set(this.STORAGE_TEMPORADAS, temporadas);
  }

  excluirTemporada(id: string): void {
    const temporadas = this.getTemporadas().filter((t) => t.id !== id);
    this.storage.set(this.STORAGE_TEMPORADAS, temporadas);
  }

  // ===== COMODIDADES =====
  getComodidades(): Comodidade[] {
    return this.storage.get<Comodidade[]>(this.STORAGE_COMODIDADES) || COMODIDADES_PADRAO;
  }

  salvarComodidade(comodidade: Comodidade): void {
    const comodidades = this.getComodidades();
    const index = comodidades.findIndex((c) => c.id === comodidade.id);

    if (index >= 0) {
      comodidades[index] = comodidade;
    } else {
      comodidade.id = this.storage.generateId();
      comodidades.push(comodidade);
    }

    this.storage.set(this.STORAGE_COMODIDADES, comodidades);
  }

  excluirComodidade(id: string): void {
    const comodidades = this.getComodidades().filter((c) => c.id !== id);
    this.storage.set(this.STORAGE_COMODIDADES, comodidades);
  }

  // ===== CONFIGURAÇÃO GERAL =====
  getConfiguracao(): ConfiguracaoGeral {
    const defaultConfig: ConfiguracaoGeral = {
      horarioCafe: '07:00 - 10:00',
      horarioAlmoco: '12:00 - 14:00',
      horarioJantar: '19:00 - 21:00',
      senhaMaster: '1234',
      moeda: 'BRL',
    };
    return this.storage.get<ConfiguracaoGeral>(this.STORAGE_CONFIG) || defaultConfig;
  }

  salvarConfiguracao(config: ConfiguracaoGeral): void {
    this.storage.set(this.STORAGE_CONFIG, config);
  }

  // ===== LÓGICA DE NEGÓCIO =====
  identificarTemporada(data: Date): Temporada | null {
    const temporadas = this.getTemporadas().filter((t) => t.ativo);
    return (
      temporadas.find((t) => data >= new Date(t.dataInicio) && data <= new Date(t.dataFim)) || null
    );
  }

  calcularPrecoCategoria(
    categoriaId: string,
    dataCheckin: Date,
    dataCheckout: Date,
  ): { precoTotal: number; tipo: 'alta' | 'baixa' | 'misto'; diasAlta: number; diasBaixa: number } {
    const categoria = this.getCategoria(categoriaId);
    if (!categoria) return { precoTotal: 0, tipo: 'baixa', diasAlta: 0, diasBaixa: 0 };

    const dias = this.calcularDiasPorTemporada(dataCheckin, dataCheckout);

    const precoTotal =
      dias.diasAlta * categoria.precoAltaTemporada + dias.diasBaixa * categoria.precoBaixaTemporada;

    let tipo: 'alta' | 'baixa' | 'misto' = 'baixa';
    if (dias.diasAlta > 0 && dias.diasBaixa > 0) tipo = 'misto';
    else if (dias.diasAlta > 0) tipo = 'alta';

    return {
      precoTotal,
      tipo,
      diasAlta: dias.diasAlta,
      diasBaixa: dias.diasBaixa,
    };
  }

  private calcularDiasPorTemporada(
    dataCheckin: Date,
    dataCheckout: Date,
  ): { diasAlta: number; diasBaixa: number } {
    let diasAlta = 0;
    let diasBaixa = 0;

    const dataAtual = new Date(dataCheckin);
    const checkout = new Date(dataCheckout);

    while (dataAtual < checkout) {
      const temporada = this.identificarTemporada(dataAtual);
      if (temporada?.tipo === 'alta') {
        diasAlta++;
      } else {
        diasBaixa++;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return { diasAlta, diasBaixa };
  }

  private inicializarDadosPadrao(): void {
    // Só inicializa se não houver dados
    if (this.getCategorias().length === 0) {
      const categoriasPadrao: CategoriaQuarto[] = [
        {
          id: this.storage.generateId(),
          nome: 'Standard',
          descricao: 'Quarto confortável com vista interna',
          capacidadeMaxima: 2,
          camaCasal: 1,
          camaSolteiro: 0,
          comodidades: ['wifi', 'tv', 'ar'],
          precoAltaTemporada: 350,
          precoBaixaTemporada: 250,
          ativo: true,
          icone: 'pi pi-building',
        },
        {
          id: this.storage.generateId(),
          nome: 'Luxo',
          descricao: 'Quarto espaçoso com vista para o mar',
          capacidadeMaxima: 3,
          camaCasal: 1,
          camaSolteiro: 1,
          comodidades: ['wifi', 'tv', 'ar', 'frigobar'],
          precoAltaTemporada: 550,
          precoBaixaTemporada: 400,
          ativo: true,
          icone: 'pi pi-star',
        },
      ];
      this.storage.set(this.STORAGE_CATEGORIAS, categoriasPadrao);
    }
  }

  exportarDados(): any {
    return {
      categorias: this.getCategorias(),
      temporadas: this.getTemporadas(),
      comodidades: this.getComodidades(),
      config: this.getConfiguracao(),
      dataExportacao: new Date(),
    };
  }
}
