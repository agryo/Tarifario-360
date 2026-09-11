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
-- das comodidades (textualmente). Para migrar para o design acima:
--
--   1. ALTERAR o tipo de `config_geral.comodidades_globais`:
--        ALTER TABLE config_geral
--          ALTER COLUMN comodidades_globais TYPE jsonb
--          USING (
--            CASE WHEN comodidades_globais IS NULL THEN NULL
--                 ELSE to_jsonb(
--                        (SELECT array_agg(jsonb_build_object(
--                              'id', gen_random_uuid()::text,
--                              'nome', trim(item)
--                        ))
--                         FROM unnest(
--                           string_to_array(comodidades_globais, ',')
--                         ) AS item)
--                      )
--            END
--          );
--
--   2. Normalizar `categorias.comodidades_selecionadas` para guardar
--      apenas os IDs (UUIDs) correspondentes, substituindo os nomes.
--      Esse passo depende de um script de mapeamento nome→id rodado
--      no frontend ou numa migration segmentada, garantindo que cada
--      UH mantenha exatamente as comodidades que já tinha.
--
--   3. Aplicar NOT NULL (com DEFAULT) em config_geral:
--        ALTER TABLE config_geral
--          ALTER COLUMN festividade SET NOT NULL,
--          ALTER COLUMN festividade SET DEFAULT '',
--          ALTER COLUMN total_uhs SET NOT NULL,
--          ALTER COLUMN total_uhs SET DEFAULT 0;
--      ATENÇÃO: antes de rodar, backfill os NULLs existentes:
--        UPDATE config_geral
--          SET festividade = COALESCE(festividade, ''),
--              total_uhs   = COALESCE(total_uhs, 0);
--      `comodidades_globais` permanece nullable (decisão do usuário).
--
--      Os demais campos jsonb (precos, temporada, horarios, promocao,
--      seguranca, orcamento) JÁ são NOT NULL no banco real — nada a fazer.
--
-- O código do frontend DEVE suportar ambos os formatos (nome legado e
-- id novo) até que a migração esteja completa.
-- =====================================================