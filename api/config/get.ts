import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { categoria, chave } = req.query;

    if (!categoria || !chave) {
      return res.status(400).json({ error: 'categoria and chave are required' });
    }

    const { data, error } = await supabase
      .from('configuracoes')
      .select('dados')
      .eq('categoria', categoria)
      .eq('chave', chave)
      .single();

    if (error) throw error;
    return res.status(200).json(data?.dados ?? null);
  } catch (error) {
    return handleError(error, res);
  }
}