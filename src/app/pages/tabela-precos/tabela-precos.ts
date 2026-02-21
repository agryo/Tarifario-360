import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

// Services
import { TarifaService, CategoriaQuarto } from '../../services/tarifa';

interface GrupoUHs {
  prioridade: number;
  uhs: string;
  itens: CategoriaQuarto[];
}

@Component({
  selector: 'app-tabela-precos',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, ToastModule, MessageModule],
  providers: [MessageService],
  templateUrl: './tabela-precos.html',
  styleUrls: ['./tabela-precos.scss'],
})
export class TabelaPrecosComponent implements OnInit {
  @Output() onVoltar = new EventEmitter<void>();

  temporadaAtual: 'alta' | 'baixa' = 'baixa';
  categorias: CategoriaQuarto[] = [];
  grupos: GrupoUHs[] = [];
  config: any = {};

  constructor(
    private tarifaService: TarifaService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.gerarTabela(this.temporadaAtual);
  }

  carregarDados() {
    const categoriasRaw = this.tarifaService.getCategorias();
    this.categorias = categoriasRaw.map((cat) => this.normalizarCategoria(cat));
    this.config = this.tarifaService.getConfiguracao();
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
    const elemento = document.getElementById('folha-a4');
    if (!elemento) return;

    const conteudo = elemento.cloneNode(true) as HTMLElement;

    // TODO O CSS QUE VOCÊ JÁ TINHA (COPIADO INTEGRALMENTE DO SEU ARQUIVO .SCSS)
    const estilos = `
    .no-print {
      background: white;
      padding: 12px;
      border-radius: 8px;
      margin: 20px auto 10px auto;
      width: 100%;
      max-width: 1100px;
      display: flex;
      gap: 8px;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      border-top: 4px solid #075e54;
    }

    .btn {
      padding: 10px 18px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 13px;
      color: white;
      transition: 0.2s;
      text-transform: uppercase;
    }

    .btn-baixa {
      background: #218838;
    }

    .btn-alta {
      background: #c82333;
    }

    .btn-print {
      background: #343a40;
    }

    .btn-voltar {
      background: #6c757d;
    }

    .page {
      background: white;
      width: 100%;
      max-width: 1100px;
      min-height: 297mm;
      padding: 5mm 10mm;
      margin: 0 auto;
      box-sizing: border-box;
      color: #000;
      display: block;
    }

    .header {
      text-align: center;
      margin-bottom: 8px;
    }

    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      padding-bottom: 2px;
      display: inline-block;
    }

    .titulo-baixa {
      color: #218838;
      border-bottom: 3px solid #218838;
    }

    .titulo-alta {
      color: #c82333;
      border-bottom: 3px solid #c82333;
    }

    .tabela-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .bloco-categoria {
      border: 1.5px solid #000;
      width: 100%;
      page-break-inside: avoid;
      margin-bottom: 2px;
    }

    .numero-uh-topo {
      background: #eee;
      border-bottom: 1.5px solid #000;
      padding: 2px 8px;
      font-size: 18px;
      font-weight: 900;
    }

    .conteudo-detalhes {
      padding: 4px 8px;
    }

    .titulo-uh {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .comodidades-gerais {
      font-size: 14px;
      line-height: 1.2;
      color: #333;
      margin-bottom: 4px;
    }

    .item-preco-linha {
      font-size: 14px;
      margin-top: 2px;
      padding-top: 2px;
      border-top: 1px dashed #ccc;
    }

    .desc-especifica {
      font-weight: bold;
      color: #000;
      font-size: 14px;
    }

    .preco-texto {
      font-size: 14px;
      font-weight: 900;
    }

    .sem-cafe {
      font-size: 14px;
      color: #dc3545;
      font-weight: 900;
    }

    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }

      body {
        margin: 0;
        padding: 0;
        background: white;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .no-print {
        display: none !important;
      }

      .page {
        margin: 0;
        box-shadow: none;
        width: 100%;
        padding: 0;
        min-height: auto;
        max-width: 100% !important;
        box-sizing: border-box;
      }

      .page .header h1 {
        font-size: 20px;
        margin-top: 0;
        margin-bottom: 2px;
      }

      .page .tabela-container {
        gap: 2px;
      }

      .page .bloco-categoria {
        border: 1px solid #000;
        margin-bottom: 2px;
        width: 100%;
        box-sizing: border-box;
      }

      .page .bloco-categoria .numero-uh-topo {
        font-size: 15px;
        padding: 2px 5px;
      }

      .page .bloco-categoria .conteudo-detalhes {
        padding: 2px 5px;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .page .bloco-categoria .titulo-uh {
        font-size: 13px;
        margin-bottom: 1px;
      }

      .page .bloco-categoria .comodidades-gerais {
        font-size: 12px;
        line-height: 1.2;
        margin-bottom: 2px;
        white-space: normal !important;
        word-break: break-word;
      }

      .page .bloco-categoria .item-preco-linha {
        font-size: 12px;
        margin-top: 1px;
        padding-top: 1px;
        border-top: 0.5px dashed #ccc;
      }

      .page .bloco-categoria .item-preco-linha .desc-especifica {
        font-size: 12px;
      }

      .page .bloco-categoria .item-preco-linha .preco-texto {
        font-size: 13px;
      }

      .page .bloco-categoria .item-preco-linha .preco-texto .sem-cafe {
        font-size: 13px;
      }

      .page .bloco-categoria .item-preco-linha .preco-texto .sufixo-label {
        font-size: 9px;
      }
    }
  `;

    const janela = window.open('', '_blank');
    if (!janela) {
      alert('Permita pop-ups para imprimir a tabela.');
      return;
    }

    janela.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Imprimir Tabela de Preços</title>
      <meta charset="UTF-8">
      <style>${estilos}</style>
    </head>
    <body>
      ${conteudo.outerHTML}
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            // window.onafterprint = () => window.close(); // opcional
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `);
    janela.document.close();
  }

  voltar() {
    this.onVoltar.emit();
  }
}
