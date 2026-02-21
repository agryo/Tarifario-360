import { Injectable } from '@angular/core';
import { ImpressaoTabelCSS } from './impressao-styles';

@Injectable({
  providedIn: 'root',
})
export class ImpressaoTabelaService {
  /**
   * Abre uma pop-up com o conteúdo do elemento especificado e dispara a impressão.
   * @param elementId ID do elemento HTML que contém a tabela a ser impressa.
   * @param tituloPersonalizado Título personalizado para a janela (ex: "Tabela de Preços Alta Temporada").
   *                            Se não informado, usa um título genérico.
   */
  imprimirTabela(elementId: string, tituloPersonalizado?: string): void {
    const elemento = document.getElementById(elementId);
    if (!elemento) {
      console.error(`Elemento com ID "${elementId}" não encontrado.`);
      return;
    }

    // Clona o elemento para não alterar o original
    const conteudo = elemento.cloneNode(true) as HTMLElement;

    // Calcula posição para centralizar a pop-up
    const largura = 1024;
    const altura = 768;
    const left = (window.screen.width - largura) / 2;
    const top = (window.screen.height - altura) / 2;

    // Formata o título da janela: se não for fornecido, usa "Imprimir Tabela de Preços"
    const tituloJanela = tituloPersonalizado || 'Imprimir Tabela de Preços';

    // CSS completo (service/impressao-styles.ts)
    const estilos = ImpressaoTabelCSS;

    // Abre pop-up centralizada
    const janela = window.open(
      '',
      '_blank',
      `width=${largura},height=${altura},left=${left},top=${top}`,
    );
    if (!janela) {
      alert('Permita pop-ups para imprimir a tabela.');
      return;
    }

    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${tituloJanela}</title>
        <meta charset="UTF-8">
        <style>${estilos}</style>
      </head>
      <body>
        ${conteudo.outerHTML}
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
              setTimeout(() => window.close(), 1000);
            }, 500);
          };
        <\/script>
      </body>
      </html>
    `);
    janela.document.close();
  }

  /**
   * Formata o título para ter a primeira letra de cada palavra em maiúscula,
   * exceto artigos e preposições (opcional, mas aqui mantém simples).
   * Exemplo: "TABELA DE PREÇOS ALTA TEMPORADA" -> "Tabela de Preços Alta Temporada"
   */
  private formatarTitulo(titulo: string): string {
    // Converte para minúsculas e depois capitaliza a primeira letra de cada palavra
    return titulo.toLowerCase().replace(/\b\w/g, (letra) => letra.toUpperCase());
  }
}
