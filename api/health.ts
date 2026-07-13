import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, corsHeaders, handleOptions } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { error } = await supabase.from('configuracoes').select('id').limit(1);
    if (error) throw error;
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: 'error', error: String(error) });
  }
}
