export const ImpressaoOrcamentoCSS = /* css */ `
  .documento {
    font-family: 'Times New Roman', Times, serif;
    max-width: 1100px;
    margin: 0 auto;
    background: white;
    color: black;
    padding: 8mm 12mm;
  }
  .header-doc {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #075e54;
    padding-bottom: 5px;
    margin-bottom: 10px;
  }
  .logo-container img {
    max-width: 80px;
  }
  .hotel-info-doc h1 {
    margin: 0;
    color: #075e54;
    font-size: 15px;
  }
  .hotel-info-doc p {
    margin: 0;
    font-size: 9px;
    color: #555;
  }
  .doc-title {
    text-align: center;
    text-transform: uppercase;
    margin: 5px 0;
    color: #075e54;
    font-size: 22px;
    font-weight: bold;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }
  th {
    background: #f4f4f4;
    text-align: left;
    padding: 6px;
    border: 1px solid #ddd;
    font-size: 10px;
  }
  td {
    padding: 6px;
    border: 1px solid #ddd;
    font-size: 10px;
  }
  .total-row {
    background: #e7f3f0;
    font-weight: bold;
    font-size: 12px;
  }
  .check-info-box {
    background: #f9f9f9;
    padding: 5px;
    border: 1px solid #eee;
    border-radius: 4px;
    display: flex;
    justify-content: space-around;
    font-size: 10px;
    margin-top: 5px;
  }
  .obs-doc {
    font-size: 11px;
    margin-top: 10px;
    line-height: 1.4;
  }
  .footer-assinaturas {
    margin-top: 35px;
    display: flex;
    justify-content: space-between;
    gap: 40px;
  }
  .assinatura-box {
    flex: 1;
    text-align: center;
    border-top: 1.5px solid #333;
    padding-top: 5px;
    font-size: 10px;
    font-weight: bold;
  }
  @media print {
    @page {
      size: A4;
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
