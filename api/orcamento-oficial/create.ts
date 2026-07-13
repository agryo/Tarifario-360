import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

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
      .insert({ ...orcamento, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return handleError(error, res);
  }
}
