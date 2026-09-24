# Tarifário 360

Sistema completo para gestão de tarifas, orçamentos e escalas hoteleiras — **SPA Angular 21 + Supabase + Vercel**.

## 📋 Sobre o Projeto

O **Tarifário 360** é uma aplicação web (Single Page Application) desenvolvida para otimizar a rotina operacional de hotéis e pousadas. O sistema permite o gerenciamento centralizado de categorias de quartos (UHs), precificação dinâmica (alta/baixa temporada), promoções, escalas de trabalho da equipe e geração de orçamentos formais e rápidos.

**Stack Principal:**
- **Frontend:** Angular 21 (standalone components + signals), PrimeNG 21, PrimeFlex, TypeScript 5.9 strict
- **Backend:** Supabase (PostgreSQL + RLS + realtime), API Serverless Vercel (Node.js/TypeScript)
- **Persistência:** Supabase (produção) + localStorage fallback (desenvolvimento offline)
- **Deploy:** Vercel (push na branch `master` = deploy automático)

## 🚀 Funcionalidades Principais

### 🏨 **Módulos do Sistema (6 abas no Painel Master)**

| Módulo | Descrição |
|--------|-----------|
| **🏨 Empresa** | Dados do hotel (nome fantasia, razão social, CNPJ, endereço, telefone, e-mail, logo) — usado em orçamentos, contratos e WhatsApp |
| **📋 Tarifário** | Configuração global: festividade, total de UHs, preços de refeições (almoço/janta/lanche), kWh, temporada alta/baixa |
| **🛏️ UHs** | Categorias de quartos: capacidade, camas casal/solteiro, preços 4 modalidades (alta/baixa × com/sem café), comodidades por UH |
| **🎁 Promoções** | Regras de desconto: % desconto, diárias mínimas, só alta temporada, texto personalizado, exibir msg baixa temporada |
| **⏰ Horários** | Café da manhã, almoço, lanche, jantar — início/fim/ativo por refeição |
| **📝 Textos do Orçamento** | Placeholders editáveis para documentos: título, descrições, cronograma, pagamento, observações, rodapé, % sinal |
| **🌙 Escala** | Escala noturna configurável: data início, folgas por colaborador (Agryo/Alex), turnos madrugada/noite/dia, exportação paisagem |
| **🔐 Segurança** | Senha mestra com hash SHA-256 + salt, chaves de criptografia AES para backup |
| **💾 Backup** | Export/import completo (`.btf` criptografado AES): config_geral, categorias, escala_config, orcamentos_oficiais, chaves_criptografia + opção "Limpar Banco de Dados" (zera tudo e restaura defaults de fábrica) |

### 📄 **Orçamentos**
- **Oficial:** Propostas formais PDF (grupos/eventos) — CRUD completo, validação de datas, placeholders dinâmicos, impressão A4
- **Rápido:** Calculadora ágil para cotações imediatas no balcão/telefone — gera mensagem WhatsApp formatada com dados da empresa

### 🛠 **Outros Recursos**
- **Tabela de Opções:** Comparativo visual de quartos (solteiro/casal, café da manhã)
- **Tabela de Preços:** Impressão formatada A4 (baixa/alta temporada)
- **Wallbox:** Controle de consumo de energia por UH (kWh)
- **Comodidades (Caminho B):** Catálogo mestre em `config_geral.comodidades_globais` (array `{id, nome}` com UUIDs estáveis) + seleção por UH em `categorias.comodidades_selecionadas` (text[]) — zero joins, zero FKs

## 🏗 Arquitetura

```
src/
├── app/
│   ├── pages/              # Páginas (standalone components)
│   │   ├── painel-master/  # Área administrativa (9 tabs)
│   │   ├── orcamento-oficial/
│   │   ├── orcamento-rapido/
│   │   ├── tabela-opcoes/
│   │   ├── tabela-precos/
│   │   ├── escala-noturna/
│   │   └── wallbox/
│   ├── services/           # Business logic + repositórios
│   │   ├── repositories/   # Repository pattern (Supabase/localStorage)
│   │   ├── supabase-client.ts
│   │   └── repository-factory.ts  # Auto-detect backend
│   ├── models/             # TypeScript interfaces
│   ├── utils/              # Helpers (date, print, crypto, messages)
│   └── pipes/              # Pipes customizados
├── api/                    # Vercel Serverless Functions
│   ├── config-geral.ts
│   ├── categorias.ts
│   ├── orcamentos-oficiais.ts
│   ├── escala-config.ts
│   ├── backup/
│   └── _lib/supabase.js
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Schema limpo para projeto novo
```

