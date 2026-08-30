import express from 'express';
import categoriasHandler from './categorias.js';
import configGeralHandler from './config-geral.js';
import configHandler from './config.js';
import criptografiaHandler from './criptografia.js';
import escalaHandler from './escala.js';
import orcamentosOficiaisHandler from './orcamentos-oficiais.js';
import backupHandler from './backup.js';
import databaseHandler from './database.js';
import healthHandler from './health.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

const routes: Record<string, (req: any, res: any) => void> = {
  '/api/categorias': categoriasHandler,
  '/api/config-geral': configGeralHandler,
  '/api/config': configHandler,
  '/api/criptografia': criptografiaHandler,
  '/api/escala': escalaHandler,
  '/api/orcamentos-oficiais': orcamentosOficiaisHandler,
  '/api/backup': backupHandler,
  '/api/database': databaseHandler,
  '/api/health': healthHandler,
};

for (const [path, handler] of Object.entries(routes)) {
  app.all(path, (req, res) => handler(req, res));
}

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`API local rodando em http://localhost:${PORT}`);
});
