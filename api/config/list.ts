import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { categoria } = req.query;

    if (!categoria) {
      return res.status(400).json({ error: 'categoria is required' });
    }

    const { data, error } = await supabase
      .from('configuracoes')
      .select('chave, dados')
      .eq('categoria', categoria);

    if (error) throw error;

    const result: Record<string, any> = {};
    data?.forEach(item => {
      result[item.chave] = item.dados;
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}