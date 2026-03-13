import { ItemOrcamento } from './item-orcamento.model';

export interface OrcamentoOficial {
  tipo: 'orcamento';
  id: string;
  titulo: string;
  cliente: string;
  evento?: string;
  dataGeracao: Date;
  dataValidade: Date;
  itens: ItemOrcamento[];
  observacoes?: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'cancelado';
  assinatura?: string; // Hash para validar integridade
}

export interface OrcamentoOficialCompleto extends OrcamentoOficial {
  subtotal: number;
  impostos: number;
  total: number;
}
