-- =====================================================
-- MIGRATION 001 - SCHEMA ATUAL (reflete o banco real)
-- =====================================================
-- Estado atual das 5 tabelas do Supabase. Este arquivo é a FONTE DE
-- VERDADE para consultas de IA e NÃO é executado automaticamente no
-- banco — alterações estruturais devem ser aplicadas manualmente no
-- SQL Editor do Supabase.
--
-- Tabelas:
--   categorias, chaves_criptografia, config_geral, escala_config,
--   orcamentos_oficiais.
--
-- DESIGN DAS COMODIDADES (Caminho B simplificado):
--   - `config_geral.comodidades_globais` (jsonb) é a fonte de verdade
--     dos RÓTULOS: array de `{ id, nome }`, onde `id` é um UUID
--     estável e `nome` é o texto editável. Renomear uma comodidade
--     muda apenas `nome`; o `id` permanece → NÃO quebra o vínculo.
--   - `categorias.comodidades_selecionadas` (text[]) guarda apenas os
--     IDs das comodidades escolhidas por cada UH. A resolução id→nome
--     é feita no frontend olhando para `comodidades_globais`.
--   - NÃO existe tabela `comodidades` separada. `ordem`, `criado_em`,
--     `atualizado_em` e `ativo` foram intencionalmente OMITIDOS: a
--     ordem de exibição não precisa ser persistida (é derivável, ex.
--     alfabética por `nome`) e o estado "ativo/selecionado" vive em
--     cada UH via `comodidades_selecionadas` (um único lugar de verdade).
--
-- IMPORTANTE SOBRE O ACESSO (RLS):
--   - role `anon`  -> apenas SELECT (leitura). O app usa este role
--     para consultas no frontend (postgREST).
--   - role `service_role` (usado pela API Vercel) ignora RLS e faz
--     INSERT/UPDATE/DELETE. NÃO precisa de policy.
-- =====================================================

-- =====================================================
-- 1. TABELAS
-- =====================================================

