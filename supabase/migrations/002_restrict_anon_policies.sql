-- =====================================================
-- MIGRATION 002 - RESTRINGIR ANON A SELECT APENAS
-- =====================================================
-- Remove as policies permissivas "Allow all operations"
-- e cria policies de SELECT apenas para o role anon.
--
-- service_role (usado pela API Vercel) ignora RLS,
-- então não precisa de policy alguma.
-- =====================================================

-- 1. Remover policies antigas (permissivas)
DROP POLICY IF EXISTS "Allow all operations on config_geral" ON config_geral;
DROP POLICY IF EXISTS "Allow all operations on categorias" ON categorias;
DROP POLICY IF EXISTS "Allow all operations on orcamentos_oficiais" ON orcamentos_oficiais;
DROP POLICY IF EXISTS "Allow all operations on escala_config" ON escala_config;
DROP POLICY IF EXISTS "Allow all operations on chaves_criptografia" ON chaves_criptografia;

-- 2. Remover policies "service_role all" (se existirem, criadas manualmente no dashboard)
DROP POLICY IF EXISTS "service_role all" ON config_geral;
DROP POLICY IF EXISTS "service_role all" ON categorias;
DROP POLICY IF EXISTS "service_role all" ON orcamentos_oficiais;
DROP POLICY IF EXISTS "service_role all" ON escala_config;
DROP POLICY IF EXISTS "service_role all" ON chaves_criptografia;

-- 3. Criar policies de SELECT para anon (apenas leitura)
-- Isso permite que o app leia dados sem comprometer escrita
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