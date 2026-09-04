-- =====================================================================
-- FONSEDESK - sistema de chamados da Fonsetech TI
-- 001_setup_completo.sql  ·  schema + RLS + storage, em UM script
--
-- Consolida (e substitui) os antigos 001_initial_schema / 002_rls_policies
-- / 003_storage. Idempotente: pode ser executado novamente sem erro e sem
-- destruir dados. NAO contem DROP TABLE, DROP TYPE nem DELETE.
--
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run.
--
-- SEGURO EM BANCO JA POPULADO: cada objeto e criado somente se ainda nao
-- existir (tipos via pg_type, tabelas via if not exists, policies recriadas
-- com drop policy if exists). Rodar de novo com admin, empresas e chamados
-- ja cadastrados nao apaga nem sobrescreve dado nenhum.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- TIPOS (enums usados pelo frontend em src/ui/tokens.js)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'papel_usuario') then
    DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'papel_usuario'
    ) THEN
        CREATE TYPE papel_usuario AS ENUM ('cliente', 'admin');
    END IF;
END $$;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'status_chamado') then
    create type status_chamado as enum ('Aberto', 'Em atendimento', 'Aguardando cliente', 'Urgente', 'Resolvido');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'prioridade_nvl') then
    create type prioridade_nvl as enum ('Baixa', 'Média', 'Alta', 'Urgente');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_rede') then
    create type tipo_rede as enum ('DHCP', 'Estático');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_agendamento') then
    create type tipo_agendamento as enum ('visita', 'reuniao');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'status_agenda') then
    create type status_agenda as enum ('Solicitado', 'Confirmado', 'Concluído', 'Cancelado');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_material') then
    create type tipo_material as enum ('pdf', 'ppt', 'programa');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- EMPRESAS (clientes da Fonsetech)
-- ---------------------------------------------------------------------
create table if not exists public.empresas (
  id                uuid primary key default gen_random_uuid(),
  razao_social      text not null,
  cnpj              text unique,
  endereco          text,
  email             citext,
  telefone          text,
  tem_ti_interno    boolean not null default false,
  responsavel_ti    text,
  gerente_geral     text,
  diretor           text,
  plano             text not null default 'Essencial',
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  constraint responsavel_ti_coerente
    check (not tem_ti_interno or responsavel_ti is not null)
);

-- ---------------------------------------------------------------------
-- PROFILES (1:1 com auth.users) - define papel e empresa
-- Nao existe cadastro publico: o admin cria o usuario no Auth e vincula aqui.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  empresa_id    uuid references public.empresas(id) on delete restrict,
  nome          text not null,
  telefone      text,
  role          papel_usuario not null default 'cliente',
  ativo         boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint cliente_tem_empresa
    check ((role = 'cliente' and empresa_id is not null) or (role = 'admin'))
);

create index if not exists profiles_empresa_idx on public.profiles(empresa_id);
create index if not exists profiles_role_idx    on public.profiles(role);

-- ---------------------------------------------------------------------
-- MAQUINAS (inventario mantido pelo admin, por empresa)
-- ---------------------------------------------------------------------
create table if not exists public.maquinas (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  nome          text not null,
  usuario       text,
  setor         text,
  modelo        text,
  cpu           text,
  memoria       text,
  disco         text,
  sistema       text,
  rede          tipo_rede not null default 'DHCP',
  ip            inet,
  mascara       text,
  gateway       inet,
  dns           text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, nome),
  constraint ip_obrigatorio_se_estatico
    check (rede <> 'Estático' or ip is not null)
);

create index if not exists maquinas_empresa_idx on public.maquinas(empresa_id);

