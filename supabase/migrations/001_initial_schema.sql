-- Supabase Migration: Initial Schema for Tarifario-360
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Configurações gerais (generic key-value with JSONB)
CREATE TABLE configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  chave TEXT NOT NULL,
  dados JSONB NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(categoria, chave)
);
CREATE INDEX idx_config_dados_gin ON configuracoes USING GIN (dados);
CREATE INDEX idx_config_categoria ON configuracoes (categoria);

-- 2. Orçamentos Oficiais
CREATE TABLE orcamentos_oficiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'orcamento',
  titulo TEXT NOT NULL,
  cliente TEXT NOT NULL,
  evento TEXT,
  data_geracao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_validade TIMESTAMP WITH TIME ZONE NOT NULL,
  data_checkin TIMESTAMP WITH TIME ZONE NOT NULL,
  data_checkout TIMESTAMP WITH TIME ZONE NOT NULL,
  hora_entrada TEXT,
  hora_saida TEXT,
  temporada TEXT CHECK (temporada IN ('auto', 'baixa', 'alta')),
  itens JSONB NOT NULL DEFAULT '[]',
  observacoes TEXT,
  status TEXT CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'cancelado')) DEFAULT 'rascunho',
  assinatura TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_orcamentos_cliente ON orcamentos_oficiais (cliente);
CREATE INDEX idx_orcamentos_data_checkin ON orcamentos_oficiais (data_checkin);
CREATE INDEX idx_orcamentos_status ON orcamentos_oficiais (status);

-- 3. Orçamentos Rápidos
CREATE TABLE orcamentos_rapidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'orcamento_rapido',
  data_geracao TIMESTAMP WITH TIME ZONE NOT NULL,
  categoria_id UUID NOT NULL,
  data_checkin TIMESTAMP WITH TIME ZONE NOT NULL,
  data_checkout TIMESTAMP WITH TIME ZONE NOT NULL,
  numero_noites INTEGER NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_diaria DECIMAL(10,2) NOT NULL,
  tipo_temporada TEXT CHECK (tipo_temporada IN ('alta', 'baixa', 'misto')) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_orcamentos_rapidos_categoria ON orcamentos_rapidos (categoria_id);
CREATE INDEX idx_orcamentos_rapidos_data ON orcamentos_rapidos (data_checkin);

-- 4. Categorias de Quartos
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  capacidade_maxima INTEGER NOT NULL,
  preco_alta_cafe DECIMAL(10,2) NOT NULL,
  preco_alta_sem_cafe DECIMAL(10,2) NOT NULL,
  preco_baixa_cafe DECIMAL(10,2) NOT NULL,
  preco_baixa_sem_cafe DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  descricao TEXT,
  camas_casal INTEGER,
  camas_solteiro INTEGER,
  tipo_ocupacao_padrao TEXT CHECK (tipo_ocupacao_padrao IN ('', 'casal', 'solteiro')),
  numeros TEXT[],
  comodidades_selecionadas TEXT[],
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_categorias_ativo ON categorias (ativo);

-- 5. Configuração Geral (single row table)
CREATE TABLE config_geral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festividade TEXT,
  total_uhs INTEGER,
  comodidades_globais TEXT,
  precos JSONB NOT NULL,
  temporada JSONB NOT NULL,
  horarios JSONB NOT NULL,
  promocao JSONB NOT NULL,
  seguranca JSONB NOT NULL,
  orcamento JSONB NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure single row
CREATE UNIQUE INDEX idx_config_geral_single ON config_geral ((true));

-- 6. Escala Config (single row table)
CREATE TABLE escala_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuracao JSONB NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure single row
CREATE UNIQUE INDEX idx_escala_config_single ON escala_config ((true));

-- 7. Chaves de Criptografia (for portable encryption across machines)
CREATE TABLE chaves_criptografia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE, -- 'file_secret', 'backup_secret', 'backup_salt'
  chave TEXT NOT NULL,
  iv TEXT,
  salt TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Backups (audit/history)
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dados JSONB NOT NULL,
  tamanho_bytes INTEGER NOT NULL,
  versao TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_backups_criado_em ON backups (criado_em DESC);

-- RLS Policies (enable when needed)
-- ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orcamentos_oficiais ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orcamentos_rapidos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE config_geral ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE escala_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chaves_criptografia ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Example policies (customize based on auth requirements):
-- CREATE POLICY "Allow all for authenticated" ON configuracoes FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated" ON orcamentos_oficiais FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated" ON orcamentos_rapidos FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated" ON categorias FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated" ON config_geral FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated" ON escala_config FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated" ON chaves_criptografia FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated" ON backups FOR ALL TO authenticated USING (true);

-- Helper function to get single config_geral row
CREATE OR REPLACE FUNCTION get_config_geral()
RETURNS SETOF config_geral
LANGUAGE sql
AS $$
  SELECT * FROM config_geral LIMIT 1;
$$;

-- Helper function to get single escala_config row
CREATE OR REPLACE FUNCTION get_escala_config()
RETURNS SETOF escala_config
LANGUAGE sql
AS $$
  SELECT * FROM escala_config LIMIT 1;
$$;

-- Trigger to update atualizado_em timestamp
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_configuracoes_atualizado_em
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_orcamentos_oficiais_atualizado_em
  BEFORE UPDATE ON orcamentos_oficiais
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_orcamentos_rapidos_atualizado_em
  BEFORE UPDATE ON orcamentos_rapidos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_categorias_atualizado_em
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_config_geral_atualizado_em
  BEFORE UPDATE ON config_geral
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_escala_config_atualizado_em
  BEFORE UPDATE ON escala_config
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();