CREATE TABLE IF NOT EXISTS config_geral (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    festividade         text NOT NULL DEFAULT '',
    total_uhs           integer NOT NULL DEFAULT 0,
    comodidades_globais jsonb,
    precos              jsonb NOT NULL,
    temporada           jsonb NOT NULL,
    horarios            jsonb NOT NULL,
    promocao            jsonb NOT NULL,
    seguranca           jsonb NOT NULL,
    orcamento           jsonb NOT NULL,
    criado_em           timestamp with time zone DEFAULT now(),
    atualizado_em       timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categorias (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                   text NOT NULL,
    capacidade_maxima      integer NOT NULL,
    preco_alta_cafe        numeric NOT NULL,
    preco_alta_sem_cafe    numeric NOT NULL,
    preco_baixa_cafe       numeric NOT NULL,
    preco_baixa_sem_cafe   numeric NOT NULL,
    ativo                  boolean NOT NULL DEFAULT true,
    descricao              text,
    camas_casal            integer,
    camas_solteiro         integer,
    tipo_ocupacao_padrao   text,
    numeros                text[],
    comodidades_selecionadas text[],
    criado_em              timestamp with time zone DEFAULT now(),
    atualizado_em          timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcamentos_oficiais (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo          text NOT NULL DEFAULT 'orcamento'::text,
    titulo        text NOT NULL,
    cliente       text NOT NULL,
    evento        text,
    data_geracao  timestamp with time zone NOT NULL,
    data_validade timestamp with time zone NOT NULL,
    data_checkin  timestamp with time zone NOT NULL,
    data_checkout timestamp with time zone NOT NULL,
    hora_entrada  text,
    hora_saida    text,
    temporada     text,
    itens         jsonb NOT NULL DEFAULT '[]'::jsonb,
    observacoes   text,
    status        text DEFAULT 'rascunho'::text,
    assinatura    text,
    criado_em     timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escala_config (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    configuracao  jsonb NOT NULL,
    criado_em     timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chaves_criptografia (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome      text NOT NULL,
    chave     text NOT NULL,
    iv        text,
    salt      text,
    criado_em timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 2. POLÍTICAS RLS (segurança)
-- =====================================================
-- role anon => apenas leitura (SELECT) em todas as tabelas.
-- Escrita é feita exclusivamente pela API Vercel via service_role,
-- que ignora RLS e portanto não requer policy.

ALTER TABLE config_geral          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos_oficiais   ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chaves_criptografia   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_config_geral" ON config_geral
    FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_categorias" ON categorias
    FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_orcamentos_oficiais" ON orcamentos_oficiais
    FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_escala_config" ON escala_config
    FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_chaves_criptografia" ON chaves_criptografia
    FOR SELECT TO anon USING (true);

-- =====================================================
-- 3. MIGRAÇÃO PENDENTE (aplicar manualmente no Supabase)
-- =====================================================
-- NOTA: o banco REAL ainda está com `comodidades_globais` como `text`
-- (CSV separado por vírgula) e `comodidades_selecionadas` com os NOMES
-- das comodidades (textualmente). Para migrar para o design acima,
-- rodar os passos abaixo NO SQL EDITOR do Supabase, NA ORDEM.
--
-- PRÉ-REQUISITO (obrigatório, rodar ANTES de qualquer passo):
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- O ID de cada comodidade é gerado pelo MESMO algoritmo determinístico do
-- frontend (ComodidadeService.idEstavel): SHA-256 do nome normalizado
-- (trim + lowercase), primeiros 128 bits (32 hex chars), formatado como
-- UUID v4 com versão '4' e variante '8'. Isso garante que o mesmo nome
-- produza o mesmo UUID no banco E no frontend — preservando o vínculo
-- UH ↔ comodidade sem depender de um gerador aleatório (gen_random_uuid()).
--
-- =====================================================
-- PASSO 1 — Converter comodidades_globais de text CSV → jsonb array {id, nome}
-- =====================================================
-- A função auxiliar `id_estavel(text)` replica o idEstavel do frontend:
--   h      = primeiros 32 hex chars do sha256(trim(lower(nome)))
--   timeLow = h[ 1.. 8]   timeMid = h[ 9..12]
--   timeHiAndVersion = '4' + h[14..16]
--   clockSeqHiVariant = '8' + h[18..20]
--   node   = h[21..32]
--
CREATE OR REPLACE FUNCTION id_estavel(nome text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  norm text := btrim(lower(coalesce(nome, '')));
  h    text;
BEGIN
  IF norm = '' THEN
    RETURN '00000000-0000-4000-8000-000000000000';
  END IF;

  -- h = primeiros 32 hex chars do sha256(norm). digest() retorna bytea de 32
  -- bytes (64 hex chars); encode(...,'hex') dá minúsculas; left(...) pega 32.
  h := left(encode(digest(norm, 'sha256'), 'hex'), 32);

  -- Mesma estrutura de src: timeLow-timeMid-timeHiAndVersion-clockSeq-node
  RETURN substr(h,  1, 8) || '-' ||
         substr(h,  9, 4) || '-4' ||
         substr(h, 14, 3) || '-8' ||
         substr(h, 18, 3) || '-' ||
         substr(h, 21, 12);
END;
$$;

-- Helper: converte o CSV legado de comodidades_globais em jsonb array {id, nome}.
-- Precisa ser uma FUNÇÃO e não um subquery inline, pois o PostgreSQL NÃO permite
-- subquery na expressão USING de um ALTER COLUMN TYPE ("cannot use subquery in
-- transform expression"). A função chama id_estavel() mantendo a paridade com o
-- frontend.
CREATE OR REPLACE FUNCTION csv_comodidades_para_jsonb(csv text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  resultado jsonb;
BEGIN
  IF csv IS NULL OR btrim(csv) = '' THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT to_jsonb(array_agg(
           jsonb_build_object('id', id_estavel(btrim(item)), 'nome', btrim(item))
           ORDER BY btrim(item)))
  FROM unnest(string_to_array(csv, ',')) AS item
  WHERE btrim(item) <> ''
  INTO resultado;

  RETURN COALESCE(resultado, '[]'::jsonb);
END;
$$;

-- Converte a coluna (somente se ainda for text — idempotente). A conversão usa
-- a função acima para que os UUIDs sejam estáveis e idênticos aos do frontend.
-- Usamos um bloco DO em vez de ALTER direto, pois o SQL Editor do Supabase reverte
-- o script em transação quando algum statement falha — e o tipo só deve ser trocado
-- caso a coluna realmente ainda seja 'text' (não é seguro reaplicar ALTER em jsonb).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'config_geral'
      AND column_name = 'comodidades_globais'
      AND data_type <> 'jsonb'
  ) THEN
    EXECUTE 'ALTER TABLE config_geral
             ALTER COLUMN comodidades_globais TYPE jsonb
             USING (csv_comodidades_para_jsonb(comodidades_globais))';
  END IF;
END $$;

-- =====================================================
-- PASSO 2 — Normalizar categorias.comodidades_selecionadas (nome → id)
-- =====================================================
-- Configura FK-style link: não há FK real, a resolução é por JSONB. Aqui
-- substituímos cada NOME legado pelo ID estável correspondente, olhando
-- para comodidades_globais. Nomes sem correspondência são preservados
-- (o frontend os ignora), evitando perda silenciosa de dados.
--
UPDATE categorias c
SET comodidades_selecionadas = (
  SELECT array_agg(
           COALESCE(
             (SELECT g.value ->> 'id'
              FROM config_geral cg
              CROSS JOIN LATERAL jsonb_array_elements(cg.comodidades_globais) AS g
              WHERE lower(btrim(g.value ->> 'nome')) = lower(btrim(nome_item))
              LIMIT 1),
             nome_item
           )
         )
  FROM unnest(c.comodidades_selecionadas) AS nome_item
)
WHERE c.comodidades_selecionadas IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM config_geral
    WHERE jsonb_typeof(comodidades_globais) = 'array'
      AND jsonb_array_length(comodidades_globais) > 0
  );

-- =====================================================
-- PASSO 3 — Aplicar NOT NULL (com DEFAULT) em config_geral
-- =====================================================
-- ATENÇÃO: antes de rodar, backfill os NULLs existentes:
UPDATE config_geral
  SET festividade = COALESCE(festividade, ''),
      total_uhs   = COALESCE(total_uhs, 0);

ALTER TABLE config_geral
  ALTER COLUMN festividade SET NOT NULL,
  ALTER COLUMN festividade SET DEFAULT '',
  ALTER COLUMN total_uhs SET NOT NULL,
  ALTER COLUMN total_uhs SET DEFAULT 0;
-- `comodidades_globais` permanece nullable (decisão do usuário).
--
-- Os demais campos jsonb (precos, temporada, horarios, promocao,
-- seguranca, orcamento) JÁ são NOT NULL no banco real — nada a fazer.
--
-- O código do frontend DEVE suportar ambos os formatos (nome legado e
-- id novo) até que a migração esteja completa.
-- =====================================================