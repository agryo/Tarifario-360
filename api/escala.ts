import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);

  try {
    // GET /api/escala -> obter configuração de escala
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('escala_config')
        .select('configuracao')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data?.configuracao ?? null);
    }

    // PUT /api/escala -> atualizar/criar configuração de escala
    if (req.method === 'PUT') {
      const configuracao = req.body;

      const { data: existing } = await supabase
        .from('escala_config')
        .select('id')
        .limit(1)
        .single();

      let result;
      let error;

      if (existing) {
        ({ data: result, error } = await supabase
          .from('escala_config')
          .update({ configuracao, atualizado_em: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        ({ data: result, error } = await supabase
          .from('escala_config')
          .insert({ configuracao, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
          .select()
          .single());
      }

      if (error) throw error;
      return res.status(200).json(result);
    }

    // DELETE /api/escala -> limpar configuração de escala
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('escala_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(error, res);
  }
}