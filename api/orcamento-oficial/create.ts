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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const orcamento = req.body;

    if (!orcamento || !orcamento.titulo || !orcamento.cliente) {
      return res.status(400).json({ error: 'titulo and cliente are required' });
    }

    const { data, error } = await supabase
      .from('orcamentos_oficiais')
      .insert({ ...toSnakeCase(orcamento), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(toCamelCase(data));
  } catch (error) {
    return handleError(error, res);
  }
}
