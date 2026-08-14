import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);

  try {
    const { categoria, chave } = req.query;

    // GET /api/config?categoria=xyz -> listar chaves da categoria
    // GET /api/config?categoria=xyz&chave=abc -> obter valor específico
    if (req.method === 'GET') {
      if (!categoria) {
        return res.status(400).json({ error: 'categoria is required' });
      }

      if (chave) {
        // Obter valor específico
        const { data, error } = await supabase
          .from('configuracoes')
          .select('dados')
          .eq('categoria', categoria)
          .eq('chave', chave)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return res.status(200).json(data?.dados ?? null);
      }

      // Listar todas chaves da categoria
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
    }

    // POST /api/config -> definir valor (upsert)
    // body: { categoria, chave, dados }
    if (req.method === 'POST') {
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
    }

    // DELETE /api/config?categoria=xyz -> limpar categoria
    // DELETE /api/config?categoria=xyz&chave=abc -> deletar chave específica
    if (req.method === 'DELETE') {
      if (!categoria) {
        return res.status(400).json({ error: 'categoria is required' });
      }

      let query = supabase.from('configuracoes').delete().eq('categoria', categoria);

      if (chave) {
        query = query.eq('chave', chave);
      }

      const { error } = await query;

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(error, res);
  }
}