-- ---------------------------------------------------------------------
-- ACESSO REMOTO - tabela separada por seguranca.
-- O RLS do Postgres e por linha, nao por coluna: isolar as credenciais em
-- outra tabela e o que garante que elas nunca cheguem ao frontend do cliente.
-- ---------------------------------------------------------------------
create table if not exists public.maquinas_acesso_remoto (
  maquina_id    uuid primary key references public.maquinas(id) on delete cascade,
  ferramenta    text not null default 'AnyDesk',
  host          text,
  login         text,
  senha_cifrada bytea,
  observacoes   text,
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CHAMADOS
-- ---------------------------------------------------------------------
create sequence if not exists public.chamado_seq start 4831;

create table if not exists public.chamados (
  id                  uuid primary key default gen_random_uuid(),
  numero              text not null unique default ('CH-' || nextval('public.chamado_seq')),
  empresa_id          uuid not null references public.empresas(id) on delete cascade,
  maquina_id          uuid references public.maquinas(id) on delete set null,
  equipamento_livre   text,
  usuario_equipamento text,
  aberto_por          uuid not null references public.profiles(id) on delete restrict,
  responsavel_id      uuid references public.profiles(id) on delete set null,
  titulo              text not null,
  categoria           text not null,
  descricao           text not null,
  prioridade          prioridade_nvl not null default 'Média',
  status              status_chamado not null default 'Aberto',
  aberto_em           timestamptz not null default now(),
  resolvido_em        timestamptz,
  atualizado_em       timestamptz not null default now(),
  constraint titulo_nao_vazio   check (length(btrim(titulo)) > 0),
  constraint descricao_nao_vazia check (length(btrim(descricao)) > 0)
);

create index if not exists chamados_empresa_idx on public.chamados(empresa_id);
create index if not exists chamados_status_idx  on public.chamados(status);
create index if not exists chamados_resp_idx    on public.chamados(responsavel_id);
create index if not exists chamados_aberto_idx  on public.chamados(aberto_em desc);
create index if not exists chamados_busca_idx   on public.chamados
  using gin (to_tsvector('portuguese', titulo || ' ' || coalesce(descricao, '')));

-- ---------------------------------------------------------------------
-- HISTORICO DO CHAMADO (timeline dos dois dashboards)
-- ---------------------------------------------------------------------
create table if not exists public.chamado_historico (
  id          uuid primary key default gen_random_uuid(),
  chamado_id  uuid not null references public.chamados(id) on delete cascade,
  autor_id    uuid references public.profiles(id) on delete set null,
  autor_nome  text not null,
  texto       text not null,
  interno     boolean not null default false,
  criado_em   timestamptz not null default now()
);

create index if not exists historico_chamado_idx on public.chamado_historico(chamado_id, criado_em);

-- ---------------------------------------------------------------------
-- AGENDAMENTOS (visitas tecnicas e reunioes)
-- ---------------------------------------------------------------------
create table if not exists public.agendamentos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  solicitado_por uuid references public.profiles(id) on delete set null,
  tipo           tipo_agendamento not null,
  data           date not null,
  hora           time not null,
  assunto        text not null,
  endereco       text,
  formato        text,
  status         status_agenda not null default 'Solicitado',
  criado_em      timestamptz not null default now()
);

create index if not exists agendamentos_empresa_idx on public.agendamentos(empresa_id);
create index if not exists agendamentos_data_idx    on public.agendamentos(data);

-- ---------------------------------------------------------------------
-- MATERIAIS (Cursos: pdf/ppt · Downloads: programa)
-- ---------------------------------------------------------------------
create table if not exists public.materiais (
  id           uuid primary key default gen_random_uuid(),
  tipo         tipo_material not null,
  titulo       text not null,
  descricao    text,
  categoria    text,
  nivel        text,
  paginas      integer,
  arquivo_path text,
  link_externo text,
  versao       text,
  tamanho      text,
  sistema      text,
  destaque     boolean not null default false,
  publicado    boolean not null default false,
  criado_em    timestamptz not null default now(),
  constraint material_publicado_tem_fonte
    check (not publicado or (arquivo_path is not null or link_externo is not null))
);

create index if not exists materiais_tipo_idx on public.materiais(tipo) where publicado;

-- Liberacao opcional por empresa. Sem linha aqui = liberado para todas.
create table if not exists public.material_empresas (
  material_id uuid not null references public.materiais(id) on delete cascade,
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  primary key (material_id, empresa_id)
);

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists t_empresas_upd on public.empresas;
create trigger t_empresas_upd before update on public.empresas
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists t_profiles_upd on public.profiles;
create trigger t_profiles_upd before update on public.profiles
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists t_maquinas_upd on public.maquinas;
create trigger t_maquinas_upd before update on public.maquinas
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists t_chamados_upd on public.chamados;
create trigger t_chamados_upd before update on public.chamados
  for each row execute function public.tocar_atualizado_em();

-- Marca resolvido_em e registra as mudancas no historico
create or replace function public.registrar_mudanca_chamado()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  nome_autor text;
begin
  if new.status = 'Resolvido' and old.status <> 'Resolvido' then
    new.resolvido_em := now();
  elsif new.status <> 'Resolvido' then
    new.resolvido_em := null;
  end if;

  select nome into nome_autor from public.profiles where id = auth.uid();
  nome_autor := coalesce(nome_autor, 'Sistema');

  if new.status <> old.status then
    insert into public.chamado_historico (chamado_id, autor_id, autor_nome, texto)
    values (new.id, auth.uid(), nome_autor, 'Status alterado para ' || new.status);
  end if;
  if new.prioridade <> old.prioridade then
    insert into public.chamado_historico (chamado_id, autor_id, autor_nome, texto)
    values (new.id, auth.uid(), nome_autor, 'Prioridade alterada para ' || new.prioridade);
  end if;
  if coalesce(new.responsavel_id::text, '') <> coalesce(old.responsavel_id::text, '') then
    insert into public.chamado_historico (chamado_id, autor_id, autor_nome, texto)
    values (new.id, auth.uid(), nome_autor,
            'Atribuído para ' || coalesce((select nome from public.profiles where id = new.responsavel_id), 'Não atribuído'));
  end if;
  return new;
