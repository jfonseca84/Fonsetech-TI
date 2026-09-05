-- ============================================================================
-- FonseDesk: Migração 003 — Evolução Multi-tenant, CRM, Financeiro e Agenda
-- ============================================================================

-- 1. Campos extras na tabela empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS inscricao_estadual text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS site text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS responsavel_cargo text,
  ADD COLUMN IF NOT EXISTS responsavel_email citext,
  ADD COLUMN IF NOT EXISTS responsavel_whatsapp text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS status_cliente text DEFAULT 'Ativo',
  ADD COLUMN IF NOT EXISTS inicio_contrato date,
  ADD COLUMN IF NOT EXISTS renovacao_contrato date,
  ADD COLUMN IF NOT EXISTS valor_mensal numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS condicoes_comerciais text,
  ADD COLUMN IF NOT EXISTS obs_internas text,
  ADD COLUMN IF NOT EXISTS situacao_financeira text DEFAULT 'Em dia';

-- 2. Tabela de Planos
CREATE TABLE IF NOT EXISTS public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  valor_mensal numeric(10,2) NOT NULL DEFAULT 0,
  valor_anual numeric(10,2) DEFAULT 0,
  franquia_atendimentos text,
  servicos_incluidos jsonb DEFAULT '[]'::jsonb,
  servicos_adicionais text,
  beneficios text,
  status text DEFAULT 'Ativo',
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_leitura" ON public.planos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "planos_admin_tudo" ON public.planos
  FOR ALL TO authenticated USING (public.eh_admin()) WITH CHECK (public.eh_admin());

-- Seed de planos básicos se ainda não existirem
INSERT INTO public.planos (nome, descricao, valor_mensal, franquia_atendimentos, servicos_incluidos)
VALUES
  ('Básico', 'Suporte essencial para microempresas e escritórios.', 299.00, 'Até 5 chamados/mês', '["Suporte remoto", "Atendimento em horário comercial", "Backup verificado"]'::jsonb),
  ('Profissional', 'Gestão completa de TI para pequenas e médias empresas.', 599.00, 'Até 15 chamados/mês + 1 visita mensal', '["Suporte remoto ilimitado", "1 visita presencial inclusa", "Gestão de antivírus", "Monitoramento de rede"]'::jsonb),
  ('Premium', 'TI sob medida com visitas presenciais e plantão.', 999.00, 'Chamados ilimitados + 3 visitas presenciais', '["Suporte 24/7 de emergência", "Visitas preventivas", "Consultoria de infraestrutura", "Inventário completo"]'::jsonb)
ON CONFLICT (nome) DO NOTHING;

-- 3. Campos extras em chamados (Cobrança do atendimento)
ALTER TABLE public.chamados
  ADD COLUMN IF NOT EXISTS cobranca_tipo text DEFAULT 'incluido_no_plano',
  ADD COLUMN IF NOT EXISTS cobranca_valor numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cobranca_status text DEFAULT 'faz_parte_do_plano';

-- 4. Campos extras em agendamentos
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS contato_nome text,
  ADD COLUMN IF NOT EXISTS contato_whatsapp text,
  ADD COLUMN IF NOT EXISTS duracao_minutos integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS modalidade text DEFAULT 'visita_empresa',
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS cobranca_tipo text DEFAULT 'incluido_no_plano',
  ADD COLUMN IF NOT EXISTS cobranca_valor numeric(10,2) DEFAULT 0;

-- 5. Materiais e permissões por Plano
ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS disponibilidade text DEFAULT 'todas',
  ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.material_planos (
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  plano_nome text NOT NULL,
  criado_em timestamptz DEFAULT now(),
  PRIMARY KEY (material_id, plano_nome)
);

ALTER TABLE public.material_planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "material_planos_admin" ON public.material_planos
  FOR ALL TO authenticated USING (public.eh_admin()) WITH CHECK (public.eh_admin());

CREATE POLICY "material_planos_leitura" ON public.material_planos
  FOR SELECT TO authenticated USING (true);

-- 6. CRM Comercial (Leads)
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  empresa_nome text,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  telefone text,
  whatsapp text,
  email citext,
  origem text DEFAULT 'Site',
  servico_interesse text,
  responsavel_comercial text DEFAULT 'Fonsetech TI',
  valor_estimado numeric(10,2) DEFAULT 0,
  probabilidade integer DEFAULT 50,
  data_prevista date,
  etapa text DEFAULT 'novo_lead',
  observacoes text,
  historico jsonb DEFAULT '[]'::jsonb,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_leads_admin" ON public.crm_leads
  FOR ALL TO authenticated USING (public.eh_admin()) WITH CHECK (public.eh_admin());

-- 7. Propostas Comerciais
CREATE TABLE IF NOT EXISTS public.crm_propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  servico text NOT NULL,
  descricao text,
  quantidade integer DEFAULT 1,
  valor numeric(10,2) DEFAULT 0,
  desconto numeric(10,2) DEFAULT 0,
  valor_final numeric(10,2) DEFAULT 0,
  condicoes_pagamento text,
  validade date,
  status text DEFAULT 'rascunho',
  observacoes text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.crm_propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_propostas_admin" ON public.crm_propostas
  FOR ALL TO authenticated USING (public.eh_admin()) WITH CHECK (public.eh_admin());

-- 8. Financeiro — Contas a Receber
CREATE TABLE IF NOT EXISTS public.financeiro_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  categoria text DEFAULT 'Mensalidade',
  origem text DEFAULT 'manual',
  chamado_id uuid REFERENCES public.chamados(id) ON DELETE SET NULL,
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  proposta_id uuid REFERENCES public.crm_propostas(id) ON DELETE SET NULL,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  data_emissao date DEFAULT current_date,
  data_vencimento date NOT NULL,
  data_pagamento date,
  forma_pagamento text,
  status text DEFAULT 'em_aberto',
  observacao text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

-- RLS Financeiro: Admin vê tudo
CREATE POLICY "financeiro_admin_tudo" ON public.financeiro_lancamentos
  FOR ALL TO authenticated USING (public.eh_admin()) WITH CHECK (public.eh_admin());

-- RLS Financeiro: Cliente vê SOMENTE de sua empresa
CREATE POLICY "financeiro_cliente_propria_empresa" ON public.financeiro_lancamentos
  FOR SELECT TO authenticated USING (
    empresa_id = public.minha_empresa()
  );

-- 9. Auditoria Logs
CREATE TABLE IF NOT EXISTS public.auditoria_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome text,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  acao text NOT NULL,
  recurso text NOT NULL,
  recurso_id text,
  resultado text DEFAULT 'sucesso',
  detalhes jsonb DEFAULT '{}'::jsonb,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_admin_tudo" ON public.auditoria_logs
  FOR ALL TO authenticated USING (public.eh_admin()) WITH CHECK (public.eh_admin());

CREATE POLICY "auditoria_inserir_autenticado" ON public.auditoria_logs
  FOR INSERT TO authenticated WITH CHECK (true);
