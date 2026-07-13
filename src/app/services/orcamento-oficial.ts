import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { CriptografiaService } from './criptografia';
import { OrcamentosOficiaisRepository } from './repositories/orcamentos-oficiais-repository';
import { ConfigRepositoryFactory } from './config-repository-factory';
import { RepositoryFactory } from './repository-factory';
import { OrcamentoOficial, OrcamentoOficialCompleto } from '../models/orcamento-oficial.model';
import { ItemOrcamento } from '../models/item-orcamento.model';

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
export class OrcamentoOficialService {
  protected readonly STORAGE_KEY = 'orcamentos_oficiais';
  protected readonly ENTITY_TYPE = 'orcamento';

  constructor(
    private storage: StorageService,
    private criptografia: CriptografiaService,
    private configFactory: ConfigRepositoryFactory,
    private repoFactory: RepositoryFactory,
  ) {}

  private get orcamentosRepo(): OrcamentosOficiaisRepository {
    return this.repoFactory.getOrcamentosOficiaisRepo();
  }

  protected criarEntidade(dados: Partial<OrcamentoOficial>): OrcamentoOficial {
    return {
      ...dados,
      id: this.storage.generateId(),
    } as OrcamentoOficial;
  }

  protected validarEntidade(entidade: unknown): entidade is OrcamentoOficial {
    return (
      entidade !== null &&
      typeof entidade === 'object' &&
      'id' in entidade &&
      'tipo' in entidade &&
      (entidade as Record<string, unknown>)['tipo'] === this.ENTITY_TYPE
    );
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

  /**
   * Cria orçamento completo com todos os dados do formulário
   */
  criarOrcamentoCompleto(params: {
    titulo: string;
    cliente: string;
    temporada: string;
    dataCheckin: Date;
    dataCheckout: Date;
    horaEntrada: string;
    horaSaida: string;
    itens: ItemOrcamento[];
  }): OrcamentoOficial {
    const orcamento: OrcamentoOficial = {
      ...this.criarEntidade({}),
      tipo: 'orcamento',
      titulo: params.titulo,
      cliente: params.cliente,
      dataGeracao: new Date(),
      dataValidade: new Date(new Date().setDate(new Date().getDate() + 7)),
      dataCheckin: params.dataCheckin,
      dataCheckout: params.dataCheckout,
      horaEntrada: params.horaEntrada,
      horaSaida: params.horaSaida,
      temporada: params.temporada as 'auto' | 'baixa' | 'alta',
      itens: params.itens,
      status: 'rascunho',
    };

    return orcamento;
  }

  async listar(): Promise<OrcamentoOficial[]> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        return await this.orcamentosRepo.getAll();
      }
    } catch (error) {
      console.warn('Falha ao buscar orçamentos do Supabase, usando localStorage:', error);
    }
    return this.storage.get<OrcamentoOficial[]>(this.STORAGE_KEY) || [];
  }

  async buscarPorId(id: string): Promise<OrcamentoOficial | null> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        return await this.orcamentosRepo.getById(id);
      }
    } catch (error) {
      console.warn('Falha ao buscar orçamento do Supabase, usando localStorage:', error);
    }
    const lista = await this.listar();
    return lista.find((e) => e.id === id) || null;
  }

  async salvar(orcamento: OrcamentoOficial): Promise<void> {
    if (!this.validarEntidade(orcamento)) {
      throw new Error(`Dados inválidos. O objeto não é um ${this.ENTITY_TYPE} válido.`);
    }

    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        const existing = await this.orcamentosRepo.getById(orcamento.id);
        if (existing) {
          await this.orcamentosRepo.update(orcamento.id, orcamento);
        } else {
          // Não enviar ID para o Supabase - deixar o banco gerar UUID
          const { id, ...orcamentoSemId } = orcamento;
          await this.orcamentosRepo.create(orcamentoSemId);
        }
      }
    } catch (error) {
      console.warn('Falha ao salvar orçamento no Supabase:', error);
    }

    // Fallback to localStorage
    const lista = await this.listar();
    const index = lista.findIndex((e) => e.id === orcamento.id);
    if (index >= 0) {
      lista[index] = orcamento;
    } else {
      lista.push(orcamento);
    }
    this.storage.set(this.STORAGE_KEY, lista);
  }

  async excluir(id: string): Promise<void> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        await this.orcamentosRepo.delete(id);
      }
    } catch (error) {
      console.warn('Falha ao excluir orçamento do Supabase:', error);
    }
    const lista = (await this.listar()).filter((e) => e.id !== id);
    this.storage.set(this.STORAGE_KEY, lista);
  }

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

  exportarParaJSON(orcamento: OrcamentoOficial): string {
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

  async limpar(): Promise<void> {
    try {
      if (this.configFactory.getBackend() === 'supabase' || this.configFactory.getBackend() === 'supabase-direct') {
        // Would need bulk delete - skip for now
      }
    } catch (error) {
      console.warn('Falha ao limpar orçamentos do Supabase:', error);
    }
    this.storage.remove(this.STORAGE_KEY);
  }
}