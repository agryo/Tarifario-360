import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, handleError, corsHeaders, handleOptions } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [categorias, configGeral, escalaConfig, orcamentosOficiais, orcamentosRapidos, chaves] = await Promise.all([
      supabase.from('categorias').select('*'),
      supabase.from('config_geral').select('*').limit(1).single(),
      supabase.from('escala_config').select('configuracao').limit(1).single(),
      supabase.from('orcamentos_oficiais').select('*'),
      supabase.from('orcamentos_rapidos').select('*'),
      supabase.from('chaves_criptografia').select('*'),
    ]);

    const backup = {
      versao: '2.0',
      data_exportacao: new Date().toISOString(),
      categorias: categorias.data ?? [],
      config_geral: configGeral.data ?? null,
      escala_config: escalaConfig.data?.configuracao ?? null,
      orcamentos_oficiais: orcamentosOficiais.data ?? [],
      orcamentos_rapidos: orcamentosRapidos.data ?? [],
      chaves_criptografia: chaves.data ?? [],
    };

    return res.status(200).json(backup);
  } catch (error) {
    return handleError(error, res);
  }
}
