// Script para descriptografar backup .btf
import fs from 'fs';
import crypto from 'crypto';

// O segredo fixo usado no backup (do criptografia.ts linha 62)
const BACKUP_SECRET = 'tarifario-360-backup-key-2024-fixed-portable-secret';
const PBKDF2_ITERATIONS = 600000;
const KEY_SIZE = 256;

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-CBC', length: KEY_SIZE },
    false,
    ['encrypt', 'decrypt']
  );
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer.slice(0);
}

async function decryptBackup(encryptedData) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato inválido - esperado salt:iv:ciphertext');
    }

    const [saltHex, ivHex, ciphertextHex] = parts;
    const salt = hexToBuffer(saltHex);
    const iv = hexToBuffer(ivHex);
    const ciphertext = hexToBuffer(ciphertextHex);

    const key = await deriveKey(BACKUP_SECRET, new Uint8Array(salt));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return null;
  }
}

async function main() {
  const filePath = 'C:\\inetpub\\novo_backup_2026-08-01.btf';
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Tamanho do arquivo:', content.length, 'chars');
  console.log('Primeiros 200 chars:', content.substring(0, 200));

  const backup = await decryptBackup(content);
  if (backup) {
    console.log('\n=== BACKUP DESCRITOGRAFADO ===');
    console.log('Tipo:', backup.tipo);
    console.log('Versão:', backup.versao);
    console.log('Data Exportação:', backup.dataExportacao);
    console.log('\n--- Tabelas presentes ---');
    console.log('configuracaoGeral:', backup.configuracaoGeral ? 'SIM' : 'NÃO');
    console.log('categorias:', backup.categorias?.length || 0, 'itens');
    console.log('escalaConfig:', backup.escalaConfig ? 'SIM' : 'NÃO');
    console.log('orcamentosOficiais:', backup.orcamentosOficiais?.length || 0, 'itens');
    console.log('chavesCriptografia:', backup.chavesCriptografia?.length || 0, 'itens');

    if (backup.configuracaoGeral) {
      console.log('\n--- Config Geral (config_geral) ---');
      console.log('ID:', backup.configuracaoGeral.id);
      console.log('Campos do objeto:', Object.keys(backup.configuracaoGeral));
      if (backup.configuracaoGeral.configuracao) {
        console.log('Campos do JSONB configuracao:', Object.keys(backup.configuracaoGeral.configuracao));
        console.log('  - tarifas:', !!backup.configuracaoGeral.configuracao.tarifas);
        console.log('  - promocoes:', !!backup.configuracaoGeral.configuracao.promocoes);
        console.log('  - horarios:', !!backup.configuracaoGeral.configuracao.horarios);
        console.log('  - seguranca:', !!backup.configuracaoGeral.configuracao.seguranca);
        console.log('  - hotel:', !!backup.configuracaoGeral.configuracao.hotel);
      }
    }

    if (backup.categorias?.length > 0) {
      console.log('\n--- Categorias (UHs) ---');
      backup.categorias.forEach((cat, i) => console.log(`  ${i+1}. ${cat.nome} (${cat.codigo})`));
    }

    if (backup.orcamentosOficiais?.length > 0) {
      console.log('\n--- Orçamentos Oficiais ---');
      backup.orcamentosOficiais.forEach((orc, i) => console.log(`  ${i+1}. ${orc.nome} - ${orc.status}`));
    }
  } else {
    console.log('Falha ao descriptografar - tentando formato antigo (AES-GCM)...');
  }
}

main();