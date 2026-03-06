export const ImpressaoEscalaCSS = /* css */ `
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

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
    border: 1px solid #000;
    padding: 4px;
    text-align: center;
    vertical-align: top;
    overflow: visible;
  }
  .tabela-escala td {
    position: relative;
  }
  .tabela-escala th {
    background-color: #f0f0f0;
    font-weight: bold;
    color: #000 !important;
  }

  .color-folga { background-color: #fff176 !important; }
  .color-0 { background-color: #ff9800 !important; }
  .color-1 { background-color: #9c27b0 !important; }
  .color-2 { background-color: #00bcd4 !important; }
  .color-3 { background-color: #3f51b5 !important; }
  .color-4 { background-color: #795548 !important; }
  .color-5 { background-color: #607d8b !important; }
  .color-6 { background-color: #e91e63 !important; }

  .data-label {
    font-weight: bold;
    padding: 2px;
    border-bottom: 1px solid #000;
    margin-bottom: 4px;
    display: block;
    color: #000 !important;
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
    min-width: 50px;
  }
  .turno-madruga { background-color: #c8e6c9 !important; color: #000 !important; }
  .equipe-dia { background-color: #f4f4f4 !important; color: #000 !important; font-weight: 600; border-left: 1px dashed #000; border-right: 1px dashed #000; }
  .turno-noite { background-color: #ffcdd2 !important; color: #000 !important; }

  .seta-fluxo,
  .seta-saida {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background: #1b5e20 !important;
    color: white !important;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    z-index: 10;
    border: 1px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  .seta-fluxo { left: -8px; }
  .seta-saida { right: -8px; }

  .folga-aviso {
    display: block;
    font-size: 0.7rem;
    color: #b71c1c !important;
    font-weight: bold;
    margin-top: 2px;
    background: rgba(255,255,255,0.8) !important;
    padding: 2px 4px;
    border: 1px solid #b71c1c;
    border-radius: 4px;
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
