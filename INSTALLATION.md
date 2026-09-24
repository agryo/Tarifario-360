# Guia de Instalação e Configuração - Tarifário 360

Instruções para configurar o ambiente de desenvolvimento e executar o projeto **Tarifário 360** (Angular 21 + Supabase + Vercel).

---

## Pré-requisitos

| Ferramenta | Versão Mínima | Link |
|------------|---------------|------|
| **Node.js** | 20 LTS (recomendado 22+) | [nodejs.org](https://nodejs.org/) |
| **npm** | 10+ (vem com Node) | — |
| **Angular CLI** | 21+ | `npm install -g @angular/cli@latest` |
| **Supabase CLI** (opcional) | 1.x | [supabase.com/docs](https://supabase.com/docs/guides/cli) |
| **Vercel CLI** (opcional) | 34+ | `npm i -g vercel` |

---

## Passo a Passo

### 1. Clone e acesse o projeto

```bash
git clone <seu-repo>
cd Tarifario-360
```

### 2. Instale dependências

```bash
npm install
```

### 3. Configure variáveis de ambiente (Desenvolvimento Local)

O projeto usa **Supabase** como backend. Para desenvolvimento local com Supabase direto (sem Vercel), crie o arquivo `.env.local` na raiz:

```bash
# Copie o exemplo
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
# Obrigatórias para desenvolvimento local com supabase-direct
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase

# Opcional: para testar API Vercel localmente (ver seção "API Local")
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

> **Importante:**  
> - `.env.local` está no `.gitignore` — **nunca commite**  
> - As variáveis são injetadas no `src/environments/environment.development.ts` (também no `.gitignore`) pelo script `generate-env.js`, que roda **automaticamente** em `npm start` e `npm run build`  
> - Se você usar `ng serve` **diretamente**, o `environment.development.ts` **não será gerado**. Rode manualmente: `node generate-env.js`

### 4. Configure o Supabase (Banco de Dados)

#### Opção A: Projeto Novo (do zero)
1. Crie projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor** → **New Query**
3. Copie e cole **todo o conteúdo** de `supabase/migrations/001_initial_schema.sql`
4. Clique **Run** (Ctrl+Enter)
5. Pronto! Tabelas, RLS e policies criadas.

> O script cria 5 tabelas: `config_geral`, `categorias`, `orcamentos_oficiais`, `escala_config`, `chaves_criptografia`  
> Na primeira abertura do app, o frontend popula defaults (senha "1234", 2 categorias, escala Agryo/Alex).

#### Opção B: Projeto Existente (já tem dados)
- **Não execute** o `001_initial_schema.sql` — ele é para banco vazio
- Use migrações incrementais ou sincronize via Supabase CLI

### 5. Execute o Servidor de Desenvolvimento

```bash
npm start
# ou: npm run dev  (alias)
```

- Executa `generate-env.js` → atualiza `environment.development.ts`
- Inicia `ng serve` em `http://localhost:4200`
- Hot reload ativo

**Senha padrão do Painel Master:** `1234`

---

## 🏗 Build para Produção

```bash
npm run build
```

- Executa `generate-env.js` + `ng build --configuration production`
- Usa `environment.ts` (produção) — variáveis vêm do **Vercel Project Settings**, não do `.env.local`
- Saída em `dist/Tarifario-360/`

### Variáveis de Produção (Vercel Dashboard → Settings → Environment Variables)

| Variável | Obrigatória? | Descrição |
|----------|--------------|-----------|
| `SUPABASE_URL` | ✅ Sim | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | ✅ Sim | Chave anônima (frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sim | Chave service_role (API Vercel — ignora RLS) |

---

## 🌐 API Local (Opcional)

Para testar as **Vercel Serverless Functions** localmente:

```bash
# Terminal 1: Frontend
npm start

# Terminal 2: API (porta 3000)
npm run api
# → http://localhost:3000/api/*
```

Requer `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

---

## 📁 Estrutura de Arquivos de Ambiente

| Arquivo | Descrição | Commitado? | Usado Em |
|---------|-----------|------------|----------|
| `.env.local` | Credenciais reais (Supabase) | ❌ Não | Dev local |
| `src/environments/environment.ts` | Config base (produção) | ✅ Sim | Build produção (Vercel) |
| `src/environments/environment.development.ts` | Gerado por `generate-env.js` | ❌ Não | `ng serve` / `npm start` |

**Fluxo:**
```
.env.local → (generate-env.js) → environment.development.ts → ng serve
Vercel Env Vars → environment.ts (build time) → ng build --prod
```

---

## 🔧 Scripts Úteis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Dev server (generate-env.js + ng serve) |
| `npm run build` | Build produção (generate-env.js + ng build) |
| `npm run watch` | Build watch mode (generate-env.js + ng build --watch) |
| `npm test` | Testes unitários (Karma/Jasmine) |
| `node generate-env.js` | Atualiza manualmente `environment.development.ts` |
| `node load-env.js` | Carrega `.env.local` no processo Node (interno) |
| `node check-console.js` | Verifica erros console (Playwright, app em localhost:4200) |

---

## 🌿 Branches & Deploy

```
master (produção) ←── deploy automático Vercel no push
  ↑
dev/refatoracao (desenvolvimento) — branch de trabalho
```

> **Regra do projeto:** Usuário gerencia git manualmente — **não execute `git commit` ou `git pull`**. Apenas sugira mensagem de commit.

### Deploy na Vercel
1. Conecte repositório na Vercel
2. Configure **Environment Variables** (3 variáveis acima)
3. Build Command: `npm run build` (já configurado no `vercel.json`/`package.json`)
4. Output Directory: `dist/Tarifario-360`
5. Push na `master` → deploy automático

---

## 🗄 Supabase — Detalhes Importantes

### RLS (Row Level Security)
- **Todas as 5 tabelas têm RLS habilitado**
- Role `anon` (frontend): **apenas SELECT** (políticas já no `001_initial_schema.sql`)
- Role `service_role` (API Vercel): **ignora RLS** → faz INSERT/UPDATE/DELETE
- **NÃO crie policies de escrita para `anon`** — frontend não escreve direto no banco

### Schema (5 tabelas)

```sql
config_geral           -- 1 linha: config global + empresa (jsonb)
categorias             -- N linhas: UHs/tipos de quarto
orcamentos_oficiais    -- N linhas: orçamentos formais (PDF)
escala_config          -- 1 linha: config escala noturna (jsonb)
chaves_criptografia    -- N linhas: chaves AES para backup
```

### Comodidades (Caminho B)
- `config_geral.comodidades_globais` (jsonb): catálogo mestre `[{id: "uuid", nome: "Frigobar"}, ...]`
- `categorias.comodidades_selecionadas` (text[]): IDs selecionados por UH `["uuid-frigobar", ...]`
- Zero joins, zero FKs — frontend resolve em memória

---

## 🐛 Solução de Problemas

### "Variáveis Supabase não encontradas"
```bash
# Verifique .env.local existe e tem SUPABASE_URL + SUPABASE_ANON_KEY
cat .env.local
# Rode manualmente
node generate-env.js
```

### Erro de conexão Supabase
- Confirme URL e chave anônima no **Supabase Dashboard → Settings → API**
- Projeto não pode estar "Paused"

### Porta 4200 em uso
```bash
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :4200
kill -9 <PID>
```

### Build falha com "maximumWarning"
- Ajuste `angular.json` → `budgets[0].maximumWarning` (atual: 2.5MB)

### RLS bloqueando escrita na API
- Confirme `SUPABASE_SERVICE_ROLE_KEY` na Vercel
- API usa `supabaseAdmin` (service_role) que ignora RLS

---

## 📦 Dependências Principais (package.json)

```json
{
  "@angular/core": "^21.x",
  "@angular/build": "^21.x",
  "@supabase/supabase-js": "^2.x",
  "primeng": "^21.x",
  "primeflex": "^3.x",
  "primeicons": "^7.x",
  "crypto-js": "^4.x",
  "html2canvas": "^1.x"
}
```

---

## 📝 Notas Finais

- **Arquitetura:** Standalone components + signals + repository pattern
- **Persistência:** Supabase (prod) + localStorage fallback (dev offline)
- **Impressão:** `ImpressaoService` (window.open + cloneNode) + `print-styles.ts` (CSS isolado)
- **Backup:** `.btf` criptografado AES-GCM + HMAC-SHA256
- **Senhas:** SHA-256 + salt (Web Crypto API)

---

**Última atualização:** 2026-09-24  
**Versão do sistema:** 2.1 (Angular 21 + Supabase + Vercel)