import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';
import { OrcamentoOficial, OrcamentoOficialCompleto } from '../models/orcamento-oficial.model';
import { ItemOrcamento, ItemDiaria } from '../models/item-orcamento.model';

@Injectable({
  providedIn: 'root',
})
export class OrcamentoOficialService {
  private readonly STORAGE_KEY = 'orcamentos_oficiais';

  constructor(
    private storage: StorageService,
    private criptografia: CriptografiaService,
  ) {}

  criarOrcamento(titulo: string, cliente: string): OrcamentoOficial {
    const orcamento: OrcamentoOficial = {
      tipo: 'orcamento',
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
    // Adiciona uma camada de validação para garantir que apenas orçamentos válidos sejam salvos.
    // Isso impede que um arquivo de backup, por exemplo, seja salvo como um orçamento.
    if (
      !orcamento ||
      orcamento.tipo !== 'orcamento' ||
      !orcamento.id ||
      !orcamento.titulo ||
      !Array.isArray(orcamento.itens)
    ) {
      throw new Error('Dados inválidos. O objeto a ser salvo não é um orçamento válido.');
    }
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

  exportarParaJSON(orcamento: OrcamentoOficial): string {
    // Garante que o orçamento tenha a assinatura mais recente antes de exportar
    const { assinatura, ...dados } = orcamento;
    const orcamentoComAssinatura: OrcamentoOficial = {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };
    return JSON.stringify(orcamentoComAssinatura, null, 2);
  }

  downloadOrcamento(orcamento: OrcamentoOficial): void {
    // Garante assinatura antes de criptografar
    const { assinatura, ...dados } = orcamento;
    const orcamentoAssinado: OrcamentoOficial = {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };

    const encryptedData = this.criptografia.criptografarDados(orcamentoAssinado);
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Usa extensão .ortf (Orçamento Tarifario File) para evitar conflitos
    link.download = `Orcamento_${orcamento.cliente.replace(/\s+/g, '_')}.ortf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importarDeJSON(json: string): {
    sucesso: boolean;
    orcamento: OrcamentoOficial | null;
    mensagem: string;
  } {
    try {
      // Tenta descriptografar (formato .ortf)
      const orcamento = this.criptografia.descriptografarDados(json);

      if (!orcamento) {
        throw new Error('Arquivo criptografado inválido.');
      }

      // 0. Validação do tipo de arquivo
      if (orcamento.tipo !== 'orcamento') {
        return {
          sucesso: false,
          orcamento: null,
          mensagem: 'Arquivo inválido. Este não é um arquivo de orçamento.',
        };
      }

      // 1. Validação de estrutura
      if (!orcamento.id || !orcamento.titulo || !orcamento.itens) {
        return {
          sucesso: false,
          orcamento: null,
          mensagem: 'Estrutura do JSON do orçamento é inválida.',
        };
      }

      // 2. Validação da assinatura de segurança
      const { assinatura, ...dadosParaVerificar } = orcamento;
      if (!assinatura) {
        return {
          sucesso: false,
          orcamento: null,
          mensagem: 'Arquivo de orçamento inválido ou antigo (sem assinatura).',
        };
      }

      const hashCalculado = this.criptografia.gerarHash(JSON.stringify(dadosParaVerificar));
      if (hashCalculado !== assinatura) {
        return {
          sucesso: false,
          orcamento: null,
          mensagem: 'Assinatura do orçamento inválida. O arquivo pode estar corrompido.',
        };
      }

      return { sucesso: true, orcamento: orcamento, mensagem: 'Orçamento importado com sucesso!' };
    } catch (error: any) {
      console.error('Erro ao importar orçamento de JSON:', error.message);
      return {
        sucesso: false,
        orcamento: null,
        mensagem: 'Arquivo de orçamento inválido ou corrompido.',
      };
    }
  }

  importarDados(orcamentos: OrcamentoOficial[]): void {
    this.storage.set(this.STORAGE_KEY, orcamentos || []);
  }
}
