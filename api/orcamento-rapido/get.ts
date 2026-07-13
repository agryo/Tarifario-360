import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { data, error } = await supabase
      .from('orcamentos_rapidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    return handleError(error, res);
  }
}
