import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { nome } = req.query;
    if (!nome) return res.status(400).json({ error: 'nome is required' });

    const { data, error } = await supabase
      .from('chaves_criptografia')
      .select('*')
      .eq('nome', nome)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return res.status(200).json(data ?? null);
  } catch (error) {
    return handleError(error, res);
  }
}
