-- =====================================================================
-- 002_rls_policies.sql
-- Row Level Security. Regra central:
--   * admin da Fonsetech ve tudo;
--   * cliente ve SOMENTE dados da propria empresa;
--   * credenciais de acesso remoto: admin apenas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FUNÇÕES AUXILIARES
-- security definer + search_path fixo evita recursão de RLS e sequestro
-- de search_path (vetor clássico de escalonamento de privilégio).
-- ---------------------------------------------------------------------
create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and ativo
  );
$$;

create or replace function public.minha_empresa()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from public.profiles
  where id = auth.uid() and ativo;
$$;

revoke all on function public.eh_admin()      from public;
revoke all on function public.minha_empresa() from public;
grant execute on function public.eh_admin()      to authenticated;
grant execute on function public.minha_empresa() to authenticated;

-- ---------------------------------------------------------------------
-- HABILITAR RLS EM TUDO (padrão nega-tudo)
-- ---------------------------------------------------------------------
alter table public.empresas               enable row level security;
alter table public.profiles               enable row level security;
alter table public.maquinas               enable row level security;
alter table public.maquinas_acesso_remoto enable row level security;
alter table public.chamados               enable row level security;
alter table public.chamado_historico      enable row level security;
alter table public.agendamentos           enable row level security;
alter table public.materiais              enable row level security;
alter table public.material_empresas      enable row level security;

-- ---------------------------------------------------------------------
-- EMPRESAS
-- ---------------------------------------------------------------------
create policy empresas_admin_total on public.empresas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy empresas_cliente_le on public.empresas
  for select to authenticated
  using (id = public.minha_empresa());

-- cliente edita o próprio cadastro (aba "Minha empresa"), sem trocar de empresa
create policy empresas_cliente_edita on public.empresas
  for update to authenticated
  using (id = public.minha_empresa())
  with check (id = public.minha_empresa());

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
create policy profiles_admin_total on public.profiles
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy profiles_proprio on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- colegas da mesma empresa (para exibir nome do solicitante)
create policy profiles_mesma_empresa on public.profiles
  for select to authenticated
  using (empresa_id is not null and empresa_id = public.minha_empresa());

-- o usuário atualiza o próprio nome/telefone, NUNCA role/ativo/empresa_id
create policy profiles_atualiza_proprio on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and ativo = (select ativo from public.profiles where id = auth.uid())
    and empresa_id is not distinct from (select empresa_id from public.profiles where id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- MÁQUINAS
-- Cliente LÊ as máquinas da empresa (para escolher no chamado), mas não
-- cadastra nem edita - o inventário é mantido pelo admin.
-- ---------------------------------------------------------------------
create policy maquinas_admin_total on public.maquinas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy maquinas_cliente_le on public.maquinas
  for select to authenticated
  using (empresa_id = public.minha_empresa() and ativo);

-- ---------------------------------------------------------------------
-- ACESSO REMOTO: SOMENTE ADMIN. Nenhuma policy para cliente.
-- ---------------------------------------------------------------------
create policy acesso_remoto_admin on public.maquinas_acesso_remoto
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- ---------------------------------------------------------------------
-- CHAMADOS
-- ---------------------------------------------------------------------
create policy chamados_admin_total on public.chamados
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy chamados_cliente_le on public.chamados
  for select to authenticated
  using (empresa_id = public.minha_empresa());

-- cliente abre chamado apenas para a própria empresa e em seu próprio nome
create policy chamados_cliente_abre on public.chamados
  for insert to authenticated
  with check (
    empresa_id = public.minha_empresa()
    and aberto_por = auth.uid()
    and status in ('Aberto', 'Urgente')
    and responsavel_id is null
  );

-- ---------------------------------------------------------------------
-- HISTÓRICO
-- Notas internas (interno = true) ficam invisíveis para o cliente.
-- ---------------------------------------------------------------------
create policy historico_admin_total on public.chamado_historico
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy historico_cliente_le on public.chamado_historico
  for select to authenticated
  using (
    not interno
    and exists (
      select 1 from public.chamados c
      where c.id = chamado_id and c.empresa_id = public.minha_empresa()
    )
  );

create policy historico_cliente_comenta on public.chamado_historico
  for insert to authenticated
  with check (
    autor_id = auth.uid()
    and not interno
    and exists (
      select 1 from public.chamados c
      where c.id = chamado_id and c.empresa_id = public.minha_empresa()
    )
  );

-- ---------------------------------------------------------------------
-- AGENDAMENTOS
-- ---------------------------------------------------------------------
create policy agenda_admin_total on public.agendamentos
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy agenda_cliente_le on public.agendamentos
  for select to authenticated
  using (empresa_id = public.minha_empresa());

create policy agenda_cliente_solicita on public.agendamentos
  for insert to authenticated
  with check (
    empresa_id = public.minha_empresa()
    and solicitado_por = auth.uid()
    and status = 'Solicitado'
    and data >= current_date
  );

-- ---------------------------------------------------------------------
-- MATERIAIS (Cursos e Downloads)
-- ---------------------------------------------------------------------
create policy materiais_admin_total on public.materiais
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy materiais_cliente_le on public.materiais
  for select to authenticated
  using (
    publicado
    and (
      not exists (select 1 from public.material_empresas me where me.material_id = id)
      or exists (
        select 1 from public.material_empresas me
        where me.material_id = id and me.empresa_id = public.minha_empresa()
      )
    )
  );

create policy material_empresas_admin on public.material_empresas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy material_empresas_cliente_le on public.material_empresas
  for select to authenticated
  using (empresa_id = public.minha_empresa());
