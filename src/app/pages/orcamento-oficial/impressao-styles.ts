export const ImpressaoOrcamentoCSS = /* css */ `
  /* CONFIGURAÇÕES DE PÁGINA */
  @media print {
    @page {
      size: A4;
      margin: 10mm !important;
    }
    .no-print { display: none !important; }
  }

  .documento {
    font-family: Arial, sans-serif !important;
    color: #000 !important;
    background: white !important;
    width: 100% !important;
    padding: 0 !important;
  }

  /* CABEÇALHO */
  .documento .header-doc {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border-bottom: 2px solid #075e54 !important;
    padding-bottom: 5px !important;
    margin-bottom: 10px !important;
  }

  .documento .logo-container img {
    max-width: 80px !important;
    height: auto !important;
  }

  .documento .hotel-info-doc {
    text-align: right !important;
  }

  .documento .hotel-info-doc h1 {
    margin: 0 !important;
    color: #075e54 !important;
    font-size: 15px !important;
    font-weight: bold !important;
  }

  .documento .hotel-info-doc p {
    margin: 0 !important;
    font-size: 9px !important;
    color: #555 !important;
    line-height: 1.2 !important;
  }

  /* TÍTULO CENTRAL */
  .documento .text-2xl, 
  .documento .doc-title {
    text-align: center !important;
    text-transform: uppercase !important;
    margin: 10px 0 !important;
    color: #075e54 !important;
    font-size: 20px !important;
    font-weight: bold !important;
    display: block !important;
  }

  /* SEÇÕES */
  .documento h2 {
    font-size: 11pt !important;
    font-weight: bold !important;
    color: #075e54 !important;
    margin: 12px 0 5px 0 !important;
  }

  .documento p, 
  .documento span, 
  .documento div {
    font-size: 10pt !important;
    line-height: 1.3 !important;
  }

  /* TABELA - FORÇANDO ESTILOS */
  .documento table,
  .documento .p-datatable-table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 5px 0 !important;
    border: 1px solid #ddd !important;
  }

  .documento th,
  .documento .p-datatable-thead > tr > th {
    background: #f4f4f4 !important;
    color: #333 !important;
    border: 1px solid #ddd !important;
    padding: 6px !important;
    font-size: 10px !important;
    font-weight: bold !important;
    text-align: left !important;
  }

  .documento td,
  .documento .p-datatable-tbody > tr > td {
    border: 1px solid #ddd !important;
    padding: 6px !important;
    font-size: 10px !important;
    vertical-align: top !important;
    color: #000 !important;
    background: transparent !important;
  }

  /* Larguras das colunas (ajustadas conforme modelo) */
  .documento th:nth-child(1) { width: 5%; }
  .documento th:nth-child(2) { width: 25%; }
  .documento th:nth-child(3) { width: 25%; }
  .documento th:nth-child(4) { width: 15%; }
  .documento th:nth-child(5) { width: 15%; }
  .documento th:nth-child(6) { width: 15%; }

  /* Alinhamento dos números à direita */
  .documento td:nth-child(4),
  .documento td:nth-child(5),
  .documento td:nth-child(6) {
    text-align: right !important;
  }

  /* Linha da observação (colspan) */
  .documento td[colspan="6"] {
    text-align: left !important;
    font-style: italic !important;
    background: transparent !important;
    border: 1px solid #ddd !important;
  }

  /* Linha do total */
  .documento tr.font-bold td,
  .documento .p-datatable-tfoot tr.font-bold td {
    font-weight: bold !important;
    font-size: 11px !important;
    border: 1px solid #ddd !important;
    background: transparent !important;
  }

  /* RODAPÉ DE ASSINATURAS */
  .documento .flex.justify-content-between.mt-4 {
    display: flex !important;
    justify-content: space-between !important;
    margin-top: 30px !important;
  }

  .documento .w-5 { width: 45% !important; }
  .documento .text-center { text-align: center !important; }
  .documento .border-top-1 { border-top: 1px solid #333 !important; }
  .documento .pt-2 { padding-top: 8px !important; }

  /* Remove ícones extras do PrimeNG */
  .p-column-title, .p-sortable-column-icon {
    display: none !important;
  }
`;
