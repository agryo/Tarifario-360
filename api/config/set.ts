import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { categoria, chave, dados } = req.body;

    if (!categoria || !chave || dados === undefined) {
      return res.status(400).json({ error: 'categoria, chave, and dados are required' });
    }

    const { data, error } = await supabase
      .from('configuracoes')
      .upsert({ categoria, chave, dados, atualizado_em: new Date().toISOString() }, { onConflict: 'categoria,chave' })
      .select('dados')
      .single();

    if (error) throw error;
    return res.status(200).json(data.dados);
  } catch (error) {
    return handleError(error, res);
  }
}