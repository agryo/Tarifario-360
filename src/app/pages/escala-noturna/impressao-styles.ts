export const ImpressaoEscalaCSS = /* css */ `
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .tabela-escala {
    font-family: 'Segoe UI', sans-serif;
    font-size: 10px;
    color: #000;
    clip-path: none;
    width: 100%;
    margin: 0;
    padding: 0;
    position: relative;
    overflow: visible;
    display: block;
  }
  .tabela-escala table {
    width: 100%;
    border-collapse: collapse;
    overflow: visible;
    clip-path: none;
    table-layout: fixed;
    border: 3px solid #000;
    margin: 0;
  }
  .tabela-escala tbody,
  .tabela-escala tr {
    overflow: visible;
    clip-path: none;
  }
  .tabela-escala th,
  .tabela-escala td {
    border: 2.5px solid #000;
    padding: 0;
    text-align: center;
    vertical-align: top;
    overflow: visible;
    position: relative;
    clip-path: none;
  }
  .tabela-escala td {
    height: 1px;
    overflow: visible;
  }
  .tabela-escala th {
    background-color: #f0f0f0;
    font-weight: bold;
    font-size: 12px;
    color: #000 !important;
    padding: 15px;
    text-transform: uppercase;
  }
  .tabela-escala th.color-folga {
    color: #000 !important;
  }
  .tabela-escala th.color-0,
  .tabela-escala th.color-1,
  .tabela-escala th.color-2,
  .tabela-escala th.color-3,
  .tabela-escala th.color-4,
  .tabela-escala th.color-5,
  .tabela-escala th.color-6 {
    color: #fff !important;
  }

  .color-folga { background-color: #fff176 !important; }
  .color-0 { background-color: #ff9800 !important; }
  .color-1 { background-color: #9c27b0 !important; }
  .color-2 { background-color: #00bcd4 !important; }
  .color-3 { background-color: #3f51b5 !important; }
  .color-4 { background-color: #795548 !important; }
  .color-5 { background-color: #607d8b !important; }
  .color-6 { background-color: #e91e63 !important; }

  .tabela-escala td.color-folga { background-color: #fff176 !important; }
  .tabela-escala td.color-0 { background-color: #ff9800 !important; }
  .tabela-escala td.color-1 { background-color: #9c27b0 !important; }
  .tabela-escala td.color-2 { background-color: #00bcd4 !important; }
  .tabela-escala td.color-3 { background-color: #3f51b5 !important; }
  .tabela-escala td.color-4 { background-color: #795548 !important; }
  .tabela-escala td.color-5 { background-color: #607d8b !important; }
  .tabela-escala td.color-6 { background-color: #e91e63 !important; }

  .cell-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: visible;
    position: relative;
  }
  .data-label {
    font-weight: bold;
    font-size: 12px;
    padding: 10px 0;
    border-bottom: 2.5px solid #000;
    display: block;
    color: #000 !important;
    width: 100%;
    text-align: center;
    position: relative;
    z-index: 1;
  }
  .data-label.color-folga {
    color: #000 !important;
  }
  .data-label.color-0,
  .data-label.color-1,
  .data-label.color-2,
  .data-label.color-3,
  .data-label.color-4,
  .data-label.color-5,
  .data-label.color-6 {
    color: #fff !important;
  }
  .dia-container {
    display: flex;
    flex: 1;
    min-height: 120px;
    margin-top: -1px;
    overflow: visible;
  }
  .coluna {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 8px 5px;
    font-size: 0.9em;
    text-align: center;
    color: #000;
    position: relative;
    overflow: visible;
  }
  .turno-madruga { background-color: #c8e6c9 !important; color: #000 !important; }
  .equipe-dia { background-color: #f4f4f4 !important; color: #000 !important; font-weight: 600; border-left: 1px dashed #000; border-right: 1px dashed #000; }
  .turno-noite { background-color: #ffcdd2 !important; color: #000 !important; }

  .seta-fluxo,
  .seta-saida {
    position: absolute;
    top: 40%;
    width: 15px;
    height: 15px;
    background: #1b5e20 !important;
    color: white !important;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    z-index: 100;
    border: 2px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    clip-path: none !important;
    overflow: visible !important;
  }
  .seta-fluxo { left: -10px; }
  .seta-saida { right: -10px; }

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
    * {
      clip-path: none !important;
      overflow: visible !important;
    }
    @page {
      size: A4 landscape;
      margin: 5;
    }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
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
