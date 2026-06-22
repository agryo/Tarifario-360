import { Injectable } from '@angular/core';
import { BaseStorageService } from './base-storage';
import { CriptografiaService } from './criptografia';
import { OrcamentoOficial, OrcamentoOficialCompleto } from '../models/orcamento-oficial.model';
import { ItemOrcamento } from '../models/item-orcamento.model';
import { StorageService } from './storage';

export type { OrcamentoOficial, OrcamentoOficialCompleto };

interface OrcamentoOficialImportado {
  tipo: string;
  id: string;
  titulo: string;
  cliente: string;
  dataGeracao: string | Date;
  dataValidade: string | Date;
  dataCheckin: string | Date;
  dataCheckout: string | Date;
  horaEntrada?: string;
  horaSaida?: string;
  temporada?: string;
  itens: ItemOrcamento[];
  status: string;
  assinatura?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class OrcamentoOficialService extends BaseStorageService<OrcamentoOficial> {
  protected readonly STORAGE_KEY = 'orcamentos_oficiais';
  protected readonly ENTITY_TYPE = 'orcamento';

  constructor(
    storage: StorageService,
    private criptografia: CriptografiaService,
  ) {
    super(storage);
  }

  criarOrcamento(titulo: string, cliente: string): OrcamentoOficial {
    const orcamento: OrcamentoOficial = {
      ...this.criarEntidade({}),
      tipo: 'orcamento',
      titulo,
      cliente,
      dataGeracao: new Date(),
      dataValidade: new Date(new Date().setDate(new Date().getDate() + 7)),
      dataCheckin: new Date(),
      dataCheckout: new Date(new Date().setDate(new Date().getDate() + 1)),
      horaEntrada: '14:00',
      horaSaida: '12:00',
      temporada: 'auto',
      itens: [],
      status: 'rascunho',
    };

    return orcamento;
  }

  // Sobrescreve listar para converter datas de string para Date
  override listar(): OrcamentoOficial[] {
    const lista = super.listar();
    return lista.map((orc) => ({
      ...orc,
      dataGeracao: new Date(orc.dataGeracao),
      dataValidade: new Date(orc.dataValidade),
      dataCheckin: new Date(orc.dataCheckin),
      dataCheckout: new Date(orc.dataCheckout),
    }));
  }

  // Sobrescreve validarEntidade para validações específicas do orçamento
  protected override validarEntidade(entidade: unknown): entidade is OrcamentoOficial {
    const baseValida = super.validarEntidade(entidade);
    if (!baseValida) return false;

    const orc = entidade as OrcamentoOficial;
    return (
      !!orc.titulo &&
      Array.isArray(orc.itens)
    );
  }

  // Métodos específicos de negócio (não genéricos)
  calcularTotais(orcamento: OrcamentoOficial): OrcamentoOficialCompleto {
    const subtotal = orcamento.itens.reduce(
      (acc, item) => acc + item.precoDiaria * item.quantidade,
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

  override exportarParaJSON(orcamento: OrcamentoOficial): string {
    // Garante que o orçamento tenha a assinatura mais recente antes de exportar
    const { assinatura, ...dados } = orcamento;
    const orcamentoComAssinatura: OrcamentoOficial = {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };
    return JSON.stringify(orcamentoComAssinatura, null, 2);
  }

  async downloadOrcamento(orcamento: OrcamentoOficial): Promise<void> {
    // Garante assinatura antes de criptografar
    const { assinatura, ...dados } = orcamento;
    const orcamentoAssinado: OrcamentoOficial = {
      ...dados,
      assinatura: this.criptografia.gerarHash(JSON.stringify(dados)),
    };

    // Usa segredo de backup (portável) para permitir importação em outras máquinas
    const encryptedData = await this.criptografia.criptografarDados(orcamentoAssinado, true);
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Usa extensão .ortf (Orçamento Tarifario File) para evitar conflitos
    link.download = `Orcamento_${orcamento.cliente.replace(/\s+/g, '_')}.ortf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importarDeJSON(json: string): Promise<{
    sucesso: boolean;
    orcamento: OrcamentoOficial | null;
    mensagem: string;
  }> {
    try {
      // Tenta descriptografar (formato .ortf) - usa segredo de backup (portável)
      const orcamentoImportado = (await this.criptografia.descriptografarDados(json, true)) as OrcamentoOficialImportado | null;

      if (!orcamentoImportado) {
        throw new Error('Arquivo criptografado inválido.');
      }

      // 0. Validação do tipo de arquivo
      if (orcamentoImportado.tipo !== 'orcamento') {
        return {
          sucesso: false,
          orcamento: null,
          mensagem: 'Arquivo inválido. Este não é um arquivo de orçamento.',
        };
      }

      // 1. Validação de estrutura
      if (!orcamentoImportado.id || !orcamentoImportado.titulo || !orcamentoImportado.itens) {
        return {
          sucesso: false,
          orcamento: null,
          mensagem: 'Estrutura do JSON do orçamento é inválida.',
        };
      }

      // 2. Validação da assinatura de segurança
      const { assinatura, ...dadosParaVerificar } = orcamentoImportado;
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

      // Cast para OrcamentoOficial após validação completa
      const orcamento = orcamentoImportado as OrcamentoOficial;
      return { sucesso: true, orcamento, mensagem: 'Orçamento importado com sucesso!' };
    } catch (error: any) {
      console.error('Erro ao importar orçamento de JSON:', error.message);
      return {
        sucesso: false,
        orcamento: null,
        mensagem: 'Arquivo de orçamento inválido ou corrompido.',
      };
    }
  }
}