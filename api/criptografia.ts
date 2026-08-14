import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);

  try {
    const { nome } = req.query;

    // GET /api/criptografia?nome=xxx -> obter chave
    if (req.method === 'GET') {
      if (!nome) return res.status(400).json({ error: 'nome is required' });

      const { data, error } = await supabase
        .from('chaves_criptografia')
        .select('*')
        .eq('nome', nome)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data ?? null);
    }

    // POST /api/criptografia -> definir/atualizar chave (upsert)
    // body: { nome, chave, iv, salt }
    if (req.method === 'POST') {
      const { nome, chave, iv, salt } = req.body;

      if (!nome || !chave) {
        return res.status(400).json({ error: 'nome and chave are required' });
      }

      const { data, error } = await supabase
        .from('chaves_criptografia')
        .upsert({ nome, chave, iv, salt }, { onConflict: 'nome' })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(error, res);
  }
}