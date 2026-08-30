const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// ATENÇÃO: NUNCA incluir a service_role key (sb_secret_*) aqui.
// Ela só existe no .env.local e é lida pelo servidor local (api/server.ts)
// via process.env — nunca deve chegar ao bundle do browser.
const url = process.env.SUPABASE_URL || process.env.supabaseUrl || '';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.supabaseAnonKey || process.env.SUPABASE_KEY || process.env.supabase_anon_key || '';

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.development.ts');

const content = `export const environment = {
  production: false,
  apiUrl: '/api',
  supabaseUrl: '${url}',
  supabaseAnonKey: '${anonKey}',
};`;

fs.writeFileSync(targetPath, content);
console.log('✅ environment.development.ts atualizado com variáveis do .env.local');
console.log(`   supabaseUrl: ${url ? url.substring(0, 40) + '...' : '(vazio)'}`);
console.log(`   supabaseAnonKey: ${anonKey ? anonKey.substring(0, 20) + '...' : '(vazio)'}`);