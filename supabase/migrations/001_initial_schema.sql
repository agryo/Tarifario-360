-- =====================================================
-- SCHEMA INICIAL - TARIFÁRIO 360
-- Apenas 5 tabelas reais usadas pelo sistema
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CONFIG_GERAL - Configuração geral do sistema (single row)
-- =====================================================
CREATE TABLE config_geral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuracao JSONB NOT NULL,
    seguranca JSONB NOT NULL DEFAULT '{"senhaHash": "", "senhaSalt": ""}',
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida (single row table)
CREATE INDEX idx_config_geral_id ON config_geral(id);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_config_geral_updated_at
    BEFORE UPDATE ON config_geral
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. CATEGORIAS - Categorias de quartos (UHs)
-- =====================================================
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    capacidade_maxima INTEGER NOT NULL DEFAULT 2,
    preco_alta_cafe NUMERIC(10,2) NOT NULL DEFAULT 0,
    preco_alta_sem_cafe NUMERIC(10,2) NOT NULL DEFAULT 0,
    preco_baixa_cafe NUMERIC(10,2) NOT NULL DEFAULT 0,
    preco_baixa_sem_cafe NUMERIC(10,2) NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    descricao TEXT,
    camas_casal INTEGER NOT NULL DEFAULT 1,
    camas_solteiro INTEGER NOT NULL DEFAULT 0,
    tipo_ocupacao_padrao TEXT,
    numeros TEXT[] DEFAULT '{}',
    comodidades_selecionadas TEXT[] DEFAULT '{}',
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categorias_ativo ON categorias(ativo);
CREATE INDEX idx_categorias_nome ON categorias(nome);

CREATE TRIGGER update_categorias_updated_at
    BEFORE UPDATE ON categorias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ORCAMENTOS_OFICIAIS - Orçamentos oficiais
