/**
 * Estilos de impressão compartilhados (base + variantes específicas)
 * Substitui arquivos duplicados em:
 * - src/app/pages/orcamento-oficial/impressao-styles.ts
 * - src/app/pages/escala-noturna/impressao-styles.ts
 * - src/app/pages/tabela-precos/impressao-styles.ts
 */

/**
 * Base CSS comum a todos os documentos de impressão
 */
export const PRINT_BASE_CSS = /* css */ `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background: white !important;
      font-family: Arial, sans-serif;
    }

    .no-print,
    .main-bar,
    p-button,
    .p-button {
      display: none !important;
    }
  }

  html, body {
    margin: 0;
    padding: 0;
    background: white;
  }

  #documento-impressao,
  .documento-impressao {
    font-family: Arial, sans-serif;
    color: #000;
    background: white;
    width: 100%;
    padding: 0;
  }
`;

/**
 * Estilos para tabelas genéricas
 */
export const PRINT_TABLE_CSS = /* css */ `
  .tabela-impressao {
    width: 100%;
    border-collapse: collapse;
    margin: 5px 0;
    border: 1px solid #ddd;
    table-layout: fixed;
  }

  .tabela-impressao th,
  .tabela-impressao td {
    border: 1px solid #ddd;
    padding: 4px 6px;
    font-size: 10px;
    vertical-align: top;
  }

  .tabela-impressao th {
    background: #f4f4f4;
    color: #333;
    font-weight: bold;
    text-align: left;
  }

  .tabela-impressao td div,
  .tabela-impressao td p {
    margin-bottom: 0 !important;
  }

  .alinhar-direita { text-align: right; }
  .alinhar-centro { text-align: center; }
  .alinhar-esquerda { text-align: left; }
`;

/**
 * Estilos para cabeçalho padrão (hotel, logo, info)
 */
export const PRINT_HEADER_CSS = /* css */ `
  .header-doc {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #075e54;
    padding-bottom: 5px;
    margin-bottom: 10px;
  }

  .logo-container img {
    max-width: 80px;
    height: auto;
  }

  .hotel-info-doc {
    text-align: right;
  }

  .hotel-info-doc h1 {
    margin: 0;
    color: #075e54;
    font-size: 15px;
    font-weight: bold;
  }

  .hotel-info-doc p {
    margin: 0;
    font-size: 10pt;
    color: #555;
    line-height: 1.2;
  }

  .titulo-documento {
    text-align: center;
    text-transform: uppercase;
    margin: 10px 0;
    padding: 10px;
    color: #075e54;
    font-size: 20px;
    font-weight: bold;
  }
`;

/**
 * Estilos para rodapé de assinaturas
 */
export const PRINT_SIGNATURE_CSS = /* css */ `
  .rodape-assinaturas {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
  }

  .assinatura {
    width: 45%;
    text-align: center;
    border-top: 1px solid #333;
    padding-top: 8px;
    font-size: 10px;
  }
`;

/**
 * Estilos para notas/observações
 */
export const PRINT_NOTE_CSS = /* css */ `
  .nota {
    text-align: left;
    font-style: italic;
    padding: 8px;
    background: #f9f9f9;
  }

  .total-row td {
    font-weight: bold;
    font-size: 10px;
    background: #e7f3f0;
  }
`;

/**
 * Estilo completo para Orçamento Oficial (A4 Portrait)
 * Combina base + tabela + header + assinatura + nota
 */
