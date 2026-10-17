-- ==============================================================================
-- BANCO DE DADOS — SICILIANO GRAMAS E PISOS (Supabase, plano Free)
-- Como usar: Supabase > SQL Editor > New query > cole TUDO > clique em "Run".
-- Pode rodar mais de uma vez sem problema.
-- ==============================================================================

-- 1. Tabela que guarda os pedidos de orçamento enviados pelo site
CREATE TABLE IF NOT EXISTS public.orcamentos (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    nome        TEXT    NOT NULL CHECK (char_length(nome) BETWEEN 3 AND 100),
    telefone    TEXT    NOT NULL CHECK (char_length(telefone) BETWEEN 10 AND 20),
    produto     TEXT    NOT NULL CHECK (char_length(produto) BETWEEN 1 AND 150),
    area        NUMERIC CHECK (area > 0 AND area <= 1000000),
    mensagem    TEXT    CHECK (mensagem IS NULL OR char_length(mensagem) <= 1000),
    status      TEXT    NOT NULL DEFAULT 'novo'
                CHECK (status IN ('novo', 'em_atendimento', 'finalizado'))
);

COMMENT ON TABLE public.orcamentos IS 'Pedidos de orçamento enviados pelo site da Siciliano';

-- 2. Liga a proteção por linha (RLS). Sem política, ninguém acessa nada.
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- 3. Única permissão pública: o site pode INSERIR um orçamento novo.
--    Visitantes NÃO podem ler, alterar nem apagar orçamentos.
DROP POLICY IF EXISTS "Site pode inserir orcamentos" ON public.orcamentos;
CREATE POLICY "Site pode inserir orcamentos"
    ON public.orcamentos
    FOR INSERT
    TO anon
    WITH CHECK (status = 'novo');

-- Você consulta os orçamentos pelo painel do Supabase (Table Editor),
-- que usa acesso de administrador e não depende dessas políticas.

-- 4. Índice para listar os mais recentes rapidamente
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON public.orcamentos (created_at DESC);

-- Remove a política antiga de leitura, caso tenha rodado uma versão anterior
DROP POLICY IF EXISTS "Permitir leitura apenas para autenticados" ON public.orcamentos;
DROP POLICY IF EXISTS "Permitir insercao de orcamentos" ON public.orcamentos;
