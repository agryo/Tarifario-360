import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

// Services
import { TarifaService } from '../../services/tarifa';
import { ImpressaoService } from '../../utils/impressao-service';
import { MensagemUtils } from '../../utils/mensagem-utils';

// Model impressão
import { IMPRESSAO_TABELA_PRECOS_CSS } from '../../utils/print-styles';

// Models
import { CategoriaQuarto } from '../../models/categoria-quarto.model';
import { ConfiguracaoGeral } from '../../models/tarifa.model';

interface GrupoUHs {
  prioridade: number;
  uhs: string;
  itens: CategoriaQuarto[];
  comodidades: string;
}

@Component({
  selector: 'app-tabela-precos',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, ToastModule, MessageModule],
  providers: [],
  templateUrl: './tabela-precos.html',
  styleUrls: ['./tabela-precos.scss'],
})
export class TabelaPrecosComponent implements OnInit {
  temporadaAtual = signal<'alta' | 'baixa'>('baixa');
  categorias = signal<CategoriaQuarto[]>([]);
  grupos = signal<GrupoUHs[]>([]);
  config = signal<ConfiguracaoGeral | undefined>(undefined);
  carregando = signal(false);

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
    private impressaoService: ImpressaoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.carregando.set(true);
    await this.carregarDados();
    this.gerarTabela(this.temporadaAtual());
    this.carregando.set(false);
    this.cdr.detectChanges();
  }

  async carregarDados() {
    const categoriasRaw = await this.tarifaService.getCategorias();
    this.categorias.set(categoriasRaw.map((cat) => this.normalizarCategoria(cat)));
    this.config.set(await this.tarifaService.getConfiguracao());
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
    this.temporadaAtual.set(temporada);

    if (this.categorias().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nenhuma categoria encontrada. Configure primeiro no Painel Master.',
      });
      return;
    }

    const categoriasComUHs = this.categorias().filter((c) => c.numeros && c.numeros.length > 0);

    if (categoriasComUHs.length === 0) {
      this.grupos.set([]);
      return;
    }

    this.grupos.set(this.agruparCategorias(categoriasComUHs));
  }

  agruparCategorias(categorias: CategoriaQuarto[]): GrupoUHs[] {
    const grupos: GrupoUHs[] = [];
    const processados = new Set<string>();

    // Obter comodidades globais do config
    const comodidadesGlobais = this.config()?.comodidadesGlobais
      ? this.config()!.comodidadesGlobais.split(',').map(c => c.trim()).filter(c => c.length > 0)
      : [];

    categorias.forEach((cat) => {
      if (processados.has(cat.id)) return;

      const catNumeros = [...(cat.numeros ?? [])].sort();

      const mesmoGrupo = categorias.filter((c) => {
        const cNumeros = [...(c.numeros ?? [])].sort();
        return JSON.stringify(cNumeros) === JSON.stringify(catNumeros);
      });

      mesmoGrupo.forEach((c) => processados.add(c.id));

      let prioridade = 3;
      const nomeLower = (cat.nome || '').toLowerCase();
      const temCasal = (cat.camasCasal ?? 0) > 0;

      if (
        nomeLower.includes('master') ||
        nomeLower.includes('deluxe') ||
        (temCasal && !nomeLower.includes('superior'))
      ) {
        prioridade = 1;
      } else if (mesmoGrupo.length > 1) {
        prioridade = 2;
      }

      // Combinar comodidades da categoria + globais
      const comodidadesCategoria = cat.comodidadesSelecionadas || [];
      const todasComodidades = [...new Set([...comodidadesCategoria, ...comodidadesGlobais])];

      grupos.push({
        prioridade,
        uhs: catNumeros.join(', '),
        itens: mesmoGrupo,
        comodidades: todasComodidades.join(', ') || '',
      });
    });

    return grupos.sort((a, b) => a.prioridade - b.prioridade);
  }

  getPreco(item: CategoriaQuarto): [number, number] {
    if (this.temporadaAtual() === 'alta') {
      return [item.precoAltaCafe, item.precoAltaSemCafe];
    } else {
      return [item.precoBaixaCafe, item.precoBaixaSemCafe];
    }
  }

  getCamasText(item: CategoriaQuarto): string {
    return MensagemUtils.formatarCamas(item) || 'Configuração de camas não definida';
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
    return this.temporadaAtual() === 'alta' ? 'ALTA' : 'BAIXA';
  }

  imprimir() {
    const elemento = document.getElementById('folha-a4');
    if (elemento) {
      const temporada = this.temporadaAtual() === 'alta' ? 'Alta' : 'Baixa';
      this.impressaoService.imprimirElemento(
        elemento,
        `Tabela de Preços - ${temporada} Temporada`,
        IMPRESSAO_TABELA_PRECOS_CSS,
      );
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Elemento de impressão não encontrado.',
      });
    }
  }

  voltar() {
    this.router.navigate(['/']);
  }
}
