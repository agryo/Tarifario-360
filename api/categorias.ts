import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from './_lib/supabase.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);

  try {
    const { id } = req.query;

    // GET /api/categorias -> listar todas ativas
    // GET /api/categorias?id=xxx -> obter por id
    if (req.method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return res.status(200).json(toCamelCase(data));
      }

      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      return res.status(200).json(toCamelCase(data ?? []));
    }

    // POST /api/categorias -> criar categoria
    if (req.method === 'POST') {
      const categoria = req.body;

      if (!categoria || !categoria.nome) {
        return res.status(400).json({ error: 'nome is required' });
      }

      const { data, error } = await supabase
        .from('categorias')
        .insert({ ...toSnakeCase(categoria), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(toCamelCase(data));
    }

    // PUT /api/categorias?id=xxx -> atualizar categoria
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const categoria = req.body;

      const { data, error } = await supabase
        .from('categorias')
        .update({ ...toSnakeCase(categoria), atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(toCamelCase(data));
    }

    // DELETE /api/categorias?id=xxx -> deletar categoria
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(error, res);
  }
}