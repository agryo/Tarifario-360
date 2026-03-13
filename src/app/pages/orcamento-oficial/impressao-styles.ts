export const ImpressaoOrcamentoCSS = /* css */ `
  /* CONFIGURAÇÕES DE PÁGINA */
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: white;
  }

  #documento-impressao {
    font-family: Arial, sans-serif;
    color: #000;
    background: white;
    width: 100%;
    padding: 0;
  }

  /* CABEÇALHO */
  #documento-impressao .header-doc {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #075e54;
    padding-bottom: 5px;
    margin-bottom: 10px;
  }

  #documento-impressao .logo-container img {
    max-width: 80px;
    height: auto;
  }

  #documento-impressao .hotel-info-doc {
    text-align: right;
  }

  #documento-impressao .hotel-info-doc h1 {
    margin: 0;
    color: #075e54;
    font-size: 15px;
    font-weight: bold;
  }

  #documento-impressao .hotel-info-doc p {
    margin: 0;
    font-size: 10pt;
    color: #555;
    line-height: 1.2;
  }

  /* TÍTULO CENTRAL */
  #documento-impressao .titulo-orcamento {
    text-align: center;
    text-transform: uppercase;
    margin: 10px 0;
    padding: 10px;
    color: #075e54;
    font-size: 20px;
    font-weight: bold;
  }

  /* SEÇÕES */
  #documento-impressao h2,
  #documento-impressao h3 {
    font-size: 11pt;
    font-weight: bold;
    color: #075e54;
    margin: 12px 0 5px 0;
  }

  #documento-impressao p,
  #documento-impressao div {
    font-size: 10pt;
    line-height: 1.3;
    margin: 0 0 8px 0;
  }

  /* TABELA */
  #documento-impressao .tabela-orcamento {
    width: 100%;
    border-collapse: collapse;
    margin: 5px 0;
    border: 1px solid #ddd;
    table-layout: fixed; /* Garante que as larguras sejam respeitadas */
  }

  #documento-impressao .tabela-orcamento th,
  #documento-impressao .tabela-orcamento td {
    border: 1px solid #ddd;
    padding: 6px;
    font-size: 10px;
    vertical-align: top;
  }

  #documento-impressao .tabela-orcamento th {
    background: #f4f4f4;
    color: #333;
    font-weight: bold;
    text-align: left;
  }

  /* Larguras das colunas */
  #documento-impressao .tabela-orcamento th:nth-child(1) { width: 4% }  /* Qtd */
  #documento-impressao .tabela-orcamento th:nth-child(2) { width: 28%; } /* Acomodação */
  #documento-impressao .tabela-orcamento th:nth-child(3) { width: 28%; } /* Serviços */
  #documento-impressao .tabela-orcamento th:nth-child(4) { width: 10%; } /* Vlr. Diária */
  #documento-impressao .tabela-orcamento th:nth-child(5) { width: 20%; } /* Diárias */
  #documento-impressao .tabela-orcamento th:nth-child(6) { width: 10%; } /* Total */

  /* Alinhamento */
  #documento-impressao .alinhar-direita {
    text-align: right;
  }

  #documento-impressao .alinhar-centro {
    text-align: center;
  }

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
    font-size: 10px; /* igual ao restante da tabela */
    background: #e7f3f0;
  }

  /* RODAPÉ DE ASSINATURAS */
  #documento-impressao .rodape-assinaturas {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
  }

  #documento-impressao .assinatura {
    width: 45%;
    text-align: center;
    border-top: 1px solid #333;
    padding-top: 8x;
    font-size: 10px;
  }
`;
