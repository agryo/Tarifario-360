import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

// 1. Gerar environment.development.ts a partir do .env.local
console.log('⏳ Gerando environment...\n');
execSync('node ' + join(root, 'generate-env.js'), { cwd: root, stdio: 'inherit' });

console.log('\n⏳ Iniciando API local (porta 3001)...');
const api = spawn('node', ['--env-file=.env.local', '--import', 'tsx', 'api/server.ts'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

console.log('⏳ Iniciando Angular dev server (porta 4200)...');
const ng = spawn('npx', ['ng', 'serve'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  api.kill('SIGTERM');
  ng.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);