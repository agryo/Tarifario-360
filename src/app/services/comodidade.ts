import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { Comodidade, ConfiguracaoGeral } from '../models/tarifa.model';
import { CategoriaQuarto } from '../models/categoria-quarto.model';

/**
 * Fonte única de verdade para a resolução de comodidades.
 *
 * Padrao Caminho B:
 * - `config.comodidadesGlobais` guarda os RÓTULOS como `Comodidade[]`
 *   (`{ id, nome }`), onde `id` é um UUID estável e `nome` o texto editável.
 * - `categoria.comodidadesSelecionadas` guarda apenas os IDs escolhidos.
 *
 * Compatibilidade retroativa: aceita o formato legado (string CSV de nomes),
 * normalizando em memória para `Comodidade[]` com IDs estabilizados pelo nome.
 * Isso permite que o código novo rode sobre o banco atual antes da migração.
 */
@Injectable({ providedIn: 'root' })
export class ComodidadeService {
  /**
   * Normaliza `comodidadesGlobais` (array novo ou CSV legado) para `Comodidade[]`.
   */
  listarComodidades(config: ConfiguracaoGeral | null | undefined): Comodidade[] {
    if (!config || !config.comodidadesGlobais) return [];

    // Formato novo: já é um array de { id, nome }.
    if (Array.isArray(config.comodidadesGlobais)) {
      return config.comodidadesGlobais.filter(
        (c) => c && typeof c.id === 'string' && typeof c.nome === 'string' && c.nome.trim().length > 0,
      );
    }

    // Formato legado: string CSV de nomes. Estabiliza o id pelo nome.
    return config.comodidadesGlobais
      .split(',')
      .map((nome) => nome.trim())
      .filter((nome) => nome.length > 0)
      .map((nome) => ({ id: this.idEstavel(nome), nome }));
  }

  /**
   * Resolve os IDs de uma categoria para os nomes correspondentes.
   * Retorna apenas os nomes que possuem correspondência em `comodidadesGlobais`.
   */
  nomesDaCategoria(categoria: CategoriaQuarto | null | undefined, config: ConfiguracaoGeral | null | undefined): string[] {
    const porId = this.mapaPorId(config);
    const porNome = this.mapaPorNome(config);
    const ids = categoria?.comodidadesSelecionadas ?? [];

    return ids
      .map((id) => {
        if (porId.has(id)) return porId.get(id)!;
        // Legado: a entrada pode ser o próprio nome, comparado de forma canônica.
        return porNome.get(id.trim().toLowerCase());
      })
      .filter((nome): nome is string => !!nome);
  }

  /**
   * Combina as comodidades de uma UH com as globais que ela ainda não tem.
   * A deduplicação é por ID (não por substring), eliminando o bug em que
   * "TV" era considerado subconjunto de "TV a Cabo". Retorna nomes.
   *
   * Compatibilidade dual-format: `comodidadesSelecionadas` pode conter IDs
   * (formato novo) OU nomes legados (formato antigo). Cada item é resolvido
   * contra os mapas de ID e de nome para determinar a qual comodidade global
   * ele pertence, sem assumir cegamente um formato.
   */
  comodidadesCombinadas(categoria: CategoriaQuarto | null | undefined, config: ConfiguracaoGeral | null | undefined): string[] {
    const globais = this.listarComodidades(config);
    const selecionadosIds = this.idsSelecionados(categoria, config);

    // Comodidades da UH resolvidas para nome (mantêm a ordem original).
    const daCategoria = this.nomesDaCategoria(categoria, config);

    // Globais que a UH ainda não possui (comparação por ID canônico).
    const globaisFaltantes = globais
      .filter((g) => !selecionadosIds.has(g.id))
      .map((g) => g.nome);

    return [...daCategoria, ...globaisFaltantes];
  }

  /**
   * Normaliza `comodidadesSelecionadas` de uma categoria para uma lista de IDs
   * canônicos. Entradas que já são IDs são preservadas; nomes legados são
   * resolvidos para o ID correspondente; entradas irreconhecíveis são descartadas.
   */
  normalizarIdsSelecionados(categoria: CategoriaQuarto | null | undefined, config: ConfiguracaoGeral | null | undefined): string[] {
    const ids = this.idsSelecionados(categoria, config);

    // Preserva a ordem original das entradas reconhecidas.
    return (categoria?.comodidadesSelecionadas ?? [])
      .map((entrada) => (this.mapaPorId(config).has(entrada) ? entrada : this.mapaPorNomeParaId(config).get(entrada)))
      .filter((id): id is string => !!id && ids.has(id));
  }

