import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { OrcamentoOficial, OrcamentoOficialCompleto } from '../models/orcamento-oficial.model';
import { ItemOrcamento, ItemDiaria } from '../models/item-orcamento.model';

@Injectable({
  providedIn: 'root',
})
export class OrcamentoOficialService {
  private readonly STORAGE_KEY = 'orcamentos_oficiais';

  constructor(private storage: StorageService) {}

  criarOrcamento(titulo: string, cliente: string): OrcamentoOficial {
    const orcamento: OrcamentoOficial = {
      id: this.storage.generateId(),
      titulo,
      cliente,
      dataGeracao: new Date(),
      dataValidade: new Date(new Date().setDate(new Date().getDate() + 7)),
      itens: [],
      status: 'rascunho',
    };

    return orcamento;
  }

  salvarOrcamento(orcamento: OrcamentoOficial): void {
    const orcamentos = this.listarOrcamentos();
    const index = orcamentos.findIndex((o) => o.id === orcamento.id);

    if (index >= 0) {
      orcamentos[index] = orcamento;
    } else {
      orcamentos.push(orcamento);
    }

    this.storage.set(this.STORAGE_KEY, orcamentos);
  }

  listarOrcamentos(): OrcamentoOficial[] {
    return this.storage.get<OrcamentoOficial[]>(this.STORAGE_KEY) || [];
  }

  getOrcamento(id: string): OrcamentoOficial | null {
    const orcamentos = this.listarOrcamentos();
    return orcamentos.find((o) => o.id === id) || null;
  }

  excluirOrcamento(id: string): void {
    const orcamentos = this.listarOrcamentos().filter((o) => o.id !== id);
    this.storage.set(this.STORAGE_KEY, orcamentos);
  }

  calcularTotais(orcamento: OrcamentoOficial): OrcamentoOficialCompleto {
    const subtotal = orcamento.itens.reduce(
      (acc, item) => acc + item.valorUnitario * item.quantidade,
      0,
    );

    // Exemplo: 5% de impostos
    const impostos = subtotal * 0.05;

    return {
      ...orcamento,
      subtotal,
      impostos,
      total: subtotal + impostos,
    };
  }

  adicionarItem(orcamento: OrcamentoOficial, item: ItemOrcamento): OrcamentoOficial {
    item.id = this.storage.generateId();
    orcamento.itens.push(item);
    return orcamento;
  }

  removerItem(orcamento: OrcamentoOficial, itemId: string): OrcamentoOficial {
    orcamento.itens = orcamento.itens.filter((i) => i.id !== itemId);
    return orcamento;
  }

  gerarAssinatura(orcamento: OrcamentoOficial): string {
    // Simplificado - em produção use algo mais robusto
    const dados = {
      id: orcamento.id,
      total: this.calcularTotais(orcamento).total,
      data: orcamento.dataGeracao,
    };
    return btoa(JSON.stringify(dados));
  }

  exportarParaJSON(orcamento: OrcamentoOficial): string {
    return JSON.stringify(orcamento, null, 2);
  }

  importarDeJSON(json: string): OrcamentoOficial | null {
    try {
      const orcamento = JSON.parse(json) as OrcamentoOficial;
      // Validar se é um orçamento válido
      if (!orcamento.id || !orcamento.titulo || !orcamento.itens) {
        throw new Error('JSON inválido');
      }
      return orcamento;
    } catch {
      return null;
    }
  }
}
