import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from './_lib/supabase';

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
  const hasSegurancaData = rawSeguranca && typeof rawSeguranca === 'object' && Object.keys(rawSeguranca).length > 0;
  return {
    festividade: row.festividade,
    totalUhs: row.total_uhs,
    comodidadesGlobais: row.comodidades_globais,
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
    // GET /api/config-geral -> obter configuração geral
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('config_geral')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data ? mapConfigGeral(data) : null);
    }

    // PUT /api/config-geral -> atualizar configuração geral
    if (req.method === 'PUT') {
      const config = req.body;

      const { data: existing } = await supabase
        .from('config_geral')
        .select('id')
        .limit(1)
        .single();

      const mappedConfig = {
        festividade: config.festividade,
        total_uhs: config.totalUhs,
        comodidades_globais: config.comodidadesGlobais,
        precos: toSnakeCase(config.precos),
        temporada: toSnakeCase(config.temporada),
        horarios: toSnakeCase(config.horarios),
        promocao: toSnakeCase(config.promocao),
        seguranca: toSnakeCase(config.seguranca ?? { senhaHash: '', senhaSalt: '' }),
        orcamento: toSnakeCase(config.orcamento),
        criado_em: config.criado_em,
        atualizado_em: config.atualizado_em,
      };

      let result;
      let error;

      if (existing) {
        ({ data: result, error } = await supabase
          .from('config_geral')
          .update({ ...mappedConfig, atualizado_em: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        ({ data: result, error } = await supabase
          .from('config_geral')
          .insert({ ...mappedConfig, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
          .select()
          .single());
      }

      if (error) throw error;
      return res.status(200).json(mapConfigGeral(result));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(error, res);
  }
}