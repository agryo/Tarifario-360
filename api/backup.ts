import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from './_lib/supabase.js';

function toCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => toCamelCase(v));
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result;
}

function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => toSnakeCase(v));
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

function mapConfigGeral(row: any) {
  if (!row) return null;
  const rawSeguranca = row.seguranca;
  const hasSegurancaData = rawSeguranca && typeof rawSeguranca === 'object' && Object.keys(rawSeguranca).length > 0;
  return {
    festividade: row.festividade ?? '',
    totalUhs: row.total_uhs ?? 0,
    comodidadesGlobais: row.comodidades_globais ?? '',
    precos: toCamelCase(row.precos),
    temporada: toCamelCase(row.temporada),
    horarios: toCamelCase(row.horarios),
    promocao: toCamelCase(row.promocao),
    seguranca: hasSegurancaData ? toCamelCase(rawSeguranca) : { senhaHash: '', senhaSalt: '' },
    orcamento: toCamelCase(row.orcamento),
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);

  try {
    // GET /api/backup -> exportar backup completo
    if (req.method === 'GET') {
      const [categorias, configGeral, escalaConfig, orcamentosOficiais, chaves] = await Promise.all([
        supabase.from('categorias').select('*'),
        supabase.from('config_geral').select('*').limit(1).single(),
        supabase.from('escala_config').select('configuracao').limit(1).single(),
        supabase.from('orcamentos_oficiais').select('*'),
        supabase.from('chaves_criptografia').select('*'),
      ]);

      const backup = {
        versao: '2.0',
        data_exportacao: new Date().toISOString(),
        categorias: toCamelCase(categorias.data ?? []),
        config_geral: mapConfigGeral(configGeral.data),
        escala_config: escalaConfig.data?.configuracao ?? null,
        orcamentos_oficiais: toCamelCase(orcamentosOficiais.data ?? []),
        chaves_criptografia: chaves.data ?? [],
      };

      return res.status(200).json(backup);
    }

    // POST /api/backup -> importar backup
    if (req.method === 'POST') {
      const backup = req.body;

      if (!backup || !backup.versao) {
        return res.status(400).json({ error: 'Invalid backup format' });
      }

      // PRIMEIRO: Limpar todas as tabelas (ordem inversa de dependência).
      // Se alguma limpeza falhar, NÃO continuar (evita misturar dados antigos + backup)
      const tablesToClear = [
        'orcamentos_oficiais',
        'chaves_criptografia',
        'escala_config',
        'config_geral',
        'categorias',
      ];
      for (const table of tablesToClear) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(`Falha ao limpar ${table}: ${error.message}`);
      }

      // Import in order: categorias first (referenced by orcamentos_oficiais)
      if (backup.categorias?.length) {
        const { error } = await supabase.from('categorias').upsert(toSnakeCase(backup.categorias), { onConflict: 'id' });
        if (error) throw error;
      }

      if (backup.config_geral) {
        // config_geral is a single-row table - delete existing row first, then insert new
        const { error: deleteError } = await supabase.from('config_geral').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) throw new Error(`Falha ao limpar config_geral: ${deleteError.message}`);

        const config = backup.config_geral;
        const { error } = await supabase.from('config_geral').insert({
          festividade: config.festividade ?? '',
          total_uhs: config.totalUhs ?? 0,
          comodidades_globais: config.comodidadesGlobais ?? '',
          precos: toSnakeCase(config.precos),
          temporada: toSnakeCase(config.temporada),
          horarios: toSnakeCase(config.horarios),
          promocao: toSnakeCase(config.promocao),
          seguranca: toSnakeCase(config.seguranca || { senhaHash: '', senhaSalt: '' }),
          orcamento: toSnakeCase(config.orcamento),
        });
        if (error) throw error;
      }

      if (backup.escala_config) {
        // escala_config has UUID primary key - delete existing row first, then insert new
        const { error: deleteError } = await supabase.from('escala_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) throw new Error(`Falha ao limpar escala_config: ${deleteError.message}`);

        const { error } = await supabase.from('escala_config').insert({ configuracao: backup.escala_config });
        if (error) throw error;
      }

      if (backup.orcamentos_oficiais?.length) {
        const { error } = await supabase.from('orcamentos_oficiais').upsert(toSnakeCase(backup.orcamentos_oficiais), { onConflict: 'id' });
        if (error) throw error;
      }

      if (backup.chaves_criptografia?.length) {
        const { error } = await supabase.from('chaves_criptografia').upsert(toSnakeCase(backup.chaves_criptografia), { onConflict: 'nome' });
        if (error) throw error;
      }

      return res.status(200).json({ success: true, message: 'Backup imported successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(error, res);
  }
}