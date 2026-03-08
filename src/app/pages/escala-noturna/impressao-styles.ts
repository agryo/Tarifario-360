export const ImpressaoEscalaCSS = /* css */ `
  /* Configurações Gerais */
  * { 
    box-sizing: border-box !important; 
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important; 
  }

  @media print {
    @page { size: landscape; margin: 0.5cm; }
    body { background: white !important; }
    .main-bar, p-button, .p-button { display: none !important; }
  }

  .tabela-area {
    background-color: white !important;
    padding: 25px !important;
    width: 100% !important;
  }

  .tabela-escala table {
    width: 100%;
    border-collapse: collapse !important; /* Importante para não vazar cor entre bordas */
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
    overflow: visible !important; /* Para as setas aparecerem */
  }

  /* Cabeçalhos e Cores das Fontes */
  .tabela-escala th {
    padding: 15px !important;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    color: #ffffff !important; /* Padrão branco */
  }

  /* CORREÇÃO: Texto preto para fundo amarelo (Folga / Domingo se aplicável) */
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

  /* Cores dos Dias (Fundo) */
  .color-0 { background-color: #ff9800 !important; color: #000000 !important; } /* Domingo geralmente pede texto preto para contraste */
  .color-1 { background-color: #9c27b0 !important; }
  .color-2 { background-color: #00bcd4 !important; }
  .color-3 { background-color: #3f51b5 !important; }
  .color-4 { background-color: #795548 !important; }
  .color-5 { background-color: #607d8b !important; }
  .color-6 { background-color: #e91e63 !important; }

  /* Container de Turnos - CORREÇÃO PARA NÃO VAZAR COR */
  .dia-container { 
    display: flex !important; 
    flex-direction: row !important;
    min-height: 125px; 
    width: 100.2%; /* Pequeno ajuste para cobrir micro-espaços de renderização */
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

  /* CORREÇÃO: Informativo da Folga com Margens Laterais */
  .folga-aviso {
    position: absolute;
    bottom: 4px;
    left: 4px;   /* Margem esquerda */
    right: 4px;  /* Margem direita */
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

  /* Setas Circulares */
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
