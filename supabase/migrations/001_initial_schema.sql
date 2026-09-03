-- =====================================================================
-- 001_initial_schema.sql
-- Fonsetech - Central de Chamados
-- Schema derivado dos dashboards de Cliente e Admin do protótipo.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- TIPOS
-- ---------------------------------------------------------------------
create type papel_usuario   as enum ('cliente', 'admin');
create type status_chamado  as enum ('Aberto', 'Em atendimento', 'Aguardando cliente', 'Urgente', 'Resolvido');
create type prioridade_nvl  as enum ('Baixa', 'Média', 'Alta', 'Urgente');
create type tipo_rede       as enum ('DHCP', 'Estático');
create type tipo_agendamento as enum ('visita', 'reuniao');
create type status_agenda   as enum ('Solicitado', 'Confirmado', 'Concluído', 'Cancelado');
create type tipo_material   as enum ('pdf', 'ppt', 'programa');

-- ---------------------------------------------------------------------
-- EMPRESAS (clientes da Fonsetech)
-- ---------------------------------------------------------------------
create table public.empresas (
  id                uuid primary key default gen_random_uuid(),
  razao_social      text not null,
  cnpj              text unique,
  endereco          text,
  email             citext,
  telefone          text,
  -- bloco "Responsáveis" do cadastro do cliente
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

comment on column public.empresas.tem_ti_interno is 'Marcado pelo cliente na aba Minha empresa';

-- ---------------------------------------------------------------------
-- PROFILES (1:1 com auth.users) - define papel e empresa
-- Não há cadastro público: o admin cria o usuário e o convida.
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  empresa_id    uuid references public.empresas(id) on delete restrict,
  nome          text not null,
  telefone      text,
  role          papel_usuario not null default 'cliente',
  ativo         boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- cliente obrigatoriamente pertence a uma empresa; admin da Fonsetech não
  constraint cliente_tem_empresa
    check ((role = 'cliente' and empresa_id is not null)
        or (role = 'admin'))
);

create index profiles_empresa_idx on public.profiles(empresa_id);
create index profiles_role_idx    on public.profiles(role);

-- ---------------------------------------------------------------------
-- MÁQUINAS (inventário cadastrado pelo admin, por empresa)
-- ---------------------------------------------------------------------
create table public.maquinas (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  nome          text not null,                -- "Máquina 06", "Servidor ARQ-01"
  usuario       text,                         -- "João Ferreira", "Compartilhado"
  setor         text,
  -- ficha técnica
  modelo        text,
  cpu           text,
  memoria       text,
  disco         text,
  sistema       text,                         -- "Windows 11 Pro"
  -- configuração de rede
  rede          tipo_rede not null default 'DHCP',
  ip            inet,
  mascara       text,
  gateway       inet,
  dns           text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, nome),
  -- IP fixo é obrigatório quando a rede é estática
  constraint ip_obrigatorio_se_estatico
    check (rede <> 'Estático' or ip is not null)
);

create index maquinas_empresa_idx on public.maquinas(empresa_id);

-- ---------------------------------------------------------------------
-- ACESSO REMOTO - tabela SEPARADA por segurança.
-- Credenciais de acesso remoto NUNCA devem ser lidas pelo cliente.
-- Como o RLS do Postgres é por linha (não por coluna), isolar em outra
-- tabela é o que garante que a senha não vaze para o frontend do cliente.
-- ---------------------------------------------------------------------
create table public.maquinas_acesso_remoto (
  maquina_id    uuid primary key references public.maquinas(id) on delete cascade,
  ferramenta    text not null default 'AnyDesk',   -- AnyDesk, RDP, SSH...
  host          text,                              -- "531 902 774" ou "192.168.0.10:3389"
  login         text,
  senha_cifrada bytea,                             -- ver funções abaixo
  observacoes   text,
  atualizado_em timestamptz not null default now()
);

comment on table public.maquinas_acesso_remoto is
  'Somente admin. A senha é gravada cifrada; a chave vive em Vault/variável de servidor, nunca no frontend.';

-- ---------------------------------------------------------------------
-- CHAMADOS
-- ---------------------------------------------------------------------
create sequence public.chamado_seq start 4831;

