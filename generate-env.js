const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

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