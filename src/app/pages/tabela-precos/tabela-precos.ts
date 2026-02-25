import { Component, OnInit, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

// Services
import { TarifaService, CategoriaQuarto } from '../../services/tarifa';
import { ImpressaoTabelaService } from '../../services/impressao-tabela';

// Registra a localização pt-BR
registerLocaleData(localePt);

interface GrupoUHs {
  prioridade: number;
  uhs: string;
  itens: CategoriaQuarto[];
}

@Component({
  selector: 'app-tabela-precos',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, ToastModule, MessageModule],
  providers: [MessageService, { provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './tabela-precos.html',
  styleUrls: ['./tabela-precos.scss'],
})
export class TabelaPrecosComponent implements OnInit {
  @Output() onVoltar = new EventEmitter<void>();

  temporadaAtual: 'alta' | 'baixa' = 'baixa';
  categorias: CategoriaQuarto[] = [];
  grupos: GrupoUHs[] = [];
  config: any = {
    altaInicio: '2025-12-15',
    altaFim: '2026-03-15',
  };

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private impressaoService: ImpressaoTabelaService,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.gerarTabela(this.temporadaAtual);
  }

  carregarDados() {
    const categoriasRaw = this.tarifaService.getCategorias();
    this.categorias = categoriasRaw.map((cat) => this.normalizarCategoria(cat));
    const savedConfig = this.tarifaService.getConfiguracao();
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
  }

  private normalizarCategoria(cat: CategoriaQuarto): CategoriaQuarto {
    return {
      ...cat,
      camasCasal: cat.camasCasal ?? 0,
      camasSolteiro: cat.camasSolteiro ?? 0,
      descricao: cat.descricao ?? '',
      numeros: cat.numeros ?? [],
      comodidadesSelecionadas: cat.comodidadesSelecionadas ?? [],
    };
  }

  gerarTabela(temporada: 'alta' | 'baixa') {
    this.temporadaAtual = temporada;

    if (this.categorias.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nenhuma categoria encontrada. Configure primeiro no Painel Master.',
      });
      return;
    }

    const categoriasComUHs = this.categorias.filter((c) => c.numeros && c.numeros.length > 0);

    if (categoriasComUHs.length === 0) {
      this.grupos = [];
      return;
    }

    this.grupos = this.agruparCategorias(categoriasComUHs);
  }

  agruparCategorias(categorias: CategoriaQuarto[]): GrupoUHs[] {
    const grupos: GrupoUHs[] = [];
    const processados = new Set<string>();

    categorias.forEach((cat) => {
      if (processados.has(cat.id)) return;

      const catNumeros = cat.numeros ? [...cat.numeros].sort() : [];

      const mesmoGrupo = categorias.filter((c) => {
        const cNumeros = c.numeros ? [...c.numeros].sort() : [];
        return JSON.stringify(cNumeros) === JSON.stringify(catNumeros);
      });

      mesmoGrupo.forEach((c) => processados.add(c.id));

      let prioridade = 3;
      const nomeLower = (cat.nome || '').toLowerCase();
      const temCasal = (cat.camasCasal || 0) > 0;

      if (
        nomeLower.includes('master') ||
        nomeLower.includes('deluxe') ||
        (temCasal && !nomeLower.includes('superior'))
      ) {
        prioridade = 1;
      } else if (mesmoGrupo.length > 1) {
        prioridade = 2;
      }

      grupos.push({
        prioridade,
        uhs: catNumeros.join(', '),
        itens: mesmoGrupo,
      });
    });

    return grupos.sort((a, b) => a.prioridade - b.prioridade);
  }

  getPreco(item: CategoriaQuarto): [number, number] {
    if (this.temporadaAtual === 'alta') {
      return [item.precoAltaCafe, item.precoAltaSemCafe];
    } else {
      return [item.precoBaixaCafe, item.precoBaixaSemCafe];
    }
  }

  getCamasText(item: CategoriaQuarto): string {
    const camas: string[] = [];
    if (item.camasCasal && item.camasCasal > 0) {
      camas.push(`${item.camasCasal} Cama de Casal`);
    }
    if (item.camasSolteiro && item.camasSolteiro > 0) {
      camas.push(`${item.camasSolteiro} Cama de Solteiro`);
    }
    return camas.join(' e ') || 'Configuração de camas não definida';
  }

  getLabelSufixo(item: CategoriaQuarto, grupo: GrupoUHs): string {
    if (grupo.itens.length <= 1) return '';

    const nomeLower = item.nome.toLowerCase();
    if (
      nomeLower.includes('pessoa') ||
      nomeLower.includes('single') ||
      nomeLower.includes('1') ||
      item.capacidadeMaxima === 1
    ) {
      return ' (1 Pessoa)';
    }
    return ' (Casal ou adulto com criança)';
  }

  getTituloCategoria(nome: string): string {
    return (
      nome.split('(')[0].replace('Casal', '').replace('1 Pessoa', '').toUpperCase().trim() ||
      'CATEGORIA'
    );
  }

  getTituloTemporada(): string {
    return this.temporadaAtual === 'alta' ? 'ALTA' : 'BAIXA';
  }

  imprimir() {
    const temporada = this.temporadaAtual === 'alta' ? 'Alta' : 'Baixa';
    const titulo = `Tabela de Preços - ${temporada} Temporada`;
    this.impressaoService.imprimirTabela('folha-a4', titulo);
  }

  voltar() {
    this.onVoltar.emit();
  }
}
