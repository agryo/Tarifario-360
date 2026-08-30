// Utilitário para inspecionar arquivos do Tarifario-360: backups (.btf) e
// orçamentos exportados (.ortf). Detecta o tipo automaticamente pelo campo
// `tipo` do conteúdo descriptografado — ambos usam a MESMA criptografia.
//
// Uso:
//   node backup-tool.mjs <arquivo> [--senha SUA_SENHA]
//   node backup-tool.mjs "C:/inetpub/Novo_backup_2026-08-28.btf"
//   node backup-tool.mjs "C:/Downloads/Orcamento_Banda.ortf"
//
// - Sem --senha: tenta descriptografar com o segredo portável de backup
//   (mesmo usado pelo app para backups e orçamentos sem senha).
// - Com --senha: usa a senha do usuário (criptografarBackupComSenha).
// - Mostra o resumo (backup ou orçamento) e verifica a assinatura de integridade.
import fs from 'node:fs';
import crypto from 'node:crypto';

const BACKUP_SECRET = 'tarifario-360-backup-key-2024-fixed-portable-secret';
const PBKDF2_ITERATIONS = 600000;
const KEY_SIZE = 32; // AES-256

function hexToBuffer(hex) {
  return Buffer.from(hex, 'hex');
}

function deriveKeySync(secret, saltHex) {
  return crypto.pbkdf2Sync(secret, hexToBuffer(saltHex), PBKDF2_ITERATIONS, KEY_SIZE, 'sha256');
}