end $$;

drop trigger if exists t_chamados_mudanca on public.chamados;
create trigger t_chamados_mudanca before update on public.chamados
  for each row execute function public.registrar_mudanca_chamado();

-- Primeira entrada do historico ao abrir o chamado
create or replace function public.historico_abertura()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.chamado_historico (chamado_id, autor_id, autor_nome, texto)
  values (new.id, new.aberto_por,
          coalesce((select nome from public.profiles where id = new.aberto_por), 'Cliente'),
          'Chamado aberto pelo cliente');
  return new;
end $$;

drop trigger if exists t_chamados_abertura on public.chamados;
create trigger t_chamados_abertura after insert on public.chamados
  for each row execute function public.historico_abertura();

-- =====================================================================
-- ROW LEVEL SECURITY
--   admin da Fonsetech -> ve e gerencia tudo
--   cliente            -> somente dados da propria empresa
--   acesso remoto      -> admin apenas
--
-- Todas as funcoes auxiliares sao security definer com search_path fixo:
-- isso evita recursao infinita de RLS (42P17) quando a policy de uma
-- tabela precisa consultar a propria tabela, e fecha o vetor de sequestro
-- de search_path.
-- =====================================================================
create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and ativo
  );
$$;

create or replace function public.minha_empresa()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from public.profiles where id = auth.uid() and ativo;
$$;

create or replace function public.meu_role()
returns papel_usuario language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.meu_ativo()
returns boolean language sql stable security definer set search_path = public as $$
  select ativo from public.profiles where id = auth.uid();
$$;

create or replace function public.minha_empresa_bruta()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.eh_admin()             from public;
revoke all on function public.minha_empresa()        from public;
revoke all on function public.meu_role()             from public;
revoke all on function public.meu_ativo()            from public;
revoke all on function public.minha_empresa_bruta()  from public;
grant execute on function public.eh_admin()            to authenticated;
grant execute on function public.minha_empresa()       to authenticated;
grant execute on function public.meu_role()            to authenticated;
grant execute on function public.meu_ativo()           to authenticated;
grant execute on function public.minha_empresa_bruta() to authenticated;

-- padrao nega-tudo em todas as tabelas
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
drop policy if exists empresas_admin_total   on public.empresas;
create policy empresas_admin_total on public.empresas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists empresas_cliente_le    on public.empresas;
create policy empresas_cliente_le on public.empresas
  for select to authenticated
  using (id = public.minha_empresa());

-- cliente edita o proprio cadastro (aba "Minha empresa"), sem trocar de empresa
drop policy if exists empresas_cliente_edita on public.empresas;
create policy empresas_cliente_edita on public.empresas
  for update to authenticated
  using (id = public.minha_empresa())
  with check (id = public.minha_empresa());

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
drop policy if exists profiles_admin_total       on public.profiles;
create policy profiles_admin_total on public.profiles
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists profiles_proprio           on public.profiles;
create policy profiles_proprio on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- colegas da mesma empresa (exibir nome de quem abriu o chamado)
drop policy if exists profiles_mesma_empresa     on public.profiles;
create policy profiles_mesma_empresa on public.profiles
  for select to authenticated
  using (empresa_id is not null and empresa_id = public.minha_empresa());

-- o usuario atualiza o proprio nome/telefone, NUNCA role/ativo/empresa_id
drop policy if exists profiles_atualiza_proprio  on public.profiles;
create policy profiles_atualiza_proprio on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.meu_role()
    and ativo = public.meu_ativo()
    and empresa_id is not distinct from public.minha_empresa_bruta()
  );

-- ---------------------------------------------------------------------
-- MAQUINAS - cliente le o inventario da empresa (para escolher no chamado),
-- mas nao cadastra nem edita.
-- ---------------------------------------------------------------------
drop policy if exists maquinas_admin_total on public.maquinas;
create policy maquinas_admin_total on public.maquinas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists maquinas_cliente_le  on public.maquinas;
create policy maquinas_cliente_le on public.maquinas
  for select to authenticated
  using (empresa_id = public.minha_empresa() and ativo);

