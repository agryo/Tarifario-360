import { createClient } from '@supabase/supabase-js';
export { createClient };

export const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

export function handleError(error: unknown, res: any) {
  console.error('API Error:', error);
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; message: string };
    if (pgError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Not found' });
    }
    if (pgError.code === '23505') {
      return res.status(409).json({ error: 'Duplicate entry' });
    }
  }
  return res.status(500).json({ error: 'Internal server error' });
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function handleOptions(res: any) {
  Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));
  res.status(200).end();
}