function decryptSync(payload, saltHex, ivHex, ciphertextHex) {
  const key = deriveKeySync(payload, saltHex);
  const iv = hexToBuffer(ivHex);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(hexToBuffer(ciphertextHex)), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function formatarResumo(backup) {
  const linhas = [];
  linhas.push(`  Tipo: ${backup.tipo ?? '(ausente)'}`);
  linhas.push(`  Versão: ${backup.versao ?? '(ausente)'}`);
  linhas.push(`  Data exportação: ${backup.dataExportacao ?? '(ausente)'}`);

  const cg = backup.configuracaoGeral;
  if (cg) {
    linhas.push(`  Config geral: festividade="${cg.festividade ?? ''}" | totalUhs=${cg.totalUhs ?? 0} | kWh=${cg.precos?.kwh ?? 0}`);
    linhas.push(`    Refeições: almoço=${cg.precos?.refeicoes?.almoco ?? 0} | janta=${cg.precos?.refeicoes?.janta ?? 0} | lanche=${cg.precos?.refeicoes?.lanche ?? 0}`);
    linhas.push(`    Temporada: ${cg.temporada?.altaInicio ?? ''} → ${cg.temporada?.altaFim ?? ''}`);
    linhas.push(`    Promoção ativa: ${cg.promocao?.ativa ?? false} (desconto ${cg.promocao?.desconto ?? 0}%)`);
  } else {
    linhas.push('  Config geral: (ausente)');
  }

  linhas.push(`  Categorias: ${Array.isArray(backup.categorias) ? backup.categorias.length : '(ausente)'}`);
  if (Array.isArray(backup.categorias)) {
    backup.categorias.forEach((c, i) => {
      const precos = c.precoAltaCafe != null
        ? `alta café=${c.precoAltaCafe} | baixa sem café=${c.precoBaixaSemCafe}`
        : `(campos de preço ausentes)`;
      linhas.push(`    ${i + 1}. ${c.nome} — ${precos} — ativo=${c.ativo ?? true}`);
    });
  }

  linhas.push(`  Escala: ${backup.escalaConfig ? (backup.escalaConfig.p1 + ' / ' + backup.escalaConfig.p2) : '(ausente)'}`);

  const orcs = backup.orcamentosOficiais;
  linhas.push(`  Orçamentos oficiais: ${Array.isArray(orcs) ? orcs.length : '(ausente)'}`);
  if (Array.isArray(orcs)) {
    orcs.forEach((o, i) => {
      const nome = o.titulo || o.nome || o.cliente || '(sem título)';
      const cliente = o.cliente ? ` | cliente=${o.cliente}` : '';
      const total = Array.isArray(o.itens)
        ? o.itens.reduce((s, it) => s + (it.total || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : (o.valorTotal ?? o.total ?? '?');
      linhas.push(`    ${i + 1}. ${nome}${cliente} — status=${o.status || '?'} — valor=${total}`);
    });
  }

  linhas.push(`  Chaves criptografia: ${Array.isArray(backup.chavesCriptografia) ? backup.chavesCriptografia.length : '(ausente)'}`);
  if (Array.isArray(backup.chavesCriptografia)) {
    backup.chavesCriptografia.forEach((k, i) => linhas.push(`    ${i + 1}. ${k.nome} — ${k.chave ? '(chave presente)' : '(sem chave)'}`));
  }

  return linhas.join('\n');
}

function formatarOrcamento(orc) {
  const linhas = [];
  linhas.push(`  Título: ${orc.titulo || '(sem título)'}`);
  linhas.push(`  Cliente: ${orc.cliente || '(sem cliente)'}`);
  linhas.push(`  Status: ${orc.status || '?'}`);
  if (orc.evento) linhas.push(`  Evento: ${orc.evento}`);
  linhas.push(`  Gerado em: ${orc.dataGeracao ?? '(ausente)'}`);
  linhas.push(`  Válido até: ${orc.dataValidade ?? '(ausente)'}`);
  linhas.push(`  Check-in: ${orc.dataCheckin ?? '(ausente)'}${orc.horaEntrada ? ` às ${orc.horaEntrada}` : ''}`);
  linhas.push(`  Check-out: ${orc.dataCheckout ?? '(ausente)'}${orc.horaSaida ? ` às ${orc.horaSaida}` : ''}`);
  linhas.push(`  Temporada: ${orc.temporada ?? 'auto'}`);
  if (orc.observacoes) linhas.push(`  Observações: ${orc.observacoes}`);

  const itens = Array.isArray(orc.itens) ? orc.itens : [];
  linhas.push(`  Itens: ${itens.length}`);
  let totalGeral = 0;
  itens.forEach((it, i) => {
    const desc = it.descricao || it.categoriaNome || '(sem descrição)';
    const qtd = it.quantidade ?? 1;
    const preco = it.precoDiaria ?? it.total ?? 0;
    const total = it.total ?? preco * qtd;
    totalGeral += total;
    linhas.push(`    ${i + 1}. ${desc} | ${it.categoriaNome ?? ''} | qtd=${qtd} | diária=${preco} | total=${total}`);
  });
  linhas.push(`  TOTAL GERAL: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  return linhas.join('\n');
}

function verificarAssinatura(backup) {
  const { assinatura, ...dados } = backup;
  if (!assinatura) {
    return '  ⚠ Assinatura ausente (backup antigo sem verificação de integridade).';
  }
  const calculada = sha256(JSON.stringify(dados));
  if (calculada === assinatura) {
    return '  ✅ Assinatura de integridade VÁLIDA.';
  }
  return `  ❌ Assinatura INVÁLIDA! O arquivo foi modificado ou está corrompido.\n     esperada: ${assinatura}\n     calculada: ${calculada}`;
}

function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith('--'));
  const senhaIdx = args.indexOf('--senha');
  const senha = senhaIdx >= 0 ? args[senhaIdx + 1] : null;

  if (!filePath) {
    console.log('Uso: node backup-tool.mjs <arquivo.btf> [--senha SUA_SENHA]');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8').trim();
  console.log(`Arquivo: ${filePath}`);
  console.log(`Tamanho: ${content.length} chars\n`);

  const tentar = (rotulo, payload) => {
    const parts = content.split(':');
    if (parts.length !== 3) return { rotulo, erro: `Formato inválido (esperado salt:iv:ciphertext, achou ${parts.length} partes)` };
    try {
      const backup = decryptSync(payload, parts[0], parts[1], parts[2]);
      return { rotulo, backup };
    } catch (e) {
      return { rotulo, erro: e.message };
    }
  };

  // 1. Tenta segredo portável de backup
  let resultado = tentar('segredo portável', BACKUP_SECRET);

  // 2. Se falhou e foi passada senha, tenta com a senha
  if (!resultado.backup && senha) {
    resultado = tentar('senha do usuário', senha);
  }

  if (!resultado.backup) {
    console.log('Não foi possível descriptografar.');
    if (resultado.erro) console.log(`Motivo (${resultado.rotulo}): ${resultado.erro}`);
    console.log('\nSugestões:');
    console.log('  - Se o backup foi feito COM senha, use: node backup-tool.mjs <arquivo> --senha SUA_SENHA');
    console.log('  - Confirme que o arquivo é um backup .btf válido deste sistema.');
    process.exit(1);
  }

  console.log(`✅ Descriptografado com ${resultado.rotulo}\n`);

  const backup = resultado.backup;
  // Detecção: backup tem config/categorias no topo; orçamento tem cliente+itens no topo
  const ehBackup = backup.tipo === 'backup' || backup.configuracaoGeral || Array.isArray(backup.categorias);
  const ehOrcamento = backup.tipo === 'orcamento' || (backup.cliente && Array.isArray(backup.itens));

  console.log('=== RESUMO ===');
  if (ehBackup && !ehOrcamento) {
    console.log(formatarResumo(backup));
  } else if (ehOrcamento) {
    console.log(formatarOrcamento(backup));
  } else {
    console.log('  ⚠ Estrutura desconhecida — não parece um backup (.btf) nem um orçamento (.ortf).');
    console.log(`  Chaves encontradas: ${Object.keys(backup).join(', ')}`);
  }

  console.log('\n=== INTEGRIDADE ===');
  console.log(verificarAssinatura(backup));
}

main();
