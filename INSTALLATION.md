# Guia de Instalação e Configuração - Tarifário 360

Este documento fornece as instruções necessárias para configurar o ambiente de desenvolvimento e executar o projeto **Tarifário 360**.

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

1.  **Node.js**: O ambiente de execução JavaScript. Recomenda-se a versão LTS (Long Term Support).
    - [Download Node.js](https://nodejs.org/)
2.  **npm**: O gerenciador de pacotes do Node (geralmente instalado automaticamente junto com o Node.js).

## Passo a Passo

### 1. Instalar o Angular CLI

O projeto é construído com o framework Angular. Se você ainda não possui a CLI (Command Line Interface) instalada globalmente, execute o seguinte comando no terminal:

```bash
npm install -g @angular/cli
```

### 2. Acessar a Pasta do Projeto

Navegue até a pasta raiz do projeto via terminal:

```bash
cd Tarifario-360
```

### 3. Instalar Dependências

Instale todas as bibliotecas necessárias (incluindo Angular, PrimeNG e outras dependências listadas no `package.json`):

```bash
npm install
```

### 4. Configurar Variáveis de Ambiente (Supabase)

O projeto usa Supabase como backend. Você precisa criar um arquivo `.env.local` na raiz do projeto com as credenciais do Supabase:

**Crie o arquivo `.env.local` na raiz do projeto:**

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

> **Importante:** O arquivo `.env.local` está no `.gitignore` e não deve ser commitado. As variáveis são injetadas no arquivo `src/environments/environment.development.ts` (também no `.gitignore`) pelo script `generate-env.js` que roda automaticamente nos comandos `npm start` e `npm run build`.

### 5. Executar o Servidor de Desenvolvimento

Para rodar a aplicação localmente em modo de desenvolvimento:

```bash
npm start
```

> **Nota:** O comando `npm start` executa automaticamente o script `generate-env.js` (que lê o `.env.local` e atualiza o `environment.development.ts`) antes de iniciar o `ng serve`.

Após a compilação, acesse `http://localhost:4200/` no seu navegador. A aplicação recarregará automaticamente se você modificar qualquer arquivo fonte.

**Senha Padrão:** 1234

### 6. Build para Produção

Para gerar os arquivos otimizados para implantação (produção), execute:

```bash
npm run build
```

> **Nota:** O comando `npm run build` também executa o `generate-env.js` antes do build.

Os arquivos de saída serão gerados no diretório `dist/`.

## Scripts Úteis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor de desenvolvimento (roda `generate-env.js` + `ng serve`) |
| `npm run build` | Build de produção (roda `generate-env.js` + `ng build`) |
| `npm run watch` | Build em modo watch para desenvolvimento |
| `npm test` | Executa testes unitários |
| `node generate-env.js` | Atualiza manualmente o `environment.development.ts` a partir do `.env.local` |
| `node load-env.js` | Carrega variáveis do `.env.local` no processo Node (usado internamente) |
| `node check-console.js` | Verifica erros no console do navegador (requer Playwright e app rodando em localhost:4200) |

## Estrutura de Arquivos de Ambiente

| Arquivo | Descrição | Commitado? |
|---------|-----------|------------|
| `.env.local` | Suas credenciais reais do Supabase (NUNCA commitar) | ❌ Não |
| `src/environments/environment.ts` | Configuração base (produção) | ✅ Sim |
| `src/environments/environment.development.ts` | Gerado automaticamente pelo `generate-env.js` | ❌ Não |

## Solução de Problemas

### "Variáveis Supabase não encontradas"
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Confirme que as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão definidas corretamente
- Rode `node generate-env.js` manualmente para ver o output

### Erro de conexão com Supabase
- Verifique se a URL e a chave anônima estão corretas no painel do Supabase (Settings > API)
- Confirme se o projeto Supabase está ativo (não pausado)

### Porta 4200 já em uso
```bash
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :4200
kill -9 <PID>
```

## Dependências Principais

- **@angular/core** ^19.2.0
- **@supabase/supabase-js** ^2.49.4
- **primeng** ^19.0.6
- **chart.js** ^4.4.8
- **date-fns** ^4.1.0
- **zod** ^3.24.2

---

**Última atualização:** 2026-07-31