export const IMPRESSAO_ORCAMENTO_CSS = /* css */ `
  ${PRINT_BASE_CSS}
  ${PRINT_TABLE_CSS}
  ${PRINT_HEADER_CSS}
  ${PRINT_SIGNATURE_CSS}
  ${PRINT_NOTE_CSS}

  @media print {
    @page {
      size: A4;
      margin: 5mm;
    }
  }

  /* ===== ESTILOS ESPECÍFICOS DO ORÇAMENTO OFICIAL ===== */

  /* Título do orçamento (o HTML usa .titulo-orcamento) */
  #documento-impressao .titulo-orcamento {
    text-align: center;
    text-transform: uppercase;
    margin: 10px 0;
    padding: 10px;
    color: #075e54;
    font-size: 20px;
    font-weight: bold;
  }

  /* Seções - h2, h3 */
  #documento-impressao h2,
  #documento-impressao h3 {
    font-size: 11pt;
    font-weight: bold;
    color: #075e54;
    margin: 12px 0 5px 0;
  }

  /* Textos gerais - p, div */
  #documento-impressao p,
  #documento-impressao div {
    font-size: 10pt;
    line-height: 1.3;
    margin: 0 0 8px 0;
  }

  /* Seção de configuração */
  #documento-impressao .secao-configuracao {
    margin: 10px 0;
  }

  /* Tabela do orçamento */
  #documento-impressao .tabela-orcamento {
    width: 100%;
    border-collapse: collapse;
    margin: 5px 0;
    border: 1px solid #ddd;
    table-layout: fixed;
  }

  #documento-impressao .tabela-orcamento th,
  #documento-impressao .tabela-orcamento td {
    border: 1px solid #ddd;
    padding: 4px 6px;
    font-size: 10px;
    vertical-align: middle;
  }

  /* Alinhamento horizontal por coluna */
  #documento-impressao .tabela-orcamento th:nth-child(1),
  #documento-impressao .tabela-orcamento td:nth-child(1) { text-align: center; }  /* Item/# */
  #documento-impressao .tabela-orcamento th:nth-child(2),
  #documento-impressao .tabela-orcamento td:nth-child(2) { text-align: left; }   /* Acomodação */
  #documento-impressao .tabela-orcamento th:nth-child(3),
  #documento-impressao .tabela-orcamento td:nth-child(3) { text-align: left; }   /* Detalhes/Refeições */
  #documento-impressao .tabela-orcamento th:nth-child(4),
  #documento-impressao .tabela-orcamento td:nth-child(4) { text-align: center; } /* Quantidade */
  #documento-impressao .tabela-orcamento th:nth-child(5),
  #documento-impressao .tabela-orcamento td:nth-child(5) { text-align: right; }  /* Valor Unitário */
  #documento-impressao .tabela-orcamento th:nth-child(6),
  #documento-impressao .tabela-orcamento td:nth-child(6) { text-align: right; }  /* Valor Total */

  #documento-impressao .tabela-orcamento td div,
  #documento-impressao .tabela-orcamento td p {
    margin-bottom: 0 !important;
  }

  #documento-impressao .tabela-orcamento th {
    background: #f4f4f4;
    color: #333;
    font-weight: bold;
  }

  /* Larguras das colunas - Orçamento (thead tem 6 colunas) */
  #documento-impressao .tabela-orcamento th:nth-child(1) { width: 5%; }
  #documento-impressao .tabela-orcamento th:nth-child(2) { width: 28%; }
  #documento-impressao .tabela-orcamento th:nth-child(3) { width: 29%; }
  #documento-impressao .tabela-orcamento th:nth-child(4) { width: 9%; }
  #documento-impressao .tabela-orcamento th:nth-child(5) { width: 18%; }
  #documento-impressao .tabela-orcamento th:nth-child(6) { width: 10%; }

  /* Alinhamento horizontal por coluna - LINHAS NORMAIS (tbody) */
  #documento-impressao .tabela-orcamento tbody td:nth-child(1) { text-align: center; }  /* Qtd */
  #documento-impressao .tabela-orcamento tbody td:nth-child(2) { text-align: left; }   /* Acomodação */
  #documento-impressao .tabela-orcamento tbody td:nth-child(3) { text-align: left; }   /* Serviços */
  #documento-impressao .tabela-orcamento tbody td:nth-child(4) { text-align: right; }  /* Vlr. Diária */
  #documento-impressao .tabela-orcamento tbody td:nth-child(5) { text-align: right; }  /* Diárias */
  #documento-impressao .tabela-orcamento tbody td:nth-child(6) { text-align: right; }  /* Total */

  /* Cabeçalho (thead) */
  #documento-impressao .tabela-orcamento thead th:nth-child(1) { text-align: center; }
  #documento-impressao .tabela-orcamento thead th:nth-child(2) { text-align: left; }
  #documento-impressao .tabela-orcamento thead th:nth-child(3) { text-align: left; }
  #documento-impressao .tabela-orcamento thead th:nth-child(4) { text-align: right; }
  #documento-impressao .tabela-orcamento thead th:nth-child(5) { text-align: right; }
  #documento-impressao .tabela-orcamento thead th:nth-child(6) { text-align: right; }

  /* Linha do TOTAL (tfoot) - tem apenas 2 células: label (colspan=5) e valor */
  #documento-impressao .tabela-orcamento tfoot .total-row td:first-child { text-align: right; }  /* "VALOR TOTAL:" */
  #documento-impressao .tabela-orcamento tfoot .total-row td:last-child { text-align: right; }   /* valor */

  /* Linha de nota opcional (colspan=6, uma única célula) */
  #documento-impressao .tabela-orcamento tfoot tr:not(.total-row) td { text-align: left; }

  /* Alinhamento */
  #documento-impressao .alinhar-direita { text-align: right; }
  #documento-impressao .alinhar-centro { text-align: center; }

  /* Descrição extra (cargo) */
  #documento-impressao .descricao-extra {
    font-size: 9px;
    font-style: italic;
    color: #666;
    margin-top: 2px;
  }

  /* Horas extras */
  #documento-impressao .extra {
    color: #d32f2f;
    display: block;
    font-size: 9px;
  }

  /* Linha de observação */
  #documento-impressao .nota {
    text-align: left;
    font-style: italic;
    padding: 8px;
    background: #f9f9f9;
  }

  /* Linha do total */
  #documento-impressao .total-row td {
    font-weight: bold;
    font-size: 10px;
    background: #e7f3f0;
  }

  /* Rodapé de assinaturas */
  #documento-impressao .rodape-assinaturas {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
  }

  #documento-impressao .assinatura {
    width: 45%;
    text-align: center;
    border-top: 1px solid #333;
    padding-top: 8px;
    font-size: 10px;
  }
`;

