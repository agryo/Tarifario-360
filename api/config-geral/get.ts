import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

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

function mapConfigGeral(row: any): any {
  if (!row) return null;
  const rawSeguranca = row.seguranca;
  // Check if seguranca is null/undefined OR an empty object
  const hasSegurancaData = rawSeguranca && typeof rawSeguranca === 'object' && Object.keys(rawSeguranca).length > 0;
  return {
    festividade: row.festividade,
    totalUhs: row.total_uhs,
    comodidadesGlobais: row.comodidades_globais,
    precos: toCamelCase(row.precos),
    temporada: toCamelCase(row.temporada),
    horarios: toCamelCase(row.horarios),
    promocao: toCamelCase(row.promocao),
    // IMPORTANTE: Se seguranca vier null/undefined OU objeto vazio do banco, retorna objeto com strings vazias
    // para evitar que o merge posterior caia no default "1234"
    seguranca: hasSegurancaData ? toCamelCase(rawSeguranca) : { senhaHash: '', senhaSalt: '' },
    orcamento: toCamelCase(row.orcamento),
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('config_geral')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return res.status(200).json(data ? mapConfigGeral(data) : null);
  } catch (error) {
    return handleError(error, res);
  }
}