-- =====================================================
CREATE TABLE orcamentos_oficiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orcamento TEXT NOT NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_validade TIMESTAMPTZ,
    cliente_nome TEXT,
    cliente_email TEXT,
    cliente_telefone TEXT,
    cliente_documento TEXT,
    checkin TIMESTAMPTZ NOT NULL,
    checkout TIMESTAMPTZ NOT NULL,
    qtd_adultos INTEGER NOT NULL DEFAULT 1,
    qtd_criancas INTEGER NOT NULL DEFAULT 0,
    qtd_criancas_ate_5 INTEGER NOT NULL DEFAULT 0,
    qtd_criancas_6_a_10 INTEGER NOT NULL DEFAULT 0,
    qtd_criancas_11_a_15 INTEGER NOT NULL DEFAULT 0,
    categoria_id UUID REFERENCES categorias(id),
    tipo_ocupacao TEXT,
    inclui_cafe BOOLEAN NOT NULL DEFAULT true,
    qtd_almoco INTEGER NOT NULL DEFAULT 0,
    qtd_janta INTEGER NOT NULL DEFAULT 0,
    qtd_lanche INTEGER NOT NULL DEFAULT 0,
    valor_diaria NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_total_hospedagem NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_total_refeicoes NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_total_energia NUMERIC(10,2) NOT NULL DEFAULT 0,
    desconto_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
    valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_total_geral NUMERIC(10,2) NOT NULL DEFAULT 0,
    sinal_percentual NUMERIC(5,2) NOT NULL DEFAULT 50,
    valor_sinal NUMERIC(10,2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orcamentos_oficiais_numero ON orcamentos_oficiais(numero_orcamento);
CREATE INDEX idx_orcamentos_oficiais_data_criacao ON orcamentos_oficiais(data_criacao);
CREATE INDEX idx_orcamentos_oficiais_status ON orcamentos_oficiais(status);
CREATE INDEX idx_orcamentos_oficiais_categoria ON orcamentos_oficiais(categoria_id);

CREATE TRIGGER update_orcamentos_oficiais_updated_at
    BEFORE UPDATE ON orcamentos_oficiais
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ESCALA_CONFIG - Configuração de escala de plantão
-- =====================================================
CREATE TABLE escala_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuracao JSONB NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escala_config_id ON escala_config(id);

CREATE TRIGGER update_escala_config_updated_at
    BEFORE UPDATE ON escala_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CHAVES_CRIPTOGRAFIA - Chaves de criptografia para backup
-- =====================================================
CREATE TABLE chaves_criptografia (
    nome TEXT PRIMARY KEY,
    chave TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_chaves_criptografia_updated_at
    BEFORE UPDATE ON chaves_criptografia
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) - Habilitar e criar policies
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE config_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos_oficiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE chaves_criptografia ENABLE ROW LEVEL SECURITY;

-- Policies para ANON (acesso público de leitura/escrita - app usa anon key)
-- NOTA: Em produção, considere usar service_role key no backend (API Vercel)
-- e manter apenas SELECT para anon

-- config_geral
CREATE POLICY "Allow all operations on config_geral" ON config_geral
    FOR ALL USING (true) WITH CHECK (true);

-- categorias
CREATE POLICY "Allow all operations on categorias" ON categorias
    FOR ALL USING (true) WITH CHECK (true);

-- orcamentos_oficiais
CREATE POLICY "Allow all operations on orcamentos_oficiais" ON orcamentos_oficiais
    FOR ALL USING (true) WITH CHECK (true);

-- escala_config
CREATE POLICY "Allow all operations on escala_config" ON escala_config
    FOR ALL USING (true) WITH CHECK (true);

-- chaves_criptografia
CREATE POLICY "Allow all operations on chaves_criptografia" ON chaves_criptografia
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- Configuração padrão (senha: 1234)
-- NOTA: O hash/salt são gerados dinamicamente pelo serviço na inicialização
-- Esta linha cria a linha vazia; o serviço preenche com defaults
INSERT INTO config_geral (configuracao, seguranca)
VALUES (
    '{
        "festividade": "🎊 Evento Especial",
        "totalUhs": 50,
        "comodidadesGlobais": "Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro",
        "precos": {
            "refeicoes": {"almoco": 45, "janta": 55, "lanche": 25},
            "kwh": 0.89
        },
        "temporada": {"altaInicio": "", "altaFim": ""},
        "horarios": {
            "cafe": {"inicio": "07:00", "fim": "10:00", "ativo": true},
            "almoco": {"inicio": "12:00", "fim": "14:00", "ativo": true},
            "lanche": {"inicio": "15:00", "fim": "17:00", "ativo": true},
            "jantar": {"inicio": "19:00", "fim": "21:00", "ativo": true}
        },
        "promocao": {
            "ativa": false,
            "desconto": 15,
            "minDiarias": 3,
            "texto": "Pagamento integral via Pix ou Dinheiro",
            "somenteAlta": true,
            "msgBaixa": false
        },
        "orcamento": {
            "textos": {
                "titulo": "Orçamento de Hospedagem",
                "configTitulo": "1. Configuração de Acomodação e Valores",
                "configDescricao": "A proposta contempla a estadia com café da manhã incluido...",
                "notaRefeicoes": "Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...",
                "cronograma": "Check-in: {checkinHora} do dia {checkinDataBr}.\\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\\n{mensagemHorasExtras}",
                "pagamento": "Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...",
                "observacoes": "Refeições: O café da manhã é cortesia da casa e já está incluso...",
                "rodape": "Setor de Reservas - Hotel Plaza"
            },
            "sinalPercentual": 50
        }
    }'::jsonb,
    '{"senhaHash": "", "senhaSalt": ""}'::jsonb
);

-- Categorias padrão
INSERT INTO categorias (nome, capacidade_maxima, preco_alta_cafe, preco_alta_sem_cafe, preco_baixa_cafe, preco_baixa_sem_cafe, ativo, descricao, camas_casal, camas_solteiro, tipo_ocupacao_padrao, numeros, comodidades_selecionadas)
VALUES
    ('Standard', 2, 380, 350, 280, 250, true, 'Quarto confortável', 1, 0, '', ARRAY['01', '02'], ARRAY['Wi-Fi', 'TV']),
    ('Luxo', 3, 580, 550, 430, 400, true, 'Quarto com vista para o mar', 1, 1, '', ARRAY['03', '04'], ARRAY['Wi-Fi', 'TV', 'Frigobar']);