  /**
   * Converte `comodidadesSelecionadas` (IDs novos ou nomes legados) em um
   * conjunto de IDs canônicos, resolvendo cada entrada contra os mapas de
   * comodidades globais. Item não reconhecido em nenhum formato é ignorado.
   */
  private idsSelecionados(categoria: CategoriaQuarto | null | undefined, config: ConfiguracaoGeral | null | undefined): Set<string> {
    const porId = this.mapaPorId(config);
    const porNomeId = this.mapaPorNomeParaId(config);
    const resultado = new Set<string>();

    for (const entrada of categoria?.comodidadesSelecionadas ?? []) {
      if (porId.has(entrada)) {
        resultado.add(entrada);
      } else if (porNomeId.has(entrada)) {
        resultado.add(porNomeId.get(entrada)!);
      }
    }
    return resultado;
  }

  /** Descarta comodidades vazias ou com nome duplicado (sem diferenciar maiúsculas). */
  validar(lista: Comodidade[]): { validas: Comodidade[]; vazias: number; duplicadas: number } {
    const vazias = lista.filter((c) => !c.nome || c.nome.trim().length === 0).length;
    const vista = new Set<string>();
    const duplicadas = lista.filter((c) => {
      const chave = c.nome.trim().toLowerCase();
      if (vista.has(chave)) return true;
      vista.add(chave);
      return false;
    }).length;

    return { validas: lista, vazias, duplicadas };
  }

  private mapaPorId(config: ConfiguracaoGeral | null | undefined): Map<string, string> {
    const map = new Map<string, string>();
    for (const c of this.listarComodidades(config)) {
      if (!map.has(c.id)) map.set(c.id, c.nome);
    }
    return map;
  }

  private mapaPorNome(config: ConfiguracaoGeral | null | undefined): Map<string, string> {
    const map = new Map<string, string>();
    for (const c of this.listarComodidades(config)) {
      map.set(c.nome.trim().toLowerCase(), c.nome);
    }
    return map;
  }

  /** Mapeia o nome canônico (minúsculas) de uma comodidade para o seu ID. */
  private mapaPorNomeParaId(config: ConfiguracaoGeral | null | undefined): Map<string, string> {
    const map = new Map<string, string>();
    for (const c of this.listarComodidades(config)) {
      map.set(c.nome.trim().toLowerCase(), c.id);
    }
    return map;
  }

  /**
   * UUID estável e determinístico por nome (para o formato legado CSV).
   * Gera um UUID v5-like a partir do nome, de modo que o mesmo nome sempre
   * produz o mesmo ID — mas sem a colisão por texto puro do id = nome.toLowerCase().
   */
  private idEstavel(nome: string): string {
    const normalizado = nome.trim().toLowerCase();
    if (!normalizado) {
      return '00000000-0000-4000-8000-000000000000';
    }

    // SHA-256 (256 bits, colisão praticamente impossível) do nome normalizado,
    // reduzido aos primeiros 128 bits e formatado como UUID v4 determinístico.
    // O mesmo nome sempre gera o mesmo UUID, em qualquer navegador/máquina —
    // preservando o vínculo UH↔comodidade sem risco de colisão.
    const hex = CryptoJS.SHA256(normalizado).toString(); // 64 hex chars
    const h = hex.slice(0, 32); // 128 bits (32 hex chars, índices 0..31)

    // Mapeia os 128 bits para a estrutura canônica de UUID v4 (8-4-4-4-12 hex),
    // forçando a versão (nibble mais significativo do 3º grupo = '4') e a
    // variante RFC 4122 (nibble mais significativo do 4º grupo = '8').
    const timeLow = h.slice(0, 8);
    const timeMid = h.slice(8, 12);
    const timeHiAndVersion = '4' + h.slice(13, 16);
    const clockSeqHiVariant = '8' + h.slice(17, 20);
    const node = h.slice(20, 32);

    return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqHiVariant}-${node}`;
  }
}