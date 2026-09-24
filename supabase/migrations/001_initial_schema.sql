-- =====================================================
-- MIGRATION 001 - SCHEMA INICIAL DO TARIFARIO-360
-- =====================================================
-- 📋 PARA QUE SERVE ESTE ARQUIVO:
--    Cria TODAS as tabelas, índices, constraints e políticas de segurança (RLS)
--    necessárias para o Tarifário-360 funcionar do zero em um projeto Supabase novo.
--
-- 🚀 COMO USAR:
--    1. Crie um novo projeto no Supabase (https://supabase.com/dashboard)
--    2. Vá em "SQL Editor" → "New query"
--    3. Copie e cole TODO o conteúdo deste arquivo
--    4. Clique em "Run" (ou Ctrl+Enter)
--    5. Pronto! O banco está criado e seguro.
--
-- ⚠️  IMPORTANTE:
--    - Este arquivo DEVE ser executado em banco VAZIO (sem tabelas).
--    - Se já houver dados, NÃO execute — use migrações incrementais.
--    - Após rodar, o frontend (Angular) popula automaticamente os dados padrão
--      na primeira vez que abrir (config_geral, 2 categorias exemplo, escala).
--
-- 📦 TABELAS CRIADAS (5):
--    1. config_geral          → Configuração global do hotel (uma linha só)
--    2. categorias            → Tipos de quartos/UHs (várias linhas)
--    3. orcamentos_oficiais   → Orçamentos formais salvos (PDF, grupos, eventos)
--    4. escala_config         → Configuração da escala noturna (uma linha)
--    5. chaves_criptografia   → Chaves para criptografia de dados sensíveis
--
-- 🔧 DESIGN DAS COMODIDADES (Caminho B simplificado):
--    - NÃO há tabela "comodidades" separada (simplificação intencional).
--    - config_geral.comodidades_globais (jsonb) = CATÁLOGO MESTRE
--        Array de objetos: [{ "id": "uuid-estavel", "nome": "Frigobar" }, ...]
--        O "id" é um UUID determinístico (SHA-256 do nome normalizado).
--        Renomear uma comodidade muda só o "nome"; o "id" NÃO muda.
--    - categorias.comodidades_selecionadas (text[]) = SELEÇÃO POR UH
--        Guarda apenas os IDs: ["uuid-frigobar", "uuid-tv", ...]
--        A resolução ID→Nome é feita no frontend lendo comodidades_globais.
--    - Vantagem: zero joins, zero FKs, frontend resolve tudo em memória.
--    - Campos omitidos intencionalmente: ordem, criado_em, atualizado_em, ativo.
--      A ordem de exibição é derivável (ex: alfabética por nome).
--      O estado "selecionado" vive só em cada UH (comodidades_selecionadas).
--
-- 🔐 SEGURANÇA (RLS - Row Level Security):
--    - TODAS as tabelas têm RLS habilitado.
--    - Role `anon` (frontend via postgREST): APENAS SELECT (leitura).
--    - Role `service_role` (API Vercel / backend): IGNORA RLS → faz INSERT/UPDATE/DELETE.
--    - NÃO crie policies de escrita para `anon` — o frontend NÃO escreve direto no banco.
--    - A API Vercel (serverless functions) usa service_role key nas variáveis de ambiente.
--
-- 🔑 EXTENSÕES NECESSÁRIAS:
--    - pgcrypto: para gen_random_uuid() e digest() (hash SHA-256).
--      Já vem habilitada por padrão no Supabase, mas o CREATE EXTENSION é idempotente.
-- =====================================================

-- Pré-requisito: extensão para geração de UUIDs e hash
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    empresa             jsonb,
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
-- 3. DADOS INICIAIS (OPCIONAL - rodar após criar tabelas)
-- =====================================================
-- Inserir registro inicial em config_geral com valores padrão
-- O frontend já popula com defaults se a tabela estiver vazia,
-- mas isso garante que a linha exista para o RLS funcionar.
--
-- INSERT INTO config_geral (festividade, total_uhs, precos, temporada, horarios, promocao, seguranca, orcamento, empresa)
-- VALUES (
--   '🎊 Evento Especial',
--   50,
--   '{"refeicoes": {"almoco": 45, "janta": 55, "lanche": 25}, "kwh": 0.89}',
--   '{"altaInicio": "2026-01-01", "altaFim": "2026-12-31"}',
--   '{"cafe": {"inicio": "07:00", "fim": "10:00", "ativo": true}, "almoco": {"inicio": "12:00", "fim": "14:00", "ativo": true}, "lanche": {"inicio": "15:00", "fim": "17:00", "ativo": true}, "jantar": {"inicio": "19:00", "fim": "21:00", "ativo": true}}',
--   '{"ativa": false, "desconto": 15, "minDiarias": 3, "texto": "Pagamento integral via Pix ou Dinheiro", "somenteAlta": true, "msgBaixa": false}',
--   '{"senhaHash": "", "senhaSalt": ""}',
--   '{"textos": {"titulo": "Orçamento de Hospedagem", "configTitulo": "1. Configuração de Acomodação e Valores", "configDescricao": "A proposta contempla a estadia com café da manhã incluso...", "notaRefeicoes": "Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...", "cronograma": "Check-in: {checkinHora} do dia {checkinDataBr}.\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\n{mensagemHorasExtras}", "pagamento": "Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...", "observacoes": "Refeições: O café da manhã é cortesia da casa e já está incluso...", "rodape": "Setor de Reservas - Meu Hotel"}, "sinalPercentual": 50}',
--   '{"nomeFantasia": "Meu Hotel", "razaoSocial": "Meu Hotel LTDA", "cnpj": "00.000.000/0000-00", "telefone": "(00) 00000-0000", "email": "contato@meuhotel.com.br", "endereco": "Rua Exemplo", "numero": "123", "bairro": "Centro", "cidade": "Cidade Exemplo", "uf": "XX", "cep": "00000-000", "logo": ""}'
-- );

-- =====================================================
-- FIM DO SCHEMA INICIAL
-- =====================================================