import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const backup = req.body;

    if (!backup || !backup.versao) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    // Import in order: categorias first (referenced by orcamentos_rapidos)
    if (backup.categorias?.length) {
      const { error } = await supabase.from('categorias').upsert(backup.categorias, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.config_geral) {
      const { error } = await supabase.from('config_geral').upsert(backup.config_geral, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.escala_config) {
      const { error } = await supabase.from('escala_config').upsert(
        { id: 'default', configuracao: backup.escala_config },
        { onConflict: 'id' }
      );
      if (error) throw error;
    }

    if (backup.orcamentos_oficiais?.length) {
      const { error } = await supabase.from('orcamentos_oficiais').upsert(backup.orcamentos_oficiais, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.orcamentos_rapidos?.length) {
      const { error } = await supabase.from('orcamentos_rapidos').upsert(backup.orcamentos_rapidos, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.chaves_criptografia?.length) {
      const { error } = await supabase.from('chaves_criptografia').upsert(backup.chaves_criptografia, { onConflict: 'nome' });
      if (error) throw error;
    }

    return res.status(200).json({ success: true, message: 'Backup imported successfully' });
  } catch (error) {
    return handleError(error, res);
  }
}
