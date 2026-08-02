-- =====================================================
-- MIGRATION 002: Drop DEFAULT on seguranca column
-- This prevents the database from overwriting explicit empty strings
-- sent by the application when user removes password
-- =====================================================

-- Drop the DEFAULT constraint on seguranca column
-- This allows the application to explicitly set seguranca to empty strings
-- when the user removes the password via "Remover Senha" button
ALTER TABLE config_geral ALTER COLUMN seguranca DROP DEFAULT;

-- Verify the change
-- \d config_geral