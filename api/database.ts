import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);

  // DELETE /api/database -> limpar todo o banco
  if (req.method === 'DELETE') {
    try {
      // Delete all data from all tables (in correct order due to foreign keys)
      const tables = [
        'orcamentos_oficiais',
        'chaves_criptografia',
        'escala_config',
        'config_geral',
        'categorias',
      ];

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          console.warn(`Error clearing ${table}:`, error);
        }
      }

      return res.status(200).json({ success: true, message: 'Database cleared successfully' });
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}