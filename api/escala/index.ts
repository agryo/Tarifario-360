import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { error } = await supabase.from('escala_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(error, res);
  }
}