-- Escala padrão
INSERT INTO escala_config (configuracao)
VALUES (
    '{
        "plantonistas": [
            {"nome": "Agryo", "ativo": true, "ordem": 1},
            {"nome": "Alex", "ativo": true, "ordem": 2}
        ],
        "inicioCiclo": "2025-01-01",
        "diasPlantao": 7,
        "folgaAposPlantao": 7
    }'::jsonb
);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para limpar todas as tabelas (usada pelo backup/restore)
CREATE OR REPLACE FUNCTION limpar_todas_tabelas()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    -- Ordem inversa de dependência
    DELETE FROM orcamentos_oficiais WHERE id != '00000000-0000-0000-0000-000000000000';
    DELETE FROM chaves_criptografia WHERE nome != 'dummy';
    DELETE FROM escala_config WHERE id != '00000000-0000-0000-0000-000000000000';
    DELETE FROM config_geral WHERE id != '00000000-0000-0000-0000-000000000000';
    DELETE FROM categorias WHERE id != '00000000-0000-0000-0000-000000000000';

    -- Reinsere dados padrão
    INSERT INTO config_geral (configuracao, seguranca)
    VALUES (
        '{
            "festividade": "🎊 Evento Especial",
            "totalUhs": 50,
            "comodidadesGlobais": "Frigobar, TV, Ar-condicionado, Wi-Fi, Hidro",
            "precos": {"refeicoes": {"almoco": 45, "janta": 55, "lanche": 25}, "kwh": 0.89},
            "temporada": {"altaInicio": "", "altaFim": ""},
            "horarios": {"cafe": {"inicio": "07:00", "fim": "10:00", "ativo": true}, "almoco": {"inicio": "12:00", "fim": "14:00", "ativo": true}, "lanche": {"inicio": "15:00", "fim": "17:00", "ativo": true}, "jantar": {"inicio": "19:00", "fim": "21:00", "ativo": true}},
            "promocao": {"ativa": false, "desconto": 15, "minDiarias": 3, "texto": "Pagamento integral via Pix ou Dinheiro", "somenteAlta": true, "msgBaixa": false},
            "orcamento": {"textos": {"titulo": "Orçamento de Hospedagem", "configTitulo": "1. Configuração de Acomodação e Valores", "configDescricao": "A proposta contempla a estadia com café da manhã incluido...", "notaRefeicoes": "Obs.: As quantidades de refeições descritas na tabela referem-se ao consumo...", "cronograma": "Check-in: {checkinHora} do dia {checkinDataBr}.\\nCheck-out: {checkoutHora} do dia {checkoutDataBr}.\\n{mensagemHorasExtras}", "pagamento": "Forma de Pagamento: Sinal de {sinalPercentual}% do valor total ({totalGeral})...", "observacoes": "Refeições: O café da manhã é cortesia da casa e já está incluso...", "rodape": "Setor de Reservas - Hotel Plaza"}, "sinalPercentual": 50}
        }'::jsonb,
        '{"senhaHash": "", "senhaSalt": ""}'::jsonb
    );

    INSERT INTO categorias (nome, capacidade_maxima, preco_alta_cafe, preco_alta_sem_cafe, preco_baixa_cafe, preco_baixa_sem_cafe, ativo, descricao, camas_casal, camas_solteiro, tipo_ocupacao_padrao, numeros, comodidades_selecionadas)
    VALUES
        ('Standard', 2, 380, 350, 280, 250, true, 'Quarto confortável', 1, 0, '', ARRAY['01', '02'], ARRAY['Wi-Fi', 'TV']),
        ('Luxo', 3, 580, 550, 430, 400, true, 'Quarto com vista para o mar', 1, 1, '', ARRAY['03', '04'], ARRAY['Wi-Fi', 'TV', 'Frigobar']);

    INSERT INTO escala_config (configuracao)
    VALUES ('{"plantonistas": [{"nome": "Agryo", "ativo": true, "ordem": 1}, {"nome": "Alex", "ativo": true, "ordem": 2}], "inicioCiclo": "2025-01-01", "diasPlantao": 7, "folgaAposPlantao": 7}'::jsonb);
END;
$$;