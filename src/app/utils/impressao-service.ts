import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImpressaoService {
  imprimirElemento(elemento: HTMLElement, titulo?: string, estilosAdicionais?: string): void {
    if (!elemento) {
      console.error('Elemento não encontrado para impressão.');
      return;
    }

    const conteudo = elemento.cloneNode(true) as HTMLElement;
    const elementosNoPrint = conteudo.querySelectorAll('.no-print');
    elementosNoPrint.forEach((el) => el.remove());

    const largura = 1024;
    const altura = 768;
    const left = (window.screen.width - largura) / 2;
    const top = (window.screen.height - altura) / 2;

    const tituloJanela = titulo || 'Imprimir';

    // Estilos base mínimos APENAS para tela (não impressão).
    // As regras @media print e @page vêm do estilosAdicionais (print-styles.ts)
    // para evitar conflitos de especificidade e duplicação de @page.
    const estilosBase = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: white;
        color: black;
        padding: 20px;
      }
      .no-print, .no-print * {
        display: none !important;
      }
      @media screen {
        /* Garante que .no-print suma na tela da janela de impressão também */
        .no-print { display: none !important; }
      }
    `;

    const janela = window.open(
      '',
      '_blank',
      `width=${largura},height=${altura},left=${left},top=${top},toolbar=0,location=0,menubar=0`,
    );

    if (!janela) {
      alert('Permita pop-ups para imprimir.');
      return;
    }

    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${tituloJanela}</title>
        <meta charset="UTF-8">
        <style>${estilosBase}${estilosAdicionais ? '\n' + estilosAdicionais : ''}</style>
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
}