create table public.chamados (
  id             uuid primary key default gen_random_uuid(),
  numero         text not null unique default ('CH-' || nextval('public.chamado_seq')),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  maquina_id     uuid references public.maquinas(id) on delete set null,
  -- preenchido quando a máquina não está cadastrada ("outra")
  equipamento_livre text,
  usuario_equipamento text,
  aberto_por     uuid not null references public.profiles(id) on delete restrict,
  responsavel_id uuid references public.profiles(id) on delete set null,
  titulo         text not null,
  categoria      text not null,
  descricao      text not null,
  prioridade     prioridade_nvl not null default 'Média',
  status         status_chamado not null default 'Aberto',
  aberto_em      timestamptz not null default now(),
  resolvido_em   timestamptz,
  atualizado_em  timestamptz not null default now(),
  constraint titulo_nao_vazio check (length(btrim(titulo)) > 0),
  constraint descricao_nao_vazia check (length(btrim(descricao)) > 0)
);

create index chamados_empresa_idx  on public.chamados(empresa_id);
create index chamados_status_idx   on public.chamados(status);
create index chamados_resp_idx     on public.chamados(responsavel_id);
create index chamados_aberto_idx   on public.chamados(aberto_em desc);
-- busca por título/número no painel admin
create index chamados_busca_idx    on public.chamados
  using gin (to_tsvector('portuguese', titulo || ' ' || coalesce(descricao, '')));

-- ---------------------------------------------------------------------
-- HISTÓRICO DO CHAMADO (timeline exibida nos dois dashboards)
-- ---------------------------------------------------------------------
create table public.chamado_historico (
  id          uuid primary key default gen_random_uuid(),
  chamado_id  uuid not null references public.chamados(id) on delete cascade,
  autor_id    uuid references public.profiles(id) on delete set null,
  autor_nome  text not null,        -- preservado mesmo se o perfil for removido
  texto       text not null,
  interno     boolean not null default false,  -- true = nota visível só para admin
  criado_em   timestamptz not null default now()
);

create index historico_chamado_idx on public.chamado_historico(chamado_id, criado_em);

-- ---------------------------------------------------------------------
-- AGENDAMENTOS (visitas técnicas e reuniões)
-- ---------------------------------------------------------------------
create table public.agendamentos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  solicitado_por uuid references public.profiles(id) on delete set null,
  tipo         tipo_agendamento not null,
  data         date not null,
  hora         time not null,
  assunto      text not null,
  endereco     text,               -- visita presencial
  formato      text,               -- "Online" | "Presencial" (reunião)
  status       status_agenda not null default 'Solicitado',
  criado_em    timestamptz not null default now()
);

create index agendamentos_empresa_idx on public.agendamentos(empresa_id);
create index agendamentos_data_idx    on public.agendamentos(data);

-- ---------------------------------------------------------------------
-- MATERIAIS (Cursos: PDF/PPT | Downloads: programas)
-- ---------------------------------------------------------------------
create table public.materiais (
  id          uuid primary key default gen_random_uuid(),
  tipo        tipo_material not null,
  titulo      text not null,
  descricao   text,
  categoria   text,               -- Segurança, Infraestrutura, Redes, Produtividade
  nivel       text,               -- Básico | Intermediário
  paginas     integer,            -- páginas (pdf) ou slides (ppt)
  -- cursos: caminho no Storage; downloads: link do Google Drive
  arquivo_path text,
  link_externo text,
  versao      text,
  tamanho     text,
  sistema     text,
  destaque    boolean not null default false,
  publicado   boolean not null default false,
  criado_em   timestamptz not null default now(),
  -- só faz sentido publicar com arquivo ou link definido
  constraint material_publicado_tem_fonte
    check (not publicado or (arquivo_path is not null or link_externo is not null))
);

create index materiais_tipo_idx on public.materiais(tipo) where publicado;

-- Liberação opcional por empresa. Sem linha aqui = liberado para todos.
create table public.material_empresas (
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

create trigger t_empresas_upd before update on public.empresas
  for each row execute function public.tocar_atualizado_em();
create trigger t_profiles_upd before update on public.profiles
  for each row execute function public.tocar_atualizado_em();
create trigger t_maquinas_upd before update on public.maquinas
  for each row execute function public.tocar_atualizado_em();
create trigger t_chamados_upd before update on public.chamados
  for each row execute function public.tocar_atualizado_em();

-- Marca resolvido_em automaticamente e registra a mudança no histórico
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

create trigger t_chamados_mudanca before update on public.chamados
  for each row execute function public.registrar_mudanca_chamado();

-- Primeira entrada do histórico ao abrir o chamado
create or replace function public.historico_abertura()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.chamado_historico (chamado_id, autor_id, autor_nome, texto)
  values (new.id, new.aberto_por,
          coalesce((select nome from public.profiles where id = new.aberto_por), 'Cliente'),
          'Chamado aberto pelo cliente');
  return new;
end $$;

create trigger t_chamados_abertura after insert on public.chamados
  for each row execute function public.historico_abertura();
