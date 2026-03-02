export const ImpressaoEscalaCSS = /* css */ `
  .tabela-escala {
    font-family: 'Segoe UI', sans-serif;
    font-size: 10px;
    color: #000;
  }
  .tabela-escala table {
    width: 100%;
    border-collapse: collapse;
  }
  .tabela-escala th,
  .tabela-escala td {
    border: 1px solid #ccc;
    padding: 4px;
    text-align: center;
    vertical-align: top;
  }
  .tabela-escala th {
    background-color: #f0f0f0;
    font-weight: bold;
  }
  .color-folga {
    background-color: #ffcccc;
  }
  .color-0 { background-color: #fff3cd; }
  .color-1 { background-color: #d4edda; }
  .color-2 { background-color: #cce5ff; }
  .color-3 { background-color: #e2e3e5; }
  .color-4 { background-color: #f8d7da; }
  .color-5 { background-color: #d1ecf1; }
  .color-6 { background-color: #f5c6cb; }
  .data-label {
    font-weight: bold;
    padding: 2px;
    border-bottom: 1px solid #ccc;
    margin-bottom: 4px;
    display: block;
  }
  .dia-container {
    display: flex;
    justify-content: space-between;
    gap: 2px;
  }
  .coluna {
    flex: 1;
    padding: 2px;
    border-radius: 4px;
    background-color: #f9f9f9;
    min-width: 50px;
  }
  .turno-madruga { background-color: #e7f1ff; }
  .equipe-dia { background-color: #e2f0d9; }
  .turno-noite { background-color: #ffe6cc; }
  .seta-fluxo, .seta-saida {
    font-size: 1.2rem;
    color: #075e54;
    display: inline-block;
    margin-right: 2px;
  }
  .folga-aviso {
    display: block;
    font-size: 0.7rem;
    color: #dc3545;
    font-weight: bold;
    margin-top: 2px;
  }
  @media print {
    @page {
      size: A4 landscape;
      margin: 1cm;
    }
    body {
      background: white;
      color: black;
    }
    .no-print {
      display: none !important;
    }
  }
`;
