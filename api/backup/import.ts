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

    // PRIMEIRO: Limpar todas as tabelas (ordem inversa de dependência)
    const tablesToClear = [
      'orcamentos_oficiais',
      'chaves_criptografia',
      'escala_config',
      'config_geral',
      'categorias',
    ];
    for (const table of tablesToClear) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn(`Warning clearing ${table}:`, error);
    }

    // Import in order: categorias first (referenced by orcamentos_oficiais)
    if (backup.categorias?.length) {
      const { error } = await supabase.from('categorias').upsert(backup.categorias, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.config_geral) {
      const { error } = await supabase.from('config_geral').upsert(backup.config_geral, { onConflict: 'id' });
      if (error) throw error;
    }

    if (backup.escala_config) {
      // escala_config has UUID primary key - delete existing row first, then insert new
      const { error: deleteError } = await supabase.from('escala_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) console.warn('Warning clearing escala_config:', deleteError);

      const { error } = await supabase.from('escala_config').insert({ configuracao: backup.escala_config });
      if (error) throw error;
    }

    if (backup.orcamentos_oficiais?.length) {
      const { error } = await supabase.from('orcamentos_oficiais').upsert(backup.orcamentos_oficiais, { onConflict: 'id' });
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