/**
 * Estilo completo para Escala Noturna (Landscape)
 */
export const IMPRESSAO_ESCALA_CSS = /* css */ `
  ${PRINT_BASE_CSS}

  @media print {
    @page { size: landscape; margin: 0.5cm; }
  }

  .tabela-area {
    background-color: white !important;
    padding: 25px !important;
    width: 100% !important;
  }

  .tabela-escala table {
    width: 100%;
    border-collapse: collapse !important;
    table-layout: fixed;
    border: 3px solid #000000 !important;
    background-color: #ffffff !important;
  }

  .tabela-escala th,
  .tabela-escala td {
    border: 2.5px solid #000000 !important;
    padding: 0 !important;
    vertical-align: top;
    position: relative;
    overflow: visible !important;
  }

  .tabela-escala th {
    padding: 15px !important;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    color: #ffffff !important;
  }

  .color-folga,
  th.color-folga,
  .color-folga .data-label {
    background-color: #fff176 !important;
    color: #000000 !important;
  }

  .data-label {
    display: block;
    padding: 10px 0;
    width: 100%;
    font-weight: 800;
    text-align: center;
    border-bottom: 2.5px solid #000000;
    color: #ffffff !important;
  }

  .color-0 { background-color: #ff9800 !important; color: #000000 !important; }
  .color-1 { background-color: #9c27b0 !important; }
  .color-2 { background-color: #00bcd4 !important; }
  .color-3 { background-color: #3f51b5 !important; }
  .color-4 { background-color: #795548 !important; }
  .color-5 { background-color: #607d8b !important; }
  .color-6 { background-color: #e91e63 !important; }

  .dia-container {
    display: flex !important;
    flex-direction: row !important;
    min-height: 125px;
    width: 100.2%;
    margin-left: -0.1%;
  }

  .coluna {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 8px 4px;
    font-size: 12px;
    color: #000000 !important;
    position: relative;
  }

  .turno-madruga { background-color: #c8e6c9 !important; }
  .turno-noite { background-color: #ffcdd2 !important; }

  .equipe-dia {
    background-color: #f4f4f4 !important;
    font-weight: 700;
    border-left: 2.5px dashed #000000 !important;
    border-right: 2.5px dashed #000000 !important;
  }

  .folga-aviso {
    position: absolute;
    bottom: 4px;
    left: 4px;
    right: 4px;
    font-size: 9px;
    font-weight: bold;
    text-align: center;
    padding: 3px 2px;
    background-color: #ffc107 !important;
    color: #000000 !important;
    border: 1px solid #000000;
    border-radius: 4px;
    z-index: 5;
  }

  .seta-fluxo, .seta-saida {
    position: absolute;
    top: 40%;
    background-color: #1b5e20 !important;
    color: #ffffff !important;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99;
    border: 2px solid #ffffff !important;
    font-size: 11px;
  }
  .seta-fluxo { left: -10px; }
  .seta-saida { right: -10px; }
`;

/**
 * Estilo completo para Tabela de Preços (A4)
 */
export const IMPRESSAO_TABELA_PRECOS_CSS = /* css */ `
  ${PRINT_BASE_CSS}

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

  .btn-baixa { background: #218838; }
  .btn-alta { background: #c82333; }
  .btn-print { background: #343a40; }
  .btn-voltar { background: #6c757d; }

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
      background: #eee !important;
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
