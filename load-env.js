// load-env.js - Carrega .env.local e injeta nas variáveis de ambiente do Node
// Usado antes do build do Angular

require('dotenv').config({ path: '.env.local' });

// Verifica se as variáveis estão carregadas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️  Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas em .env.local');
  console.warn('   O build continuará mas o supabase-direct não funcionará.');
} else {
  console.log('✅ Variáveis Supabase carregadas do .env.local');
}