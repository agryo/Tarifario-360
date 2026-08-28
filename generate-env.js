const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Suporta múltiplos formatos de variáveis de ambiente:
// Local (.env.local): SUPABASE_URL, SUPABASE_ANON_KEY
// Vercel: supabaseUrl, supabase_anon_key (lowercase/underscore)
// Vercel alternativo: SUPABASE_URL, SUPABASE_KEY
const url = process.env.SUPABASE_URL || process.env.supabaseUrl || '';
const key = process.env.SUPABASE_ANON_KEY || process.env.supabaseAnonKey || process.env.SUPABASE_KEY || process.env.supabase_anon_key || '';

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.development.ts');

const content = `export const environment = {
  production: false,
  apiUrl: '/api',
  supabaseUrl: '${url}',
  supabaseAnonKey: '${key}',
};`;

fs.writeFileSync(targetPath, content);
console.log('✅ environment.development.ts atualizado com variáveis do .env.local');
console.log(`   supabaseUrl: ${url ? url.substring(0, 40) + '...' : '(vazio)'}`);
console.log(`   supabaseAnonKey: ${key ? key.substring(0, 20) + '...' : '(vazio)'}`);