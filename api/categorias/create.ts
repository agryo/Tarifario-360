import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const categoria = req.body;

    if (!categoria || !categoria.nome) {
      return res.status(400).json({ error: 'nome is required' });
    }

    const { data, error } = await supabase
      .from('categorias')
      .insert({ ...categoria, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return handleError(error, res);
  }
}
