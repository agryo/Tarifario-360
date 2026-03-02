export const ImpressaoOrcamentoCSS = /* css */ `
  .documento {
    font-family: 'Times New Roman', Times, serif !important;
    max-width: 1100px !important;
    margin: 0 auto !important;
    background: white !important;
    color: black !important;
    padding: 5mm 8mm !important;
  }

  .documento .header-doc {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 2px solid #075e54 !important;
    padding-bottom: 3px !important;
    margin-bottom: 5px !important;
  }

  .documento .logo-container {
    flex: 0 0 auto !important;
  }

  .documento .logo-container img {
    max-width: 70px !important;
    height: auto !important;
    display: block !important;
    margin: 0 !important;
  }

  .documento .hotel-info-doc {
    flex: 1 !important;
    text-align: right !important;
  }

  .documento .hotel-info-doc h1 {
    margin: 0 0 2px 0 !important;
    color: #075e54 !important;
    font-size: 14px !important;
    font-weight: bold !important;
  }

  .documento .hotel-info-doc p {
    margin: 0 !important;
    font-size: 8px !important;
    color: #555 !important;
    line-height: 1.2 !important;
  }

  .documento .doc-title {
    text-align: center !important;
    text-transform: uppercase !important;
    margin: 3px 0 !important;
    color: #075e54 !important;
    font-size: 18px !important;
    font-weight: bold !important;
  }

  .documento h2 {
    font-size: 11px !important;
    font-weight: bold !important;
    margin: 5px 0 2px 0 !important;
  }

  .documento p {
    font-size: 9px !important;
    margin: 2px 0 !important;
    line-height: 1.3 !important;
  }

  .documento table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 5px 0 !important;
    font-size: 9px !important;
  }

  .documento th {
    background: #f4f4f4 !important;
    text-align: left !important;
    padding: 4px !important;
    border: 1px solid #ddd !important;
    font-size: 9px !important;
    font-weight: bold !important;
  }

  .documento td {
    padding: 4px !important;
    border: 1px solid #ddd !important;
    font-size: 9px !important;
  }

  .documento .total-row {
    background: #e7f3f0 !important;
    font-weight: bold !important;
    font-size: 10px !important;
  }

  .documento .check-info-box {
    background: #f9f9f9 !important;
    padding: 4px !important;
    border: 1px solid #eee !important;
    border-radius: 4px !important;
    display: flex !important;
    justify-content: space-around !important;
    font-size: 9px !important;
    margin-top: 4px !important;
  }

  .documento .obs-doc {
    font-size: 9px !important;
    margin-top: 5px !important;
    line-height: 1.3 !important;
  }

  .documento .footer-assinaturas {
    margin-top: 20px !important;
    display: flex !important;
    justify-content: space-between !important;
    gap: 30px !important;
  }

  .documento .assinatura-box {
    flex: 1 !important;
    text-align: center !important;
    border-top: 1.5px solid #333 !important;
    padding-top: 4px !important;
    font-size: 9px !important;
    font-weight: bold !important;
  }

  @media print {
    @page {
      size: A4;
      margin: 1cm;
    }
    body {
      background: white !important;
      color: black !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;