-- ---------------------------------------------------------------------
-- ACESSO REMOTO: somente admin. Nenhuma policy para cliente.
-- ---------------------------------------------------------------------
drop policy if exists acesso_remoto_admin on public.maquinas_acesso_remoto;
create policy acesso_remoto_admin on public.maquinas_acesso_remoto
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- ---------------------------------------------------------------------
-- CHAMADOS
-- ---------------------------------------------------------------------
drop policy if exists chamados_admin_total  on public.chamados;
create policy chamados_admin_total on public.chamados
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists chamados_cliente_le   on public.chamados;
create policy chamados_cliente_le on public.chamados
  for select to authenticated
  using (empresa_id = public.minha_empresa());

-- cliente abre chamado apenas para a propria empresa e em seu proprio nome
drop policy if exists chamados_cliente_abre on public.chamados;
create policy chamados_cliente_abre on public.chamados
  for insert to authenticated
  with check (
    empresa_id = public.minha_empresa()
    and aberto_por = auth.uid()
    and status in ('Aberto', 'Urgente')
    and responsavel_id is null
  );

-- ---------------------------------------------------------------------
-- HISTORICO - notas internas ficam invisiveis para o cliente
-- ---------------------------------------------------------------------
drop policy if exists historico_admin_total     on public.chamado_historico;
create policy historico_admin_total on public.chamado_historico
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists historico_cliente_le      on public.chamado_historico;
create policy historico_cliente_le on public.chamado_historico
  for select to authenticated
  using (
    not interno
    and exists (
      select 1 from public.chamados c
      where c.id = chamado_id and c.empresa_id = public.minha_empresa()
    )
  );

drop policy if exists historico_cliente_comenta on public.chamado_historico;
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
drop policy if exists agenda_admin_total       on public.agendamentos;
create policy agenda_admin_total on public.agendamentos
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists agenda_cliente_le        on public.agendamentos;
create policy agenda_cliente_le on public.agendamentos
  for select to authenticated
  using (empresa_id = public.minha_empresa());

-- data no passado e recusada tambem no banco, nao so no formulario
drop policy if exists agenda_cliente_solicita  on public.agendamentos;
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
drop policy if exists materiais_admin_total         on public.materiais;
create policy materiais_admin_total on public.materiais
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists materiais_cliente_le          on public.materiais;
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

drop policy if exists material_empresas_admin       on public.material_empresas;
create policy material_empresas_admin on public.material_empresas
  for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists material_empresas_cliente_le  on public.material_empresas;
create policy material_empresas_cliente_le on public.material_empresas
  for select to authenticated
  using (empresa_id = public.minha_empresa());

-- =====================================================================
-- STORAGE - bucket privado das apostilas (aba Cursos).
-- Downloads de programas usam link_externo (Google Drive), fora do Storage.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', false)
on conflict (id) do nothing;

drop policy if exists materiais_storage_admin      on storage.objects;
create policy materiais_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'materiais' and public.eh_admin())
  with check (bucket_id = 'materiais' and public.eh_admin());

-- cliente le apenas arquivos de materiais publicados e liberados para a empresa.
-- No frontend: supabase.storage.from('materiais').createSignedUrl(path, 3600)
drop policy if exists materiais_storage_cliente_le on storage.objects;
create policy materiais_storage_cliente_le on storage.objects
  for select to authenticated
  using (
    bucket_id = 'materiais'
    and exists (
      select 1 from public.materiais m
      where m.arquivo_path = storage.objects.name
        and m.publicado
        and (
          not exists (select 1 from public.material_empresas me where me.material_id = m.id)
          or exists (
            select 1 from public.material_empresas me
            where me.material_id = m.id and me.empresa_id = public.minha_empresa()
          )
        )
    )
  );

-- =====================================================================
-- PRIMEIRO ADMINISTRADOR (acao manual, sem senha no SQL)
--
-- 1. Authentication > Users > Add user: informe e-mail e senha (a senha fica
--    no painel do Supabase, nunca neste arquivo nem no Git).
-- 2. Copie o UUID do usuario criado.
-- 3. Rode, trocando o UUID e o nome:
--
--    insert into public.profiles (id, nome, role, ativo)
--    values ('00000000-0000-0000-0000-000000000000', 'Nome do Admin', 'admin', true)
--    on conflict (id) do update set role = 'admin', ativo = true;
--
-- Um cliente segue o mesmo caminho, mas com role 'cliente' e empresa_id
-- preenchido (cliente sem empresa e bloqueado pelo RLS por definicao).
--
-- Nao ha dados estruturais a inserir: status, prioridades e categorias sao
-- enums do proprio banco, ja criados acima.
-- =====================================================================
