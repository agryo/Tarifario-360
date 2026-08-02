import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const config = req.body;

    const { data: existing } = await supabase
      .from('config_geral')
      .select('id')
      .limit(1)
      .single();

    let result;
    let error;

    const mappedConfig = {
      ...config,
      total_uhs: config.totalUhs,
      comodidades_globais: config.comodidadesGlobais,
      criado_em: config.criado_em,
      atualizado_em: config.atualizado_em,
      // SEMPRE incluir seguranca para evitar DEFAULT do banco sobrescrever
      seguranca: config.seguranca ?? { senhaHash: '', senhaSalt: '' },
    };

    if (existing) {
      ({ data: result, error } = await supabase
        .from('config_geral')
        .update({ ...mappedConfig, atualizado_em: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data: result, error } = await supabase
        .from('config_geral')
        .insert({ ...mappedConfig, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
        .select()
        .single());
    }

    if (error) throw error;
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