**Padrão Repository:** `ConfigGeralRepository`, `CategoriaRepository`, `EscalaRepository`, `OrcamentoOficialRepository`, `ChaveCriptografiaRepository` — cada um implementa interface comum, factory escolhe `SupabaseDirectClient` (dev local) ou `VercelApiClient` (produção).

**Segurança (RLS):**
- Role `anon` (frontend via postgREST): **apenas SELECT**
- Role `service_role` (API Vercel): **ignora RLS** → INSERT/UPDATE/DELETE
- **NÃO** criar policies de escrita para `anon` — o frontend nunca escreve direto no banco

## 📦 Instalação Rápida

```bash
# 1. Clone e entre na pasta
cd Tarifario-360

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente (desenvolvimento local)
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase:
# SUPABASE_URL=https://seu-projeto.supabase.co
# SUPABASE_ANON_KEY=sua-chave-anonima

# 4. Rode o projeto (executa generate-env.js automaticamente)
npm start
# → http://localhost:4200
```

**Senha padrão do Painel Master:** `1234`

## 🗄 Setup do Supabase (Produção)

1. **Crie projeto no Supabase** → SQL Editor → execute `supabase/migrations/001_initial_schema.sql`
2. **Habilite RLS** nas 5 tabelas (o script já faz isso)
3. **Execute policies de leitura para `anon`** (já incluídas no script)
4. **Configure variáveis na Vercel:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (para API Vercel)
5. **Deploy:** push na branch `master` → Vercel faz build + deploy automático

> ⚠️ **Importante:** O script SQL cria schema vazio. Na primeira abertura do app, o frontend popula dados padrão (config_geral com senha "1234", 2 categorias exemplo, escala padrão Agryo/Alex).

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Dev server (roda `generate-env.js` + `ng serve`) |
| `npm run build` | Build produção (roda `generate-env.js` + `ng build`) |
| `npm run watch` | Build watch mode |
| `npm test` | Testes unitários |
| `node generate-env.js` | Atualiza `environment.development.ts` a partir do `.env.local` |
| `node check-console.js` | Verifica erros no console (Playwright) |

## 🌿 Branches & Deploy

- **`master`** → Produção (deploy automático Vercel)
- **`dev/refatoracao`** → Desenvolvimento (branch de trabalho)
- **Usuário gerencia git manualmente** — commits/pulls não automatizados

## 📄 Estrutura de Dados Principais

```typescript
// ConfigEmpresa (aba Empresa)
interface ConfigEmpresa {
  nomeFantasia: string;    // Nome comercial
  razaoSocial: string;     // Nome jurídico
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  logo?: string;           // Base64 data URL (SVG/PNG/JPG, máx 1MB)
}

// ConfiguracaoGeral (config_geral no Supabase)
interface ConfiguracaoGeral {
  festividade: string;
  totalUhs: number;
  comodidadesGlobais: Comodidade[];  // [{id: "uuid", nome: "Frigobar"}, ...]
  precos: { refeicoes: {almoco, janta, lanche}, kwh };
  temporada: { altaInicio, altaFim };  // ISO strings "YYYY-MM-DD"
  horarios: { cafe, almoco, lanche, jantar: {inicio, fim, ativo} };
  promocao: { ativa, desconto, minDiarias, texto, somenteAlta, msgBaixa };
  seguranca: { senhaHash, senhaSalt };
  orcamento: { textos: ConfigTextosOrcamento, sinalPercentual };
  empresa: ConfigEmpresa;
}
```

## 🔐 Segurança & Backup

- **Senhas:** SHA-256 + salt (Web Crypto API nativo)
- **Backup (`.btf`):** AES-GCM + assinatura HMAC-SHA256 — exporta/importa tudo (5 tabelas + localStorage)
- **Limpar Banco:** Deleta todas as 5 tabelas Supabase + localStorage, restaura defaults de fábrica

## 📝 Licença

Projeto privado — Hotel Plaza / Tarifário 360.

---

**Versão:** 2.1 (Angular 21 + Supabase + Vercel)  
**Última atualização:** 2026-09-24